import './helpers/env.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REALTIME_EVENTS,
  LEGACY_EVENT_ALIASES,
  emitLive,
  emitToUser,
  userRoom,
  normalizePayload,
  allEventNames,
} from '../lib/realtime-events.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const frontendContractPath = path.join(repoRoot, 'frontend/src/realtime/events.ts');

// ------------------------------------------------------------
// Test double
// ------------------------------------------------------------
/**
 * Minimal stand-in for a socket.io Server: records every emit so assertions
 * can be made about *names*, which is the whole point of this contract.
 */
function createRecorder() {
  const emitted = [];
  const io = {
    emit(event, payload) {
      emitted.push({ event, payload });
    },
    to(room) {
      return {
        emit(event, payload) {
          emitted.push({ event, payload, room });
        },
      };
    },
  };
  return {
    io,
    emitted,
    names: () => emitted.map((e) => e.event),
    find: (event) => emitted.find((e) => e.event === event),
  };
}

/** A stub Mongo ObjectId — exposes only the method the contract relies on. */
function fakeObjectId(hex) {
  return { toHexString: () => hex, $oid: hex };
}

// ------------------------------------------------------------
// The bug this file exists to prevent
// ------------------------------------------------------------
test('realtime: canonical and legacy names are disjoint (the original bug)', () => {
  // Regression: the backend emitted ONLY snake_case names (`new_gift`,
  // `creator_live`, `viewer_update`) while every frontend hook subscribed to
  // ONLY colon names (`live:gift`, `creator:status`, `creator:viewers`). The
  // two sets had zero overlap, so the socket connected, the UI reported
  // "live", and not one event ever arrived.
  const canonical = new Set(Object.values(REALTIME_EVENTS));
  const legacy = new Set(Object.values(LEGACY_EVENT_ALIASES).flat());

  assert.ok(canonical.size > 0, 'canonical names must exist');
  assert.ok(legacy.size > 0, 'legacy aliases must exist');

  const overlap = [...legacy].filter((name) => canonical.has(name));
  assert.deepEqual(
    overlap,
    [],
    'a legacy alias that is also canonical means the mapping is wrong'
  );
});

test('realtime: every colon-style event a client can subscribe to is emitted', () => {
  // The frontend's realtime hooks listen for exactly these. Each one must be a
  // canonical name so `emitLive` broadcasts it.
  const required = [
    'stream:started',
    'stream:ended',
    'creator:status',
    'creator:viewers',
    'live:comment',
    'live:gift',
    'live:like',
    'live:share',
    'live:follow',
    'live:join',
    'live:batch',
    'live:event',
    'analytics:delta',
    'analytics:full',
    'analytics:viewers',
  ];
  const canonical = new Set(Object.values(REALTIME_EVENTS));
  const missing = required.filter((name) => !canonical.has(name));
  assert.deepEqual(missing, [], `canonical names missing from REALTIME_EVENTS: ${missing}`);
});

test('realtime: every legacy alias is still emitted alongside its canonical name', () => {
  // Migration safety: clients that have not been updated yet keep working.
  const expectations = [
    ['stream:started', 'creator_live'],
    ['stream:ended', 'creator_offline'],
    ['creator:viewers', 'viewer_update'],
    ['live:comment', 'new_chat'],
    ['live:gift', 'new_gift'],
    ['live:like', 'new_like'],
    ['live:share', 'new_share'],
    ['live:follow', 'new_follow'],
    ['live:join', 'member_join'],
    ['live:event', 'new_activity'],
  ];
  for (const [canonical, legacy] of expectations) {
    assert.deepEqual(
      LEGACY_EVENT_ALIASES[canonical],
      [legacy],
      `${canonical} should be aliased to ${legacy}`
    );
  }
});

test('realtime: emitLive broadcasts the canonical name plus its legacy alias', () => {
  const rec = createRecorder();
  emitLive(rec.io, REALTIME_EVENTS.LIVE_GIFT, {
    creator_id: 'c1',
    tiktok_username: 'zenith',
    gift_name: 'Rose',
    count: 3,
  });

  assert.deepEqual(rec.names(), ['live:gift', 'new_gift']);

  const gift = rec.find('live:gift');
  assert.equal(gift.payload.gift_name, 'Rose');
  assert.equal(gift.payload.count, 3);
  assert.equal(gift.payload.creator_id, 'c1');
  assert.equal(gift.payload.tiktok_username, 'zenith');
  // Activity events are stamped with `type` so a client listening on the
  // generic live:event feed can still route the payload.
  assert.equal(gift.payload.type, 'live:gift');
});

test('realtime: the generic live:event feed is itself a contract event', () => {
  // server.js funnels the activity log through LIVE_EVENT so a screen that
  // wants "everything" can open one subscription instead of six.
  const rec = createRecorder();
  emitLive(rec.io, REALTIME_EVENTS.LIVE_EVENT, {
    creator_id: 'c1',
    type: 'gift',
    kind: 'gift',
    gift_name: 'Rose',
  });

  assert.deepEqual(rec.names(), ['live:event', 'new_activity']);

  // live:event is deliberately NOT in WRAPPED_IN_LIVE_EVENT: it *is* the
  // generic feed, so its `type` is the routing information the caller supplies
  // (`logActivity()` passes the activity kind). Stamping `type: 'live:event'`
  // over it would destroy the only field a feed subscriber can route on.
  assert.equal(rec.find('live:event').payload.type, 'gift');
  assert.equal(rec.find('live:event').payload.kind, 'gift');
});

test('realtime: emitLive sends the identical payload object under every name', () => {
  const rec = createRecorder();
  emitLive(rec.io, REALTIME_EVENTS.STREAM_STARTED, { creator_id: 'c9' });

  assert.deepEqual(rec.names(), ['stream:started', 'creator_live']);
  const [a, b] = rec.emitted;
  // Same reference: a client cannot observe a different body per alias.
  assert.equal(a.payload, b.payload);
});

test('realtime: only the six activity events are stamped with a type field', () => {
  const stamped = ['live:comment', 'live:gift', 'live:like', 'live:share', 'live:follow', 'live:join'];
  const unstamped = ['creator:status', 'creator:viewers', 'analytics:delta', 'stream:started'];

  for (const event of stamped) {
    const body = normalizePayload(event, { creator_id: 'c1' });
    assert.equal(body.type, event, `${event} payload should carry type=${event}`);
  }

  for (const event of unstamped) {
    const body = normalizePayload(event, { creator_id: 'c1' });
    assert.equal(body.type, undefined, `${event} payload must not carry a type field`);
  }

  // And no event ever fans out into live:event implicitly — that would double
  // up every activity event for clients subscribed to both names.
  for (const event of [...stamped, ...unstamped]) {
    const rec = createRecorder();
    emitLive(rec.io, event, { creator_id: 'c1' });
    assert.ok(
      !rec.names().includes('live:event'),
      `${event} must not implicitly emit live:event`
    );
  }
});

// ------------------------------------------------------------
// Payload normalisation
// ------------------------------------------------------------
test('realtime: ObjectIds are serialised to strings before leaving the server', () => {
  // Regression: raw Mongo ObjectIds serialise as `{ $oid: ... }` over the wire
  // on some drivers, so clients compared `payload.creator_id === storeId` and
  // silently dropped the event.
  const rec = createRecorder();
  emitLive(rec.io, REALTIME_EVENTS.LIVE_COMMENT, {
    creator_id: fakeObjectId('507f1f77bcf86cd799439011'),
    stream_id: fakeObjectId('507f1f77bcf86cd799439012'),
    user_id: fakeObjectId('507f1f77bcf86cd799439013'),
    text: 'hello',
  });

  const { payload } = rec.find('live:comment');
  assert.equal(payload.creator_id, '507f1f77bcf86cd799439011');
  assert.equal(payload.stream_id, '507f1f77bcf86cd799439012');
  assert.equal(payload.user_id, '507f1f77bcf86cd799439013');
  assert.equal(typeof payload.creator_id, 'string');
});

test('realtime: a plain $oid object and a numeric id also become strings', () => {
  // An id that has already been through JSON has no .toHexString() — only $oid.
  const body = normalizePayload(REALTIME_EVENTS.LIVE_LIKE, {
    creator_id: { $oid: 'abc123' },
    stream_id: 42,
  });
  assert.equal(body.creator_id, 'abc123');
  assert.equal(body.stream_id, '42');
  assert.notEqual(body.creator_id, '[object Object]');
});

test('realtime: every payload carries an ISO timestamp', () => {
  const body = normalizePayload(REALTIME_EVENTS.CREATOR_STATUS, { creator_id: 'c1' });
  assert.equal(typeof body.timestamp, 'string');
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)), 'timestamp must be parseable');
  assert.equal(new Date(body.timestamp).toISOString(), body.timestamp);
});

test('realtime: an explicit timestamp from the caller is preserved', () => {
  const ts = '2024-01-02T03:04:05.000Z';
  const body = normalizePayload(REALTIME_EVENTS.CREATOR_STATUS, { timestamp: ts });
  assert.equal(body.timestamp, ts);
});

test('realtime: normalizePayload never mutates the caller object', () => {
  // Call sites in server.js reuse payload objects across emitters; a mutation
  // here would leak `type`/`timestamp` into unrelated broadcasts.
  const input = { creator_id: 'c1', gift_name: 'Rose' };
  const snapshot = JSON.stringify(input);
  normalizePayload(REALTIME_EVENTS.LIVE_GIFT, input);
  assert.equal(JSON.stringify(input), snapshot);
});

test('realtime: tiktok_username and extra fields survive normalisation', () => {
  const rec = createRecorder();
  emitLive(rec.io, REALTIME_EVENTS.CREATOR_STATUS, {
    creator_id: 'c1',
    tiktok_username: 'zenith',
    is_live: true,
    viewer_count: 1234,
    stream_title: 'Friday set',
  });
  const { payload } = rec.find('creator:status');
  assert.equal(payload.tiktok_username, 'zenith');
  assert.equal(payload.is_live, true);
  assert.equal(payload.viewer_count, 1234);
  assert.equal(payload.stream_title, 'Friday set');
  assert.equal(payload.type, undefined, 'creator:status is not a wrapped event');
});

// ------------------------------------------------------------
// Failure modes — must never take down the socket layer
// ------------------------------------------------------------
test('realtime: emitLive tolerates a missing or malformed io', () => {
  assert.doesNotThrow(() => emitLive(null, REALTIME_EVENTS.LIVE_GIFT, {}));
  assert.doesNotThrow(() => emitLive(undefined, REALTIME_EVENTS.LIVE_GIFT, {}));
  assert.doesNotThrow(() => emitLive({}, REALTIME_EVENTS.LIVE_GIFT, {}));
  // Still returns the normalised body so callers can log/inspect it.
  const body = emitLive(null, REALTIME_EVENTS.LIVE_GIFT, { creator_id: 'c1' });
  assert.equal(body.creator_id, 'c1');
});

test('realtime: a throw on one alias does not suppress the others', () => {
  let calls = 0;
  const io = {
    emit() {
      calls += 1;
      if (calls === 1) throw new Error('serialisation exploded');
    },
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.doesNotThrow(() => emitLive(io, REALTIME_EVENTS.LIVE_GIFT, {}));
  } finally {
    console.error = originalError;
  }
  // canonical + new_gift = 2 attempts, and the second still ran even though
  // the first threw.
  assert.equal(calls, 2);
});

test('realtime: emitLive is a no-op-safe function for events with no aliases', () => {
  const rec = createRecorder();
  emitLive(rec.io, REALTIME_EVENTS.BADGE_EARNED, { creator_id: 'c1', badge: 'first_gift' });
  assert.deepEqual(rec.names(), ['badge_earned']);
});

test('realtime: emitToUser targets the user room and normalises the id', () => {
  const rec = createRecorder();
  emitToUser(rec.io, fakeObjectId('507f1f77bcf86cd799439099'), REALTIME_EVENTS.NOTIFICATION, {
    title: 'Milestone',
  });

  assert.equal(rec.emitted.length, 1);
  assert.equal(rec.emitted[0].room, 'user:507f1f77bcf86cd799439099');
  assert.equal(rec.emitted[0].event, 'notification');
  assert.equal(rec.emitted[0].payload.title, 'Milestone');
});

test('realtime: emitToUser with no user id emits nothing', () => {
  const rec = createRecorder();
  emitToUser(rec.io, undefined, REALTIME_EVENTS.NOTIFICATION, { title: 'x' });
  assert.deepEqual(rec.emitted, []);
});

test('realtime: allEventNames covers canonical + legacy and is sorted/unique', () => {
  const names = allEventNames();
  const canonical = Object.values(REALTIME_EVENTS);
  const legacy = Object.values(LEGACY_EVENT_ALIASES).flat();

  for (const name of [...canonical, ...legacy]) {
    assert.ok(names.includes(name), `${name} missing from allEventNames()`);
  }
  assert.equal(new Set(names).size, names.length, 'allEventNames must be deduped');
  assert.deepEqual(names, [...names].sort(), 'allEventNames must be sorted');
});

test('realtime: userRoom is the single source of truth for the room name', () => {
  // Regression: server.js emitted to `user_<id>` while emitToUser() targeted
  // `user:<id>`, so targeted notifications were delivered to an empty room.
  assert.equal(userRoom('abc123'), 'user:abc123');
  assert.equal(userRoom(fakeObjectId('507f191e810c19729de860ea')), 'user:507f191e810c19729de860ea');
  assert.equal(userRoom(undefined), null);
  assert.equal(userRoom(null), null);

  const rec = createRecorder();
  emitToUser(rec.io, 'abc123', REALTIME_EVENTS.NOTIFICATION, { title: 'x' });
  assert.equal(rec.emitted[0].room, userRoom('abc123'));
});

test('realtime: emitToUser tolerates an io without .to()', () => {
  assert.doesNotThrow(() => emitToUser({ emit() {} }, 'abc', REALTIME_EVENTS.NOTIFICATION, {}));
  assert.doesNotThrow(() => emitToUser(null, 'abc', REALTIME_EVENTS.NOTIFICATION, {}));
});

// ------------------------------------------------------------
// Drift guard: backend and frontend must agree
// ------------------------------------------------------------
/**
 * Pull `KEY: 'value'` pairs out of a named `const` object literal in source.
 * Deliberately parses text rather than importing, so the guard works even when
 * the frontend cannot be type-checked in this environment.
 */
function parseEventMap(source, constName) {
  const start = source.indexOf(`const ${constName}`);
  assert.notEqual(start, -1, `could not find ${constName} in source`);
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  assert.notEqual(end, -1, `unbalanced braces for ${constName}`);
  const block = source.slice(open + 1, end);
  const out = {};
  const re = /([A-Z0-9_]+)\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block)) !== null) out[m[1]] = m[2];
  return out;
}

test('realtime: the frontend contract mirror has not drifted from the backend', (t) => {
  if (!fs.existsSync(frontendContractPath)) {
    t.skip('frontend/src/realtime/events.ts not present in this checkout');
    return;
  }
  const source = fs.readFileSync(frontendContractPath, 'utf8');

  const frontendCanonical = parseEventMap(source, 'REALTIME_EVENTS');
  const backendCanonical = REALTIME_EVENTS;

  // Same keys…
  assert.deepEqual(
    Object.keys(frontendCanonical).sort(),
    Object.keys(backendCanonical).sort(),
    'REALTIME_EVENTS keys differ between frontend and backend'
  );
  // …and same values.
  for (const key of Object.keys(backendCanonical)) {
    assert.equal(
      frontendCanonical[key],
      backendCanonical[key],
      `REALTIME_EVENTS.${key} differs: frontend="${frontendCanonical[key]}" backend="${backendCanonical[key]}"`
    );
  }

  // Legacy names must all be known to the client too.
  const frontendLegacy = parseEventMap(source, 'LEGACY_EVENTS');
  const backendLegacy = new Set(Object.values(LEGACY_EVENT_ALIASES).flat());
  const unknownToClient = [...backendLegacy].filter(
    (name) => !Object.values(frontendLegacy).includes(name)
  );
  assert.deepEqual(
    unknownToClient,
    [],
    `backend emits legacy names the frontend does not declare: ${unknownToClient}`
  );
});

test('realtime: server.js emits through emitLive rather than raw io.emit for live events', (t) => {
  // Guard against a regression to hand-rolled emits with ad-hoc names.
  const serverPath = path.join(repoRoot, 'backend/server.js');
  if (!fs.existsSync(serverPath)) {
    t.skip('backend/server.js not present');
    return;
  }
  const raw = fs.readFileSync(serverPath, 'utf8');
  // Strip comments first: the FIX note describing the old
  // `io.to(`user_${userId}`)` call would otherwise trip the guard below.
  const source = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  assert.ok(
    raw.includes("from './lib/realtime-events.js'"),
    'server.js must import the realtime contract module'
  );
  assert.ok(raw.includes('emitLive('), 'server.js must emit via emitLive');

  // No raw broadcast of a *contract* event may remain. Hand-rolled
  // `io.emit('badge_earned', …)` calls skip payload normalisation, so those
  // events reached clients with no `timestamp` and with un-stringified
  // ObjectIds. (Connection-level emits such as `welcome` are fine — they are
  // not part of the contract and are addressed to a single socket.)
  const contractNames = new Set(allEventNames());
  const rawEmitRe = /\bio\.emit\(\s*'([^']+)'/g;
  let m;
  const offenders = [];
  while ((m = rawEmitRe.exec(source)) !== null) {
    if (contractNames.has(m[1])) offenders.push(m[1]);
  }
  assert.deepEqual(
    offenders,
    [],
    `server.js broadcasts contract events directly, bypassing emitLive: ${offenders}`
  );

  // Targeted delivery must go through emitToUser, never a hand-built room name.
  const rawRoomRe = /io\.to\(\s*[`']user[_:]/g;
  assert.equal(
    (source.match(rawRoomRe) || []).length,
    0,
    'server.js builds a per-user room name by hand instead of using userRoom()/emitToUser()'
  );
});
