import express from 'express';
import helmet from 'helmet'
import cors from 'cors';
import shows from './routes/shows';
import movies from './routes/movies';
import bookings from './routes/bookings';
import halls from './routes/halls';
import auth from './routes/auth';
import session from 'express-session';
import { isValidUserMiddleware } from './middleware/authorization';
import { COOKIE_EXPIRY_TIME_IN_MS } from './config';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  credentials: true,
  origin: 'https://binge-watch.netlify.app'
}));
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(
  session({
    proxy: true,
    secret: 'ohmysecret',
    cookie: {
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      maxAge: COOKIE_EXPIRY_TIME_IN_MS,
    },
  })
);

app.use('/auth', auth);

app.use(isValidUserMiddleware);

app.use('/shows', shows);
app.use('/movies', movies);
app.use('/bookings', bookings);
app.use('/halls', halls);

app.use((req, res) => {
  return res.status(404).send({
    status: 'Route unavailable',
  });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
