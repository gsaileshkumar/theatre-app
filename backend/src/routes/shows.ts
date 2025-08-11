import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { shows, movies } from '../db/schema';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { RES_ERROR, RES_FAILURE, RES_SUCCESS } from './_shared';

const showBodySchema = z.object({
  show_id: z.number().optional(),
  movie_id: z.number().int().positive(),
  hall_id: z.number().int().positive(),
  show_time: z.string().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/),
  show_current_status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export default async function showRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    try {
      const now = new Date();
      const fiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const rows = await app.db
        .select({ name: movies.name, ticket_price: movies.ticketPrice, movie_id: movies.movieId })
        .from(shows)
        .innerJoin(movies, eq(shows.movieId, movies.movieId))
        .where(and(eq(shows.currentStatus, sql`'ACTIVE'`), gt(shows.showTime, now), lt(shows.showTime, fiveDays)))
        .groupBy(movies.name, movies.ticketPrice, movies.movieId);
      return reply.code(200).send({ shows: rows, ...RES_SUCCESS });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.post('/', async (request, reply) => {
    try {
      if ((request as any).session?.user?.role !== 'ADMIN') return reply.code(401).send(RES_FAILURE);
      const { movie_id, hall_id, show_time } = showBodySchema.parse(request.body);
      const userId = (request as any).session.user!.id;
      await app.db.insert(shows).values({ movieId: movie_id, hallId: hall_id, showTime: new Date(show_time), createdBy: userId, updatedBy: userId, currentStatus: 'ACTIVE' });
      return reply.code(201).send(RES_SUCCESS);
    } catch {
      return reply.code(500).send(RES_ERROR);
    }
  });

  app.put('/', async (request, reply) => {
    try {
      if ((request as any).session?.user?.role !== 'ADMIN') return reply.code(401).send(RES_FAILURE);
      const { movie_id, hall_id, show_time, show_id, show_current_status } = showBodySchema.extend({ show_id: z.number(), show_current_status: z.enum(['ACTIVE', 'INACTIVE']) }).parse(request.body);
      const userId = (request as any).session.user!.id;
      const result = await app.db
        .update(shows)
        .set({ movieId: movie_id, hallId: hall_id, showTime: new Date(show_time), updatedBy: userId, updatedAt: new Date(), currentStatus: show_current_status })
        .where(eq(shows.showId, show_id));
      if ((result as any).rowCount === 0) return reply.code(404).send(RES_ERROR);
      return reply.code(200).send(RES_SUCCESS);
    } catch {
      return reply.code(500).send(RES_ERROR);
    }
  });
}