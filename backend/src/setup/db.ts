import type { FastifyInstance } from 'fastify';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>;
    pgPool: Pool;
  }
}

export async function registerDb(app: FastifyInstance) {
  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(pool);
  app.decorate('db', db);
  app.decorate('pgPool', pool);

  app.addHook('onClose', async () => {
    await pool.end();
  });
}