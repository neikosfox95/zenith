import './helpers/env.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';

import config, { ensureDir, configWarnings, BACKEND_ROOT } from '../config/index.js';

test('config: no storage path is hardcoded to the old /app container layout', () => {
  const paths = [
    config.paths.dataRoot,
    config.paths.uploads,
    config.paths.audio,
    config.paths.recordings,
    config.paths.logs,
  ];
  for (const p of paths) {
    assert.ok(path.isAbsolute(p), `${p} should be absolute`);
    assert.ok(!p.startsWith('/app/'), `${p} must not point at the old /app layout`);
    assert.ok(
      p.startsWith(BACKEND_ROOT) || p.startsWith(config.paths.dataRoot),
      `${p} should resolve inside the checkout or the configured DATA_ROOT`
    );
  }
});

test('config: DATA_ROOT override is honoured', () => {
  // tests/helpers/env.js points DATA_ROOT at a temp dir.
  assert.equal(config.paths.dataRoot, process.env.DATA_ROOT);
  assert.equal(config.paths.uploads, path.join(process.env.DATA_ROOT, 'uploads'));
});

test('config: upload subdirectories match what the upload middleware creates', () => {
  assert.deepEqual(config.paths.uploadSubdirs, ['images', 'videos', 'documents', 'audio']);
});

test('config: jwt secret is always a usable value', () => {
  assert.equal(typeof config.jwt.secret, 'string');
  assert.ok(config.jwt.secret.length >= 32, 'secret must be long enough to sign with');
  // JWT_SECRET is set by the test env helper, so nothing should be generated.
  assert.equal(config.jwt.generated, false);
  assert.ok(config.jwt.expiresIn, 'tokens must have an expiry');
  assert.ok(config.jwt.issuer, 'issuer must be set or verification will reject every token');
});

test('config: trust proxy is on outside production-by-header and in dev', () => {
  // Without this, every client shares the proxy IP and one rate-limit bucket.
  assert.notEqual(config.server.trustProxy, false);
});

test('config: server binds to all interfaces so the preview proxy can reach it', () => {
  assert.equal(config.server.host, '0.0.0.0');
  assert.ok(config.server.port > 0);
});

test('config: rate limiting is disabled under NODE_ENV=test', () => {
  assert.equal(config.isTest, true);
  assert.equal(config.rateLimit.disabled, true);
});

test('config: cors allows a same-origin/no-Origin request', () => {
  const { origin } = config.cors;
  assert.equal(typeof origin, 'function');

  let allowed;
  origin(undefined, (_err, ok) => {
    allowed = ok;
  });
  assert.equal(allowed, true, 'requests without an Origin header must pass');

  origin('https://example.com', (_err, ok) => {
    allowed = ok;
  });
  assert.equal(typeof allowed, 'boolean');
});

test('config: cors credentials are not combined with a literal "*" origin', () => {
  // Browsers reject `Access-Control-Allow-Origin: *` together with
  // `Access-Control-Allow-Credentials: true`. The origin must be a function
  // that echoes an allow-listed origin instead.
  assert.equal(typeof config.cors.origin, 'function');
  if (config.cors.credentials) {
    assert.notEqual(config.cors.origin, '*');
  }
});

test('ensureDir: creates a directory and reports failure without throwing', () => {
  const target = path.join(config.paths.dataRoot, 'ensure-dir-test', 'nested');
  assert.equal(ensureDir(target), target);
  assert.ok(fs.existsSync(target));

  // A path whose parent is a *file* cannot be created — must return null, not throw.
  const filePath = path.join(config.paths.dataRoot, 'a-file');
  fs.writeFileSync(filePath, 'x');
  const impossible = path.join(filePath, 'child');
  assert.equal(ensureDir(impossible), null);
});

test('configWarnings: reports missing integrations instead of hiding them', () => {
  const warnings = configWarnings();
  assert.ok(Array.isArray(warnings));
  // The test env sets no AI keys and no SMTP credentials.
  assert.ok(
    warnings.some((w) => w.includes('AI provider key')),
    'expected a warning about missing AI credentials'
  );
  assert.ok(
    warnings.some((w) => w.toLowerCase().includes('smtp')),
    'expected a warning about missing SMTP credentials'
  );
  // No warning may leak a secret value.
  for (const w of warnings) {
    assert.ok(!w.includes(config.jwt.secret), 'warnings must not contain the JWT secret');
  }
});

test('config: smtp/minio report themselves disabled when unconfigured', () => {
  assert.equal(config.smtp.enabled, false);
  assert.equal(config.minio.enabled, false);
});

// ============================================================
// CRON EXPRESSIONS
// Regression: the hourly analytics job was registered as `0 * * *` — four
// fields, which is not a cron expression. Under node-cron v4 that threw a
// TypeError from deep inside the library during setupAutomation(), and before
// v4 it silently never ran. Either way the rollup never happened and nothing
// reported it.
// ============================================================

test('cron: the expressions used by setupAutomation are valid', async () => {
  const { default: cron } = await import('node-cron');
  const used = ['0 2 * * *', '0 * * * *', '0 0 * * *'];
  for (const expression of used) {
    const fields = expression.trim().split(/\s+/).length;
    assert.ok(fields === 5 || fields === 6, `"${expression}" has ${fields} fields`);
    assert.equal(cron.validate(expression), true, `"${expression}" rejected by node-cron`);
    const job = cron.schedule(expression, () => {});
    assert.equal(typeof job.stop, 'function');
    job.stop();
  }
});

test('cron: node-cron v4 throws opaquely on a 4-field expression (documents the trap)', async () => {
  const { default: cron } = await import('node-cron');
  assert.throws(
    () => cron.schedule('0 * * *', () => {}),
    /Cannot read properties of undefined/,
    'if node-cron starts validating this itself, scheduleTask can be simplified'
  );
});
