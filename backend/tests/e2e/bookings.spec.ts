import { test, expect } from '@playwright/test';

async function adminLogin(request: any, baseURL: string) {
  const res = await request.post(`${baseURL}/auth/login`, {
    data: { username: 'ADMIN2', password: 'Admin@1234' },
    headers: { 'content-type': 'application/json' },
  });
  return res.headers()['set-cookie'];
}

async function userLogin(request: any, baseURL: string, username: string, password: string) {
  const res = await request.post(`${baseURL}/auth/login`, {
    data: { username, password },
    headers: { 'content-type': 'application/json' },
  });
  return res.headers()['set-cookie'];
}

test('user can book tickets and check-in', async ({ request, baseURL }) => {
  const cookieAdmin = await adminLogin(request, baseURL!);

  // Create hall and movie and show
  const hallRes = await request.post(`${baseURL}/halls`, {
    headers: { 'content-type': 'application/json', cookie: cookieAdmin },
    data: { name: 'Hall B', total_columns: 5, total_rows: 5 },
  });
  const hallsList = await request.get(`${baseURL}/halls`);
  const hallsJson = await hallsList.json();
  const hall = hallsJson.halls.find((h: any) => h.name === 'Hall B');

  const movieRes = await request.post(`${baseURL}/movies`, {
    headers: { 'content-type': 'application/json', cookie: cookieAdmin },
    data: { name: 'Movie Y', ticket_price: 100 },
  });
  const moviesList = await request.get(`${baseURL}/movies`);
  const moviesJson = await moviesList.json();
  const movie = moviesJson.movies.find((m: any) => m.name === 'Movie Y');

  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 18:00:00`;
  await request.post(`${baseURL}/shows`, {
    headers: { 'content-type': 'application/json', cookie: cookieAdmin },
    data: { movie_id: movie.movieId, hall_id: hall.hall_id, show_time: ts },
  });

  const showsRes = await request.get(`${baseURL}/shows`);
  const showsJson = await showsRes.json();
  const showMovie = showsJson.shows.find((s: any) => s.movie_id === movie.movieId);

  // Login as normal user
  const userCookie = await userLogin(request, baseURL!, 'USER1', 'User@1234');

  // Show availability
  const showDetailRes = await request.get(`${baseURL}/bookings/show`, { params: { id: showMovie.movie_id } });
  expect(showDetailRes.ok()).toBeTruthy();

  // Book two tickets seat 1 and 2
  const bookRes = await request.post(`${baseURL}/bookings/booktickets`, {
    headers: { 'content-type': 'application/json', cookie: userCookie },
    data: { show_id: showMovie.movie_id, sequence_numbers: '1,2' },
  });
  expect(bookRes.ok()).toBeTruthy();

  // List bookings
  const bookingsRes = await request.get(`${baseURL}/bookings`, { headers: { cookie: userCookie } });
  const bookingsJson = await bookingsRes.json();
  expect(bookingsJson.bookings.length).toBeGreaterThan(0);

  const first = bookingsJson.bookings[0];

  // Check-in via QR data format "user_id:booking_id"
  const checkinRes = await request.post(`${baseURL}/bookings/checkin`, {
    headers: { 'content-type': 'application/json', cookie: userCookie },
    data: { qr_data: `${first.user_id}:${first.booking_id}` },
  });
  expect(checkinRes.ok()).toBeTruthy();

  // Check-in again -> should say Already Checked In (still 200 but error object)
  const checkinRes2 = await request.post(`${baseURL}/bookings/checkin`, {
    headers: { 'content-type': 'application/json', cookie: userCookie },
    data: { qr_data: `${first.user_id}:${first.booking_id}` },
  });
  expect(checkinRes2.ok()).toBeTruthy();
});