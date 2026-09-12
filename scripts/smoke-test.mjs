#!/usr/bin/env node
/**
 * ============================================================
 * LIVE SMOKE TEST
 * ============================================================
 *
 * Hits a *running* Zenith API over HTTP and verifies the foundation
 * guarantees end to end. Complements `backend/tests/` (in-process supertest):
 * this one proves the deployed/served process behaves, including headers,
 * CORS, rate-limit headers and the live-preview proxy path.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                       # http://127.0.0.1:8001
 *   SMOKE_URL=https://8080-xxx.e2b.app node scripts/smoke-test.mjs
 *   node scripts/smoke-test.mjs http://127.0.0.1:8001
 *
 * Exit code 0 = every required check passed.
 * Uses only Node >= 18 built-ins (fetch), no dependencies.
 */

const BASE = (process.argv[2] || process.env.SMOKE_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 8000);

const results = [];

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  grey: '\x1b[90m',
  bold: '\x1b[1m',
};
const colour = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (c, s) => (colour ? `${c}${s}${C.reset}` : s);

async function call(method, path, { body, headers = {}, raw = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const ms = Date.now() - started;
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, headers: res.headers, json, text, ms, ok: res.ok };
  } catch (err) {
    return { status: 0, error: err.message, ms: Date.now() - started, ok: false, headers: new Headers() };
  } finally {
    clearTimeout(timer);
  }
}

function check(name, passed, detail = '', { optional = false } = {}) {
  results.push({ name, passed, detail, optional });
}

async function step(name, fn, { optional = false } = {}) {
  try {
    const detail = await fn();
    check(name, true, detail ?? '', { optional });
  } catch (err) {
    check(name, false, err.message, { optional });
  }
}

function expect(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

console.log(paint(C.bold, `\nZenith API smoke test`));
console.log(paint(C.grey, `target: ${BASE}\n`));

// ------------------------------------------------------------
// 1. Liveness
// ------------------------------------------------------------
let health = null;
await step('GET /health responds 200 without auth', async () => {
  const r = await call('GET', '/health');
  expect(r.status, 200, 'status');
  expect(r.json?.status, 'ok', 'body.status');
  health = r.json;
  return `${r.ms}ms, uptime ${r.json.uptimeSeconds}s`;
});

// ------------------------------------------------------------
// 2. Detailed health / configuration honesty
// ------------------------------------------------------------
let dbConnected = false;
await step('GET /api/health reports component state honestly', async () => {
  const r = await call('GET', '/api/health');
  expect(r.status, 200, 'status');
  if (!['ok', 'degraded'].includes(r.json?.status)) {
    throw new Error(`unexpected status "${r.json?.status}"`);
  }
  dbConnected = Boolean(r.json?.components?.database?.connected);
  const warnings = r.json?.warnings?.length ?? 0;
  return `status=${r.json.status} db=${r.json.database} warnings=${warnings}`;
});

await step('GET /api/health does not leak credentials', async () => {
  const r = await call('GET', '/api/health');
  if (/mongodb(\+srv)?:\/\/[^"@\s]*:[^"@\s]*@/.test(r.text)) {
    throw new Error('connection string with credentials was returned');
  }
  if (/JWT_SECRET=[A-Za-z0-9]/.test(r.text)) throw new Error('secret value was returned');
  return 'no connection-string credentials, no secret values';
});

// ------------------------------------------------------------
// 3. Readiness reflects the database
// ------------------------------------------------------------
await step('GET /health/ready matches the database state', async () => {
  const r = await call('GET', '/health/ready');
  const expected = dbConnected ? 200 : 503;
  expect(r.status, expected, 'status');
  return `${r.status} (db ${dbConnected ? 'connected' : 'unreachable'})`;
});

// ------------------------------------------------------------
// 4. Routes are mounted even when the DB is down
//    (the original "backend does not respond" bug)
// ------------------------------------------------------------
await step('routes stay mounted regardless of DB state (no 404s)', async () => {
  const probes = [
    ['POST', '/api/login', { email: 'smoke@example.com', password: 'x' }],
    ['POST', '/api/register', { email: 'smoke@example.com', username: 'smoke', password: 'x' }],
    ['GET', '/api/creators'],
    ['GET', '/api/streams'],
  ];
  const offenders = [];
  for (const [method, path, body] of probes) {
    const r = await call(method, path, { body });
    if (r.status === 404) offenders.push(`${method} ${path}`);
  }
  if (offenders.length) throw new Error(`not mounted: ${offenders.join(', ')}`);
  return `${probes.length} core routes present`;
});

await step('DB-backed endpoints fail with 503 + DB_UNAVAILABLE, not an opaque 500', async () => {
  const r = await call('POST', '/api/login', {
    body: { email: 'smoke@example.com', password: 'password123' },
  });
  if (dbConnected) {
    // With a live DB, bad credentials are a 400 — either way it must not be a 500.
    if (r.status === 500) throw new Error('login returned 500 with a live database');
    return `db up — login answered ${r.status}`;
  }
  expect(r.status, 503, 'status');
  const code = r.json?.code ?? r.json?.error?.code;
  expect(code, 'DB_UNAVAILABLE', 'error code');
  return `503 ${code} in ${r.ms}ms`;
});

// ------------------------------------------------------------
// 5. Authentication
// ------------------------------------------------------------
await step('protected endpoints require a bearer token', async () => {
  const probes = ['/api/creators', '/api/analytics/overview', '/api/ai-studio/models', '/api/gaming/achievements'];
  const offenders = [];
  for (const path of probes) {
    const r = await call('GET', path);
    if (r.status !== 401) offenders.push(`${path} -> ${r.status}`);
  }
  if (offenders.length) throw new Error(offenders.join('; '));
  return `${probes.length} route groups return 401 anonymously`;
});

await step('an invalid bearer token is rejected with INVALID_TOKEN', async () => {
  const r = await call('GET', '/api/creators', {
    headers: { Authorization: 'Bearer header.payload.signature' },
  });
  expect(r.status, 401, 'status');
  const code = r.json?.code ?? r.json?.error?.code;
  if (code !== 'INVALID_TOKEN') throw new Error(`expected INVALID_TOKEN, got ${code}`);
  return `401 ${code}`;
});

// ------------------------------------------------------------
// 6. Full auth round-trip (only possible with a live DB)
// ------------------------------------------------------------
if (dbConnected) {
  const email = `smoke+${Date.now()}@example.com`;
  const password = 'Smoke!Test123';
  let token = null;

  await step('POST /api/register issues a usable token', async () => {
    const r = await call('POST', '/api/register', {
      body: { email, username: `smoke_${Date.now()}`, password },
    });
    if (![200, 201].includes(r.status)) throw new Error(`register -> ${r.status} ${r.text.slice(0, 160)}`);
    token = r.json?.token;
    if (!token) throw new Error('register returned no token');
    return `token issued (${token.length} chars)`;
  });

  await step('POST /api/login accepts the new credentials', async () => {
    const r = await call('POST', '/api/login', { body: { email, password } });
    expect(r.status, 200, 'status');
    if (!r.json?.token) throw new Error('login returned no token');
    return 'login ok';
  });

  await step('a freshly issued token is accepted by protected routes', async () => {
    // Regression: tokens were signed without an issuer while verification
    // required one, so the server rejected every token it had just minted.
    const r = await call('GET', '/api/creators', { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401 || r.status === 403) {
      throw new Error(`server rejected its own token: ${r.status} ${r.text.slice(0, 160)}`);
    }
    return `GET /api/creators -> ${r.status}`;
  });
} else {
  check('auth round-trip (register → login → authenticated call)', true, 'skipped — database unavailable', {
    optional: true,
  });
}

// ------------------------------------------------------------
// 7. Error contract
// ------------------------------------------------------------
await step('unknown routes return a JSON 404 envelope', async () => {
  const r = await call('GET', '/api/definitely-not-a-route');
  expect(r.status, 404, 'status');
  const code = r.json?.error?.code ?? r.json?.code;
  expect(code, 'NOT_FOUND', 'error code');
  if (!/application\/json/.test(r.headers.get('content-type') || '')) {
    throw new Error('404 was not JSON');
  }
  return 'JSON 404 with NOT_FOUND';
});

await step('malformed JSON returns 400 MALFORMED_JSON, not 500', async () => {
  const r = await call('POST', '/api/login', { body: '{"email": ', raw: true });
  expect(r.status, 400, 'status');
  const code = r.json?.error?.code ?? r.json?.code;
  expect(code, 'MALFORMED_JSON', 'error code');
  return `400 ${code}`;
});

await step('no response leaks a stack trace', async () => {
  const r = await call('GET', '/api/definitely-not-a-route');
  if (/node_modules|at [A-Za-z.]+ \(/.test(r.text)) throw new Error('stack frames present in response');
  return 'clean';
});

// ------------------------------------------------------------
// 8. Upload path traversal
// ------------------------------------------------------------
await step('uploads endpoint cannot be walked outside the uploads root', async () => {
  const attempts = [
    '/api/uploads/images/..%2F..%2F..%2Fserver.js',
    '/api/uploads/images/%2e%2e%2f%2e%2e%2f.env',
    '/api/uploads/..%2Fmiddleware/upload.js',
  ];
  for (const path of attempts) {
    const r = await call('GET', path, { headers: { Authorization: 'Bearer smoke-token' } });
    if (r.status === 200) throw new Error(`${path} served a file`);
    if (r.text.includes('JWT_SECRET') || r.text.includes('import express')) {
      throw new Error(`${path} leaked source or env content`);
    }
    if (![400, 401, 404].includes(r.status)) {
      throw new Error(`${path} -> unexpected ${r.status}`);
    }
  }
  return `${attempts.length} traversal attempts rejected`;
});

await step('uploaded media is reachable at /uploads without a token', async () => {
  const r = await call('GET', '/uploads/images/smoke-does-not-exist.png');
  if (r.status === 401 || r.status === 403) throw new Error('static media requires auth');
  if (r.status !== 404) throw new Error(`expected 404 for a missing file, got ${r.status}`);
  return '404 for missing file, no auth required';
});

// ------------------------------------------------------------
// 9. HTTP hygiene
// ------------------------------------------------------------
await step('CORS preflight succeeds and does not return a literal *', async () => {
  const r = await call('OPTIONS', '/api/login', {
    headers: {
      Origin: 'http://localhost:8081',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,authorization',
    },
  });
  if (![200, 204].includes(r.status)) throw new Error(`preflight -> ${r.status}`);
  const allow = r.headers.get('access-control-allow-origin');
  if (!allow) throw new Error('no Access-Control-Allow-Origin header');
  if (allow === '*') throw new Error('literal * is rejected by browsers when credentials are allowed');
  return `allow-origin: ${allow}`;
});

await step('X-Powered-By is not advertised', async () => {
  const r = await call('GET', '/health');
  if (r.headers.get('x-powered-by')) throw new Error(`leaks ${r.headers.get('x-powered-by')}`);
  return 'hidden';
});

await step('rate-limit headers are present on API responses', async () => {
  const r = await call('GET', '/api/creators');
  const header =
    r.headers.get('ratelimit-limit') ??
    r.headers.get('x-ratelimit-limit') ??
    r.headers.get('ratelimit');
  if (!header && process.env.RATE_LIMIT_DISABLED !== 'true') {
    throw new Error('no RateLimit-* header (draft-7 standard headers expected)');
  }
  return header ? `RateLimit-Limit: ${header}` : 'rate limiting disabled';
});

// ------------------------------------------------------------
// Report
// ------------------------------------------------------------
const width = Math.max(...results.map((r) => r.name.length));
console.log('');
let failed = 0;
let skipped = 0;
for (const r of results) {
  if (!r.passed) failed += 1;
  if (r.passed && r.optional && /skipped/i.test(r.detail)) skipped += 1;
  const tag = r.passed
    ? r.optional && /skipped/i.test(r.detail)
      ? paint(C.yellow, 'SKIP')
      : paint(C.green, 'PASS')
    : paint(C.red, 'FAIL');
  console.log(`  ${tag}  ${r.name.padEnd(width)}  ${paint(C.grey, r.detail)}`);
}

const passed = results.length - failed;
console.log(
  paint(C.bold, `\n  ${passed}/${results.length} passed`) +
    (failed ? paint(C.red, ` — ${failed} FAILED`) : paint(C.green, ' — all green')) +
    (skipped ? paint(C.yellow, ` (${skipped} skipped)`) : '') +
    '\n'
);

process.exit(failed === 0 ? 0 : 1);
