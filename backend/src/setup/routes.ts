import type { FastifyInstance } from 'fastify';
import authRoutes from '../routes/auth';
import movieRoutes from '../routes/movies';
import hallRoutes from '../routes/halls';
import showRoutes from '../routes/shows';
import bookingRoutes from '../routes/bookings';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(movieRoutes, { prefix: '/movies' });
  await app.register(hallRoutes, { prefix: '/halls' });
  await app.register(showRoutes, { prefix: '/shows' });
  await app.register(bookingRoutes, { prefix: '/bookings' });
}