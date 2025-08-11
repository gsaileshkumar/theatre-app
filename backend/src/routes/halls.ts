import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { halls } from '../db/schema';
import { eq } from 'drizzle-orm';
import { RES_ERROR, RES_FAILURE, RES_SUCCESS } from './_shared';

const hallBodySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  total_columns: z.number().int().positive(),
  total_rows: z.number().int().positive(),
});

export default async function hallRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    try {
      const rows = await app.db.select({
        hall_id: halls.hallId,
        name: halls.hallName,
        total_columns: halls.totalColumns,
        total_rows: halls.totalRows,
      }).from(halls);
      return reply.code(200).send({ halls: rows, ...RES_SUCCESS });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.post('/', {
    schema: { body: hallBodySchema },
    preHandler: (req, reply, done) => {
      if ((req as any).session?.user?.role !== 'ADMIN') { reply.code(401).send(RES_FAILURE); return; }
      done();
    },
    handler: async (request, reply) => {
      try {
        const { name, total_columns, total_rows } = request.body as z.infer<typeof hallBodySchema>;
        const userId = (request as any).session.user!.id;
        await app.db.insert(halls).values({
          hallName: name,
          totalColumns: total_columns,
          totalRows: total_rows,
          createdBy: userId,
          updatedBy: userId,
        });
        return reply.code(201).send(RES_SUCCESS);
      } catch {
        return reply.code(500).send(RES_ERROR);
      }
    },
  });

  app.put('/', {
    schema: { body: hallBodySchema.extend({ id: z.number() }) },
    preHandler: (req, reply, done) => {
      if ((req as any).session?.user?.role !== 'ADMIN') { reply.code(401).send(RES_FAILURE); return; }
      done();
    },
    handler: async (request, reply) => {
      try {
        const { id, name, total_columns, total_rows } = request.body as z.infer<typeof hallBodySchema> & { id: number };
        const userId = (request as any).session.user!.id;
        const result = await app.db
          .update(halls)
          .set({ hallName: name, totalColumns: total_columns, totalRows: total_rows, updatedBy: userId, updatedAt: new Date() })
          .where(eq(halls.hallId, id));
        if ((result as any).rowCount === 0) return reply.code(404).send(RES_ERROR);
        return reply.code(200).send(RES_SUCCESS);
      } catch {
        return reply.code(500).send(RES_ERROR);
      }
    },
  });
}