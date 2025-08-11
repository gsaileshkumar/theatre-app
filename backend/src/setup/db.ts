import type { FastifyInstance } from 'fastify';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>;
    pgPool: Pool;
  }
}

export async function registerDb(app: FastifyInstance) {
  let pool: Pool;

  if (process.env.USE_PG_MEM === 'true') {
    const { newDb } = await import('pg-mem');
    const mem = newDb({ autoCreateForeignKeyIndices: true });
    const adapter = mem.adapters.createPg();
    // @ts-ignore createPg exposes Pool compatible class
    const MemPool = adapter.Pool as typeof Pool;
    pool = new MemPool();

    // Initialize schema from init.sql
    const initSqlPath = path.resolve(__dirname, '../../../db/init.sql');
    let sqlText = fs.readFileSync(initSqlPath, 'utf-8');
    // Remove multi-table TRUNCATE not supported by pg-mem
    sqlText = sqlText.replace(/^\s*TRUNCATE[\s\S]*?;\s*$/mi, '');
    await pool.query(sqlText);

    // Seed known test users with known passwords
    const adminHash = await bcrypt.hash('Admin@1234', 10);
    const userHash = await bcrypt.hash('User@1234', 10);
    await pool.query(
      `INSERT INTO USERS (USER_NAME, USER_FULL_NAME, USER_EMAIL, USER_PASSWORD, USER_MOBILE_NUMBER, USER_ROLE, USER_CREATED_BY, USER_UPDATED_BY)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['ADMIN2', 'Administrator 2', 'admin2@example.com', adminHash, '9999999999', 'ADMIN', 'TESTS', 'TESTS']
    );
    await pool.query(
      `INSERT INTO USERS (USER_NAME, USER_FULL_NAME, USER_EMAIL, USER_PASSWORD, USER_MOBILE_NUMBER, USER_ROLE, USER_CREATED_BY, USER_UPDATED_BY)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      ['USER1', 'User One', 'user1@example.com', userHash, '8888888888', 'USER', 'TESTS', 'TESTS']
    );
  } else {
    pool = new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }

  const db = drizzle(pool);
  app.decorate('db', db);
  // @ts-ignore decorate pool for transaction use
  app.decorate('pgPool', pool);

  app.addHook('onClose', async () => {
    await pool.end();
  });
}