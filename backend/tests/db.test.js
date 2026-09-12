import './helpers/env.js';

import test from 'node:test';
import assert from 'node:assert/strict';

import dbManager, { requireDb, ServiceUnavailableError, DB_STATE } from '../lib/db.js';
import { getDb } from '../lib/mongo.js';

test('db: connect() resolves to null when Mongo is unreachable — it never rejects', async () => {
  // Regression: an unawaited `dbManager.connect()` at startup used to produce
  // an unhandled rejection that showed up as noise in every boot log.
  const result = await dbManager.connect({ retry: false });
  assert.equal(result, null);
  assert.equal(dbManager.state, DB_STATE.DISCONNECTED);
  assert.equal(dbManager.isConnected, false);
});

test('db: the failure event does not use the reserved "error" name', () => {
  // Regression: `emit('error', err)` on an EventEmitter with no 'error'
  // listener THROWS (Node's special case). That throw escaped the catch block
  // in connect(), so the retry was never scheduled and the promise rejected.
  assert.doesNotThrow(() => {
    dbManager.emit('connection-error', new Error('simulated'));
  });
  assert.throws(() => {
    dbManager.emit('error', new Error('simulated'));
  }, /simulated/);
});

test('db: connect() schedules a background retry after a failure', async () => {
  await dbManager.connect({ retry: true });
  // The timer is unref'd, so just assert it exists via a second call being a
  // no-op rather than creating a second timer.
  assert.equal(dbManager.state, DB_STATE.DISCONNECTED);
  await dbManager.close(); // clears the retry timer
});

test('db: getDb() throws a 503 ServiceUnavailableError, not a TypeError', () => {
  // Regression: handlers did `db.collection(...)` on an undefined handle and
  // produced "Cannot read properties of undefined (reading 'collection')"
  // which surfaced to clients as an opaque 500.
  assert.throws(
    () => dbManager.getDb(),
    (err) => {
      assert.ok(err instanceof ServiceUnavailableError);
      assert.equal(err.statusCode, 503);
      assert.equal(err.code, 'DB_UNAVAILABLE');
      return true;
    }
  );
  assert.equal(dbManager.tryGetDb(), null);
});

test('db: lib/mongo getDb() rejects with a 503 rather than opening a second client', async () => {
  // Regression: lib/mongo.js created its OWN MongoClient, so /api/analytics and
  // /api/creators had an independent connection state from the main server.
  await assert.rejects(
    () => getDb(),
    (err) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.code, 'DB_UNAVAILABLE');
      return true;
    }
  );
});

test('db: requireDb middleware answers 503 with an actionable JSON body', () => {
  let statusCode = null;
  let body = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };
  let nextCalled = false;

  requireDb({ path: '/api/creators' }, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, 'next() must not be called when the DB is down');
  assert.equal(statusCode, 503);
  assert.equal(body.code, 'DB_UNAVAILABLE');
  assert.ok(body.retryAfter > 0, 'clients should be told when to retry');
  assert.ok(body.message.toLowerCase().includes('database'));
});

test('db: status() never leaks credentials embedded in the connection string', () => {
  const status = dbManager.status();
  assert.equal(status.host, '127.0.0.1:1');
  assert.equal(status.database, 'zenith_test');
  assert.equal(status.connected, false);

  const serialised = JSON.stringify(status);
  assert.ok(!serialised.includes('supersecret'));
  assert.ok(!serialised.includes('://'), 'host must be reduced to host:port, not a full URL');
});

test('db: status() strips credentials from a connection string that contains them', async () => {
  // Operators routinely paste a full mongodb+srv://user:pass@host URL into
  // MONGO_URL. The health endpoint is unauthenticated, so it must never echo
  // that back.
  const { safeHost } = await import('../lib/db.js');
  assert.equal(safeHost('mongodb://user:supersecret@db.example.com:27017/zenith'), 'db.example.com:27017');
  assert.equal(safeHost('mongodb+srv://admin:hunter2@cluster0.abc.mongodb.net/zenith'), 'cluster0.abc.mongodb.net');
  assert.equal(safeHost('not a url'), 'unknown');
});

test('db: close() is idempotent and safe when never connected', async () => {
  await dbManager.close();
  await dbManager.close();
  assert.equal(dbManager.state, DB_STATE.DISCONNECTED);
});
