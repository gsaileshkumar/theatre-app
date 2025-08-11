import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { RES_ERROR, RES_FAILURE, RES_SUCCESS, RES_UNAUTHORIZED } from './_shared';

const usernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9]+$/);
const passwordSchema = z.string().min(8).max(100);

const signupSchema = z.object({
  username: usernameSchema,
  fullname: z.string().min(3).max(50),
  email: z.string().email(),
  password: passwordSchema,
  mobile: z.string().regex(/^[789]\d{9}$/),
  captcha: z.string(),
});

const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/signup', async (request, reply) => {
    try {
      const { username, fullname, email, password, mobile, captcha } = signupSchema.parse(request.body);
      const session = (request as any).session as any;
      if (!session?.captcha || captcha !== session.captcha) {
        const newCap = Math.floor(100000 + Math.random() * 900000).toString();
        if (session) session.captcha = newCap;
        return reply.code(400).send({ ...RES_FAILURE, message: 'Invalid captcha', captcha: newCap });
      }

      const existingByEmail = await app.db.select().from(users).where(eq(users.email, email));
      if (existingByEmail.length > 0) {
        const newCap = Math.floor(100000 + Math.random() * 900000).toString();
        if (session) session.captcha = newCap;
        return reply.code(409).send({ ...RES_ERROR, status: 'User already exists', captcha: newCap });
      }

      const hashed = await bcrypt.hash(password, 10);
      await app.db.insert(users).values({
        userName: username.toUpperCase(),
        fullName: fullname,
        email,
        password: hashed,
        mobile,
        role: 'USER',
      });
      if (session) session.captcha = null;
      return reply.code(201).send(RES_SUCCESS);
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.post('/login', async (request, reply) => {
    try {
      const { username, password } = loginSchema.parse(request.body);
      const rows = await app.db.select().from(users).where(eq(users.userName, username.toUpperCase()))
        .limit(1);
      if (rows.length === 0) return reply.code(401).send(RES_UNAUTHORIZED);
      const userRow = rows[0];
      const match = await bcrypt.compare(password, userRow.password);
      if (!match) return reply.code(401).send(RES_UNAUTHORIZED);
      const user = { id: userRow.userId!, role: userRow.role as 'ADMIN' | 'USER', full_name: userRow.fullName };
      (request as any).session.user = user;
      return reply.code(200).send({ ...RES_SUCCESS, message: 'Logged in', user, cookieExpiryTime: 60 * 60 * 1000 });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.get('/ping', async (request, reply) => {
    try {
      const uid = (request as any).session?.user?.id as number | undefined;
      if (!uid) return reply.code(401).send(RES_UNAUTHORIZED);
      const rows = await app.db.select().from(users).where(eq(users.userId, uid)).limit(1);
      if (rows.length === 0) return reply.code(401).send(RES_UNAUTHORIZED);
      const u = rows[0];
      const user = { id: u.userId!, role: u.role as 'ADMIN' | 'USER', full_name: u.fullName };
      return reply.code(200).send({ ...RES_SUCCESS, user, cookieExpiryTime: 60 * 60 * 1000 });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.post('/logout', async (request, reply) => {
    try {
      (request as any).session.user = null;
      reply.clearCookie('sid');
      return reply.code(200).send({ ...RES_SUCCESS, message: 'Logged out' });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });

  app.get('/captcha', async (request, reply) => {
    try {
      const cap = Math.floor(100000 + Math.random() * 900000).toString();
      (request as any).session.captcha = cap;
      return reply.code(200).send({ ...RES_SUCCESS, captcha: cap });
    } catch {
      return reply.code(500).send(RES_FAILURE);
    }
  });
}