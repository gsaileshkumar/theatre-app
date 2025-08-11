import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { movies, shows, halls } from '../db/schema';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { RES_ERROR, RES_FAILURE, RES_SUCCESS } from './_shared';

const movieBodySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  ticket_price: z.number().int().positive(),
});

export default async function movieRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    try {
      const rows = await app.db.select({
        movieId: movies.movieId,
        name: movies.name,
        ticket_price: movies.ticketPrice,
      }).from(movies);
      return reply.code(200).send({ movies: rows, ...RES_SUCCESS });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.get('/showtime', async (request, reply) => {
    try {
      const q = z.object({ id: z.coerce.number(), date: z.coerce.date() }).parse(request.query);
      const startOfDay = new Date(q.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);

      const rows = await app.db
        .select({ hall_name: halls.hallName, show_time: shows.showTime, show_id: shows.showId })
        .from(shows)
        .innerJoin(halls, eq(halls.hallId, shows.hallId))
        .where(and(eq(shows.movieId, q.id), eq(shows.currentStatus, sql`'ACTIVE'`), gt(shows.showTime, startOfDay), lt(shows.showTime, endOfDay)))
        .orderBy(halls.hallName, shows.showTime);

      const grouped: Record<string, typeof rows> = {};
      for (const r of rows) {
        grouped[r.hall_name] = (grouped[r.hall_name] || []).concat(r);
      }
      const moviesByHall = Object.entries(grouped).map(([hall_name, availability]) => ({ hall_name, availability }));
      return reply.code(200).send({ movies: moviesByHall, ...RES_SUCCESS });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.post('/', async (request, reply) => {
    try {
      if ((request as any).session?.user?.role !== 'ADMIN') return reply.code(401).send(RES_FAILURE);
      const { name, ticket_price } = movieBodySchema.parse(request.body);
      const userId = (request as any).session.user!.id;
      await app.db.insert(movies).values({ name, ticketPrice: ticket_price, createdBy: userId, updatedBy: userId });
      return reply.code(201).send(RES_SUCCESS);
    } catch {
      return reply.code(500).send(RES_ERROR);
    }
  });

  app.put('/', async (request, reply) => {
    try {
      if ((request as any).session?.user?.role !== 'ADMIN') return reply.code(401).send(RES_FAILURE);
      const { id, name, ticket_price } = movieBodySchema.extend({ id: z.number() }).parse(request.body);
      const userId = (request as any).session.user!.id;
      const result = await app.db
        .update(movies)
        .set({ name, ticketPrice: ticket_price, updatedBy: userId, updatedAt: new Date() })
        .where(eq(movies.movieId, id));
      if ((result as any).rowCount === 0) return reply.code(404).send(RES_ERROR);
      return reply.code(200).send(RES_SUCCESS);
    } catch {
      return reply.code(500).send(RES_ERROR);
    }
  });
}