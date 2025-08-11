import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { bookingSummary, bookings, halls, shows } from '../db/schema';
import { and, eq } from 'drizzle-orm';
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
      const client = await app.pgPool.connect();
      try {
        const { sequence_numbers, show_id } = request.body as z.infer<typeof bookTicketsSchema>;
        const seqNumArray = sequence_numbers.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n));
        if (seqNumArray.length === 0) return reply.code(400).send(RES_FAILURE);

        await client.query('BEGIN');

        // validate seat range
        const hallRes = await client.query(
          `SELECT HALL_TOTAL_COLUMNS AS total_columns, HALL_TOTAL_ROWS AS total_rows FROM SHOWS INNER JOIN HALLS ON SHOW_HALL_ID = HALL_ID WHERE SHOW_ID = $1`,
          [show_id]
        );
        const { total_columns, total_rows } = hallRes.rows[0] as any;
        const maxSeat = total_columns * total_rows;
        if (seqNumArray.some((n) => n <= 0 || n > maxSeat)) {
          await client.query('ROLLBACK');
          return reply.code(400).send({ ...RES_ERROR, message: 'Invalid Entries' });
        }

        // lock and check taken seats
        const takenRes = await client.query(
          `SELECT 1 FROM BOOKINGS WHERE BOOKING_SHOW_ID = $1 AND BOOKING_SEQUENCE_NUMBER = ANY($2) AND BOOKING_STATUS = 'TAKEN' FOR UPDATE`,
          [show_id, seqNumArray]
        );
        if (takenRes.rowCount !== 0) {
          await client.query('ROLLBACK');
          return reply.code(409).send({ ...RES_ERROR, message: 'Already booked' });
        }

        const userId = (request as any).session?.user?.id as number | undefined;
        if (!userId) {
          await client.query('ROLLBACK');
          return reply.code(401).send(RES_UNAUTHORIZED);
        }

        // batch insert bookings
        const values = seqNumArray
          .map((_, i) => `($1, $2, $${i + 3}, 'TAKEN', $1, $1)`) // userId, showId, seq, status, createdBy, updatedBy
          .join(',');
        await client.query(
          `INSERT INTO BOOKINGS (BOOKING_USER_ID, BOOKING_SHOW_ID, BOOKING_SEQUENCE_NUMBER, BOOKING_STATUS, BOOKING_CREATED_BY, BOOKING_UPDATED_BY) VALUES ${values}`,
          [userId, show_id, ...seqNumArray]
        );

        // create booking summary from latest state
        await client.query(
          `INSERT INTO BOOKING_SUMMARY (
            BOOKING_SUMMARY_MOVIE_ID,
            BOOKING_SUMMARY_MOVIE_NAME,
            BOOKING_SUMMARY_SHOW_TIME,
            BOOKING_SUMMARY_USER_ID,
            BOOKING_SUMMARY_SHOW_ID,
            BOOKING_SUMMARY_BOOKED_SEATS,
            BOOKING_SUMMARY_CONFIRMED,
            BOOKING_SUMMARY_CHECKED_IN,
            BOOKING_SUMMARY_CREATED_BY,
            BOOKING_SUMMARY_UPDATED_BY
          )
          SELECT m.MOVIE_ID, m.MOVIE_NAME, s.SHOW_TIME, $1, $2, (
            SELECT STRING_AGG(b.BOOKING_SEQUENCE_NUMBER::VARCHAR, ', ')
            FROM BOOKINGS b
            WHERE b.BOOKING_USER_ID = $1 AND b.BOOKING_SHOW_ID = $2
          ), true, false, $1, $1
          FROM SHOWS s
          INNER JOIN MOVIES m ON s.SHOW_MOVIE_ID = m.MOVIE_ID
          WHERE s.SHOW_ID = $2
          RETURNING BOOKING_SUMMARY_ID`,
          [userId, show_id]
        );

        await client.query('COMMIT');
        return reply.code(200).send({ ...RES_SUCCESS, message: 'Tickets successfully booked', sequence_numbers });
      } catch (e) {
        await client.query('ROLLBACK');
        return reply.code(500).send({ ...RES_FAILURE, error: 'Error while booking tickets' });
      } finally {
        client.release();
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