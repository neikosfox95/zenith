import './helpers/env.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app, config, teardown } from './helpers/app.js';

test.after(teardown);

// ============================================================
// BOOT + HEALTH
// Regression: the app could not even be imported (EACCES on a hardcoded
// '/app/backend/uploads'), and once it did boot it exposed almost no routes
// because every one of them was mounted inside connectDB()'s try block.
// ============================================================

test('GET /health — liveness probe answers 200 with no auth and no DB', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.uptimeSeconds, 'number');
});

test('GET /health/ready — reports 503 while the database is down', async () => {
  const res = await request(app).get('/health/ready');
  assert.equal(res.status, 503, 'readiness must fail when Mongo is unreachable');
  assert.equal(res.body.status, 'not-ready');
  assert.equal(res.body.database.connected, false);
});

test('GET /api/health — detailed status is honest about being degraded', async () => {
  const res = await request(app).get('/api/health');
  // Regression: this used to return status:'ok' unconditionally, even with
  // Mongo down, so monitoring could never detect the outage.
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.database, 'disconnected');
  assert.equal(res.body.components.database.connected, false);
  assert.ok(Array.isArray(res.body.warnings));
  assert.ok(res.body.warnings.length > 0, 'missing integrations must be reported');

  // The health payload is unauthenticated — it must not leak secrets.
  const raw = JSON.stringify(res.body);
  assert.ok(!raw.includes('supersecret'));
  assert.ok(!/mongodb(\+srv)?:\/\/[^"]*@/.test(raw), 'connection string credentials leaked');
});

test('health endpoints are exempt from the API rate limiter', async () => {
  // Regression: the limiter's skip list only covered /api/health and /health,
  // so a k8s readiness probe on /health/ready would eventually 429 itself.
  for (let i = 0; i < 40; i += 1) {
    const res = await request(app).get('/health/ready');
    assert.notEqual(res.status, 429, `probe ${i} was rate limited`);
  }
});

// ============================================================
// ROUTES ARE MOUNTED EVEN WHEN THE DB IS DOWN
// ============================================================

test('routes stay mounted when Mongo is unreachable (503, not 404)', async () => {
  const checks = [
    ['post', '/api/login'],
    ['post', '/api/auth/register'],
    ['get', '/api/creators'],
    ['get', '/api/streams'],
    ['get', '/api/notifications'],
  ];

  for (const [method, path] of checks) {
    const res = await request(app)[method](path).send({ email: 'a@b.co', password: 'x', username: 'x' });
    assert.notEqual(
      res.status,
      404,
      `${method.toUpperCase()} ${path} returned 404 — the route was not mounted`
    );
  }
});

test('DB-backed endpoints return a structured 503 instead of an opaque 500', async () => {
  // Regression: `db` was undefined, so handlers threw
  // "Cannot read properties of undefined (reading 'collection')" and the
  // client received a bare 500 with no indication of what was wrong.
  const res = await request(app)
    .post('/api/login')
    .send({ email: 'someone@example.com', password: 'password123' });

  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'DB_UNAVAILABLE');
  assert.ok(res.body.error.message.toLowerCase().includes('database'));
});

test('the API does not hang when the database is down', async () => {
  // The old code awaited a Mongo server-selection timeout *before* mounting
  // routes, so early requests simply never resolved.
  const started = Date.now();
  await request(app).get('/api/health');
  assert.ok(Date.now() - started < 2000, 'health check should be immediate');
});

// ============================================================
// NOT FOUND / ERROR CONTRACT
// ============================================================

test('unknown routes return a JSON 404, not the Express HTML page', async () => {
  const res = await request(app).get('/api/definitely-not-a-route');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
  assert.match(res.headers['content-type'], /application\/json/);
});

test('malformed JSON returns 400, not 500', async () => {
  // Regression: express.json() parse failures fell through to the generic
  // error branch and were reported as an internal server error.
  const res = await request(app)
    .post('/api/login')
    .set('Content-Type', 'application/json')
    .send('{"email": ');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'MALFORMED_JSON');
});

test('error responses never include a stack trace', async () => {
  const res = await request(app).get('/api/definitely-not-a-route');
  const raw = JSON.stringify(res.body);
  assert.ok(!raw.includes('at '), 'stack frames leaked to the client');
  assert.ok(!raw.includes('node_modules'));
});

// ============================================================
// UPLOADS
// ============================================================

test('GET /api/uploads/:type/:filename cannot be walked out of the uploads root', async () => {
  // Regression: `path.join('/app/backend/uploads', req.params.type,
  // req.params.filename)` passed URL segments straight into a filesystem path,
  // so a crafted segment could read arbitrary files (e.g. server.js, .env).
  //
  // Acceptable outcomes are 400 (rejected by validation), 401 (auth ran first)
  // or 404 (Express normalised the URL so it matches no route / no file).
  // What must never happen is a 200 that serves something from outside the
  // uploads tree.
  const attempts = [
    '/api/uploads/images/..%2F..%2F..%2Fserver.js',
    '/api/uploads/images/..%2F..%2F..%2F.env',
    '/api/uploads/images/%2e%2e%2f%2e%2e%2fserver.js',
    '/api/uploads/images/....//....//server.js',
    '/api/uploads/..%2Fmiddleware/upload.js',
    '/api/uploads/images/..',
  ];

  for (const url of attempts) {
    const res = await request(app).get(url).set('Authorization', 'Bearer not-a-real-token');
    assert.ok(
      [400, 401, 404].includes(res.status),
      `${url} returned ${res.status}; expected 400/401/404`
    );
    assert.notEqual(res.status, 200, `${url} served a file`);
    // Belt and braces: no response may contain source code or env content.
    const raw = typeof res.text === 'string' ? res.text : '';
    assert.ok(!raw.includes('JWT_SECRET'), `${url} leaked env content`);
    assert.ok(!raw.includes('import express'), `${url} leaked source code`);
  }
});

test('the uploads route validates the type segment against an allow-list', async () => {
  // Even with a *valid* token the type must be one of the known subdirectories.
  const token = signTestToken();
  const res = await request(app)
    .get('/api/uploads/passwd/shadow')
    .set('Authorization', `Bearer ${token}`);
  assert.ok([400, 404].includes(res.status), `expected 400/404, got ${res.status}`);
  if (res.status === 400) {
    assert.equal(res.body.error, 'Invalid upload type');
  }
});

test('GET /api/uploads/:type/:filename rejects unknown type segments', async () => {
  const res = await request(app)
    .get('/api/uploads/secrets/whatever.txt')
    .set('Authorization', 'Bearer not-a-real-token');
  // 401 (auth runs first) or 400 (invalid type) are both acceptable;
  // what must never happen is a 200 or a 500.
  assert.ok([400, 401].includes(res.status), `unexpected status ${res.status}`);
});

// ============================================================
// STATIC MEDIA
// ============================================================

test('uploaded media is served from /uploads without a bearer token', async () => {
  // Regression: media was only reachable via an authenticated API route that
  // pointed at a hardcoded path, so <img>/<video> tags could never load it.
  const res = await request(app).get('/uploads/images/does-not-exist.png');
  assert.equal(res.status, 404, 'a missing file should 404 through express.static');
  assert.notEqual(res.status, 401, 'static media must not require Authorization');
});

// ============================================================
// SECURITY HEADERS / CORS
// ============================================================

test('CORS preflight is accepted for the headers the app actually sends', async () => {
  const res = await request(app)
    .options('/api/login')
    .set('Origin', 'http://localhost:8081')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type,authorization,x-request-id');

  assert.ok([200, 204].includes(res.status), `preflight returned ${res.status}`);
  assert.ok(
    res.headers['access-control-allow-origin'],
    'preflight must echo an allowed origin'
  );
  assert.notEqual(
    res.headers['access-control-allow-origin'],
    '*',
    'a literal * is rejected by browsers when credentials are allowed'
  );
});

test('the server does not advertise itself via X-Powered-By', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.headers['x-powered-by'], undefined);
});

// ============================================================
// JWT ROUND-TRIP
// Regression: tokens were signed with no `issuer` while verification DID check
// the issuer, so every token the server minted was rejected by the server.
// Signing also used `process.env.JWT_SECRET`, which was undefined — making
// jsonwebtoken throw on every register/login.
// ============================================================

function signTestToken(payload = { userId: '507f1f77bcf86cd799439011' }, options = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h',
    issuer: config.jwt.issuer,
    ...options,
  });
}

test('a correctly signed token passes authentication and reaches the handler', async () => {
  const token = signTestToken();
  const res = await request(app).get('/api/creators').set('Authorization', `Bearer ${token}`);
  // Auth succeeded, so the only thing standing between us and data is the DB.
  assert.equal(res.status, 503, `expected 503 (DB down) after successful auth, got ${res.status}`);
  assert.equal(res.body.code, 'DB_UNAVAILABLE');
});

test('a token signed without the expected issuer is rejected', async () => {
  const token = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, config.jwt.secret, {
    expiresIn: '1h',
    issuer: 'someone-else',
  });
  const res = await request(app).get('/api/creators').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

test('an expired token is reported as expired, not merely invalid', async () => {
  const token = signTestToken({ userId: '507f1f77bcf86cd799439011' }, { expiresIn: '-10s' });
  const res = await request(app).get('/api/creators').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Token expired');
  assert.equal(res.body.code, 'TOKEN_EXPIRED');
});

test('a token signed with the wrong secret is rejected', async () => {
  const token = jwt.sign(
    { userId: '507f1f77bcf86cd799439011' },
    'a-completely-different-secret-value-0123456789',
    { expiresIn: '1h', issuer: config.jwt.issuer }
  );
  const res = await request(app).get('/api/creators').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

// ============================================================
// CONSISTENT ERROR ENVELOPE
// ============================================================

test('every error response uses the same envelope', async () => {
  const cases = [
    ['get', '/api/definitely-not-a-route', undefined, 404],
    ['get', '/api/creators', undefined, 401],
    ['post', '/api/login', { email: 'a@b.co', password: 'x' }, 503],
  ];

  for (const [method, path, body, expected] of cases) {
    const req = request(app)[method](path);
    if (body) req.send(body);
    const res = await req;
    assert.equal(res.status, expected, `${method.toUpperCase()} ${path} -> ${res.status}`);
    // `error` is either a string (handler-level) or an object (middleware),
    // but the response must ALWAYS also carry a machine-readable code and a
    // human-readable message at the top level or nested — never neither.
    const code = res.body.code ?? res.body.error?.code;
    const message = res.body.message ?? res.body.error?.message ?? res.body.error;
    assert.ok(code, `${path} returned no error code: ${JSON.stringify(res.body)}`);
    assert.ok(message, `${path} returned no error message`);
    assert.ok(res.body.timestamp ?? res.body.error?.timestamp, `${path} returned no timestamp`);
  }
});

// ============================================================
// ROUTE GROUPS THAT PREVIOUSLY HAD NO AUTH
// ============================================================

test('creator-management endpoints require authentication', async () => {
  // Regression (security): routes/creators.js had no auth middleware at all,
  // so POST /api/creators/bulk-add was reachable anonymously.
  const res = await request(app).post('/api/creators/bulk-add').send({ usernames: ['a'] });
  assert.equal(res.status, 401);
  assert.equal(res.body.code ?? res.body.error?.code, 'NO_TOKEN');
});

test('analytics endpoints require authentication', async () => {
  const res = await request(app).get('/api/analytics/overview');
  assert.equal(res.status, 401);
});

test('AI studio endpoints require authentication', async () => {
  const res = await request(app).get('/api/ai-studio/models');
  assert.equal(res.status, 401);
});

test('phase route groups require authentication', async () => {
  const res = await request(app).get('/api/gaming/achievements');
  assert.equal(res.status, 401);
});

test('a bogus bearer token is rejected, not silently ignored', async () => {
  const res = await request(app)
    .get('/api/analytics/overview')
    .set('Authorization', 'Bearer header.payload.signature');
  assert.equal(res.status, 401);
  assert.equal(res.body.code ?? res.body.error?.code, 'INVALID_TOKEN');
});
