import { test, expect, request } from '@playwright/test';

const headers = { 'content-type': 'application/json' };

test('auth flow: captcha -> signup -> login -> ping -> logout', async ({ request, baseURL }) => {
  const ctx = request;

  // captcha
  const capRes = await ctx.get(`${baseURL}/auth/captcha`);
  expect(capRes.ok()).toBeTruthy();
  const cap = await capRes.json();
  const capCookie = capRes.headers()['set-cookie'];
  expect(cap.hasError).toBeFalsy();
  expect(cap.captcha).toBeTruthy();

  const username = `user_${Date.now()}`;
  const payload = {
    username,
    fullname: 'Test User',
    email: `${username}@example.com`,
    password: 'User@1234',
    mobile: '7894561230',
    captcha: cap.captcha,
  };

  // signup using captcha cookie
  const signupRes = await ctx.post(`${baseURL}/auth/signup`, { data: payload, headers: { ...headers, cookie: capCookie } });
  expect(signupRes.status()).toBe(201);

  // login
  const loginRes = await ctx.post(`${baseURL}/auth/login`, { data: { username, password: 'User@1234' }, headers });
  expect(loginRes.ok()).toBeTruthy();
  const cookies = loginRes.headers()['set-cookie'];
  expect(cookies).toBeTruthy();

  // ping with cookie
  const pingRes = await ctx.get(`${baseURL}/auth/ping`, { headers: { cookie: cookies } });
  expect(pingRes.ok()).toBeTruthy();
  const ping = await pingRes.json();
  expect(ping.user).toBeTruthy();

  // logout
  const logoutRes = await ctx.post(`${baseURL}/auth/logout`, { headers: { cookie: cookies } });
  expect(logoutRes.ok()).toBeTruthy();
});