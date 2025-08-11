import { PostgreSqlContainer } from '@testcontainers/postgresql';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { spawn } from 'child_process';
import http from 'http';

function waitForServer(port: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryPing = () => {
      http.get({ host: '127.0.0.1', port, path: '/auth/captcha' }, (res) => {
        if (res.statusCode && res.statusCode < 500) resolve();
        else if (Date.now() - start > timeoutMs) reject(new Error('Server not ready'));
        else setTimeout(tryPing, 500);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Server not ready'));
        else setTimeout(tryPing, 500);
      });
    };
    tryPing();
  });
}

export default async function globalSetup() {
  const runtimePath = path.resolve(__dirname, '../../.test-runtime.json');
  let container: any;
  try {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('theatre')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();
  } catch (e) {
    fs.writeFileSync(runtimePath, JSON.stringify({ skip: true, reason: 'No container runtime available' }, null, 2));
    return;
  }

  const pool = new Pool({
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  const initSqlPath = path.resolve(__dirname, '../../../db/init.sql');
  const sqlText = fs.readFileSync(initSqlPath, 'utf-8');
  await pool.query(sqlText);

  const adminPass = await bcrypt.hash('Admin@1234', 10);
  const userPass = await bcrypt.hash('User@1234', 10);

  await pool.query(
    `INSERT INTO USERS (USER_NAME, USER_FULL_NAME, USER_EMAIL, USER_PASSWORD, USER_MOBILE_NUMBER, USER_ROLE, USER_CREATED_BY, USER_UPDATED_BY) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ['ADMIN2', 'Administrator 2', 'admin2@example.com', adminPass, '9999999999', 'ADMIN', 'TESTS', 'TESTS']
  );
  await pool.query(
    `INSERT INTO USERS (USER_NAME, USER_FULL_NAME, USER_EMAIL, USER_PASSWORD, USER_MOBILE_NUMBER, USER_ROLE, USER_CREATED_BY, USER_UPDATED_BY) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ['USER1', 'User One', 'user1@example.com', userPass, '8888888888', 'USER', 'TESTS', 'TESTS']
  );

  const serverEnv = {
    NODE_ENV: 'test',
    PORT: process.env.PORT || '3000',
    CORS_ORIGIN: 'http://127.0.0.1:5173',
    SESSION_SECRET: 'test-secret',
    PGHOST: container.getHost(),
    PGPORT: String(container.getPort()),
    PGUSER: container.getUsername(),
    PGPASSWORD: container.getPassword(),
    PGDATABASE: container.getDatabase(),
    PGSSL: 'false',
    SKIP_DB_FOR_TESTS: 'false',
  } as NodeJS.ProcessEnv;

  const child = spawn('npm', ['run', 'start:test'], {
    cwd: path.resolve(__dirname, '../../'),
    env: { ...process.env, ...serverEnv },
    stdio: 'inherit',
  });

  fs.writeFileSync(runtimePath, JSON.stringify({ serverEnv, containerId: container.getId(), pid: child.pid, skip: false }, null, 2));

  await pool.end();

  await waitForServer(Number(serverEnv.PORT));
}