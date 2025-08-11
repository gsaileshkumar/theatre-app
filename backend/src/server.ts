import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import dotenv from 'dotenv';
import { registerRoutes } from './setup/routes';
import { registerDb } from './setup/db';

dotenv.config();

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

export async function build() {
  await app.register(fastifyHelmet);
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['https://binge-watch.netlify.app'],
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'change-me',
    cookieName: 'sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    },
  });

  if (process.env.SKIP_DB_FOR_TESTS !== 'true') {
    await registerDb(app);
  }
  await registerRoutes(app);

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ hasError: true, status: 'Route unavailable' });
  });

  return app;
}

build()
  .then((app) => app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' }))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });