import { test, expect, request } from '@playwright/test';

async function adminLogin(ctx: any, baseURL: string) {
  const res = await ctx.post(`${baseURL}/auth/login`, {
    data: { username: 'ADMIN2', password: 'Admin@1234' },
    headers: { 'content-type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
  return res.headers()['set-cookie'];
}

test('admin can manage halls, movies, shows and users can see them', async ({ request, baseURL }) => {
  const ctx = request;
  const cookie = await adminLogin(ctx, baseURL!);

  // create hall
  const hallRes = await ctx.post(`${baseURL}/halls`, {
    headers: { 'content-type': 'application/json', cookie },
    data: { name: 'Hall A', total_columns: 10, total_rows: 8 },
  });
  expect(hallRes.status()).toBe(201);

  // list halls
  const hallsRes = await ctx.get(`${baseURL}/halls`);
  expect(hallsRes.ok()).toBeTruthy();
  const hallsJson = await hallsRes.json();
  const hall = hallsJson.halls.find((h: any) => h.name === 'Hall A');
  expect(hall).toBeTruthy();

  // create movie
  const movieRes = await ctx.post(`${baseURL}/movies`, {
    headers: { 'content-type': 'application/json', cookie },
    data: { name: 'Movie X', ticket_price: 150 },
  });
  expect(movieRes.status()).toBe(201);

  // list movies
  const moviesRes = await ctx.get(`${baseURL}/movies`);
  const moviesJson = await moviesRes.json();
  const movie = moviesJson.movies.find((m: any) => m.name === 'Movie X');
  expect(movie).toBeTruthy();

  // update movie
  const updMovie = await ctx.put(`${baseURL}/movies`, {
    headers: { 'content-type': 'application/json', cookie },
    data: { id: movie.movieId, name: 'Movie X2', ticket_price: 200 },
  });
  expect(updMovie.ok()).toBeTruthy();

  // create show
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 20:00:00`;
  const showRes = await ctx.post(`${baseURL}/shows`, {
    headers: { 'content-type': 'application/json', cookie },
    data: { movie_id: movie.movieId, hall_id: hall.hall_id, show_time: ts },
  });
  expect(showRes.status()).toBe(201);

  // list shows (now..+5 days)
  const showsRes = await ctx.get(`${baseURL}/shows`);
  expect(showsRes.ok()).toBeTruthy();

  // showtimes by movie and date
  const showTimes = await ctx.get(`${baseURL}/movies/showtime`, {
    params: { id: movie.movieId, date: now.toISOString() },
  });
  expect(showTimes.ok()).toBeTruthy();
});