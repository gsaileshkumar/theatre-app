import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { bookingSummary, bookings, halls, shows, movies } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { RES_ERROR, RES_FAILURE, RES_SUCCESS, RES_UNAUTHORIZED } from './_shared';

const bookTicketsSchema = z.object({
  sequence_numbers: z.string().min(1),
  show_id: z.number().int().positive(),
});

export default async function bookingRoutes(app: FastifyInstance) {
  app.get('/show', {
    schema: { querystring: z.object({ id: z.coerce.number() }) },
    handler: async (request, reply) => {
      try {
        const { id } = request.query as { id: number };
        const [hallRow] = await app.db
          .select({
            hall_id: halls.hallId,
            hall_name: halls.hallName,
            total_columns: halls.totalColumns,
            total_rows: halls.totalRows,
          })
          .from(shows)
          .innerJoin(halls, eq(shows.hallId, halls.hallId))
          .where(eq(shows.showId, id));

        const availability = await app.db
          .select({ sequence_number: bookings.sequenceNumber, status: bookings.status })
          .from(bookings)
          .where(eq(bookings.showId, id));

        return reply.code(200).send({ hallDetail: hallRow, availability, ...RES_SUCCESS });
      } catch {
        return reply.code(500).send(RES_FAILURE);
      }
    },
  });

  app.get('/', async (request, reply) => {
    try {
      const userId = (request as any).session?.user?.id as number | undefined;
      if (!userId) return reply.code(401).send(RES_UNAUTHORIZED);
      const rows = await app.db
        .select({
          booking_id: bookingSummary.id,
          movie_id: bookingSummary.movieId,
          movie_name: bookingSummary.movieName,
          show_time: bookingSummary.showTime,
          user_id: bookingSummary.userId,
          show_id: bookingSummary.showId,
          booked_seats: bookingSummary.bookedSeats,
          confirmed: bookingSummary.confirmed,
          checked_in: bookingSummary.checkedIn,
        })
        .from(bookingSummary)
        .where(eq(bookingSummary.userId, userId));
      return reply.code(200).send({ bookings: rows, ...RES_SUCCESS });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.post('/booktickets', {
    schema: { body: bookTicketsSchema },
    handler: async (request, reply) => {
      try {
        const { sequence_numbers, show_id } = request.body as z.infer<typeof bookTicketsSchema>;
        const seqNumArray = sequence_numbers
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isInteger(n));
        if (seqNumArray.length === 0) return reply.code(400).send(RES_FAILURE);

        const userId = (request as any).session?.user?.id as number | undefined;
        if (!userId) return reply.code(401).send(RES_UNAUTHORIZED);

        await app.db.transaction(async (tx) => {
          // validate seat range
          const [hallRow] = await tx
            .select({ total_columns: halls.totalColumns, total_rows: halls.totalRows })
            .from(shows)
            .innerJoin(halls, eq(shows.hallId, halls.hallId))
            .where(eq(shows.showId, show_id));
          const maxSeat = hallRow.total_columns! * hallRow.total_rows!;
          if (seqNumArray.some((n) => n <= 0 || n > maxSeat)) {
            throw Object.assign(new Error('Invalid Entries'), { statusCode: 400 });
          }

          // check taken seats with explicit lock
          const arr = sql.raw('{' + seqNumArray.join(',') + '}');
          const taken = await tx.execute(sql`
            SELECT 1 FROM BOOKINGS WHERE BOOKING_SHOW_ID = ${show_id}
            AND BOOKING_SEQUENCE_NUMBER = ANY(${arr}::int[])
            AND BOOKING_STATUS = 'TAKEN' FOR UPDATE
          `);
          if ((taken as any).rowCount && (taken as any).rowCount !== 0) {
            throw Object.assign(new Error('Already booked'), { statusCode: 409 });
          }

          // insert bookings
          for (const seq of seqNumArray) {
            await tx.insert(bookings).values({
              userId: userId,
              showId: show_id,
              sequenceNumber: seq,
              status: 'TAKEN',
              createdBy: userId,
              updatedBy: userId,
            });
          }

          // build summary values
          const [showMovie] = await tx
            .select({
              mId: movies.movieId,
              mName: movies.name,
              sTime: shows.showTime,
            })
            .from(shows)
            .innerJoin(movies, eq(shows.movieId, movies.movieId))
            .where(eq(shows.showId, show_id));

          const seatsAgg = await tx
            .select({ s: sql<string>`STRING_AGG(${bookings.sequenceNumber}::VARCHAR, ', ')` })
            .from(bookings)
            .where(and(eq(bookings.userId, userId), eq(bookings.showId, show_id)));

          await tx.insert(bookingSummary).values({
            movieId: showMovie.mId!,
            movieName: showMovie.mName!,
            showTime: showMovie.sTime!,
            userId,
            showId: show_id,
            bookedSeats: seatsAgg[0]?.s ?? '',
            confirmed: true,
            checkedIn: false,
            createdBy: userId,
            updatedBy: userId,
          });
        });

        return reply.code(200).send({ ...RES_SUCCESS, message: 'Tickets successfully booked', sequence_numbers });
      } catch (e: any) {
        const code = e?.statusCode ?? 500;
        if (code === 400) return reply.code(400).send({ ...RES_ERROR, message: 'Invalid Entries' });
        if (code === 409) return reply.code(409).send({ ...RES_ERROR, message: 'Already booked' });
        return reply.code(500).send({ ...RES_FAILURE, error: 'Error while booking tickets' });
      }
    },
  });

  app.post('/checkin', {
    schema: { body: z.object({ qr_data: z.string() }) },
    handler: async (request, reply) => {
      try {
        const { qr_data } = request.body as { qr_data: string };
        const [userIdStr, summaryIdStr] = qr_data.split(':');
        const userId = (request as any).session?.user?.id as number | undefined;
        if (!userId) return reply.code(401).send(RES_UNAUTHORIZED);
        const summaryId = Number(summaryIdStr);
        const rows = await app.db
          .select({ checked_in: bookingSummary.checkedIn })
          .from(bookingSummary)
          .where(and(eq(bookingSummary.userId, Number(userIdStr)), eq(bookingSummary.id, summaryId)));
        if (rows.length === 0) return reply.code(404).send(RES_ERROR);
        if (rows[0].checked_in) return reply.code(200).send({ ...RES_ERROR, status: 'Already Checked In' });
        await app.db
          .update(bookingSummary)
          .set({ checkedIn: true, updatedAt: new Date(), updatedBy: userId })
          .where(eq(bookingSummary.id, summaryId));
        return reply.code(200).send(RES_SUCCESS);
      } catch {
        return reply.code(500).send(RES_FAILURE);
      }
    },
  });
}