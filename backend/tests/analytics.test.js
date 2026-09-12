/**
 * User-scoped analytics endpoints.
 *
 * Covers:
 *   - Authentication required on /summary and /realtime
 *   - 503 DB_UNAVAILABLE when Mongo is down (with a valid token)
 *   - Ownership isolation (user A never sees user B's revenue)
 *   - Summary aggregation (revenue, gifts, streams, peaks, periods)
 *   - Realtime snapshot (live viewers / live gifts)
 *
 * Uses the in-process fake DB by default. When mongodb-memory-server can
 * download a binary it is preferred automatically (see helpers/fake-db.js).
 */

import './helpers/env.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { app, config, dbManager, teardown } from './helpers/app.js';
import { createTestDatabase } from './helpers/fake-db.js';
import {
  buildAnalyticsSummary,
  buildRealtimeAnalytics,
  getUserCreatorIds,
} from '../services/user-analytics.js';

test.after(teardown);

function signToken(userId, extra = {}) {
  return jwt.sign(
    { userId: String(userId), ...extra },
    config.jwt.secret,
    { expiresIn: '1h', issuer: config.jwt.issuer }
  );
}

// ------------------------------------------------------------
// Auth + DB-down contracts (no fake DB needed)
// ------------------------------------------------------------

test('GET /api/analytics/summary requires authentication', async () => {
  const res = await request(app).get('/api/analytics/summary');
  assert.equal(res.status, 401);
  assert.equal(res.body.code ?? res.body.error?.code, 'NO_TOKEN');
});

test('GET /api/analytics/realtime requires authentication', async () => {
  const res = await request(app).get('/api/analytics/realtime');
  assert.equal(res.status, 401);
  assert.equal(res.body.code ?? res.body.error?.code, 'NO_TOKEN');
});

test('GET /api/analytics/summary rejects an invalid token', async () => {
  const res = await request(app)
    .get('/api/analytics/summary')
    .set('Authorization', 'Bearer header.payload.signature');
  assert.equal(res.status, 401);
  assert.equal(res.body.code ?? res.body.error?.code, 'INVALID_TOKEN');
});

test('GET /api/analytics/summary returns 503 DB_UNAVAILABLE when Mongo is down', async () => {
  // Ensure we are actually disconnected for this assertion.
  assert.equal(dbManager.isConnected, false);
  const token = signToken(new ObjectId());
  const res = await request(app)
    .get('/api/analytics/summary')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 503);
  assert.equal(res.body.code ?? res.body.error?.code, 'DB_UNAVAILABLE');
});

test('GET /api/analytics/realtime returns 503 DB_UNAVAILABLE when Mongo is down', async () => {
  const token = signToken(new ObjectId());
  const res = await request(app)
    .get('/api/analytics/realtime')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 503);
  assert.equal(res.body.code ?? res.body.error?.code, 'DB_UNAVAILABLE');
});

// ------------------------------------------------------------
// Aggregation against a test database
// ------------------------------------------------------------

test('analytics summary + realtime: ownership isolation and aggregation', async (t) => {
  const harness = await createTestDatabase(dbManager);
  t.after(async () => {
    await harness.stop();
  });

  const db = harness.db;
  console.log(`[analytics.test] using ${harness.kind} database`);

  const userA = new ObjectId();
  const userB = new ObjectId();
  const creatorA1 = new ObjectId();
  const creatorA2 = new ObjectId();
  const creatorB1 = new ObjectId();

  const now = Date.now();
  const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000);

  // Creators
  await db.collection('creators').insertMany([
    {
      _id: creatorA1,
      tiktok_username: 'alice_live',
      is_live: true,
      current_viewers: 1200,
      peak_viewers: 5000,
    },
    {
      _id: creatorA2,
      tiktok_username: 'alice_alt',
      is_live: false,
      current_viewers: 0,
      peak_viewers: 800,
    },
    {
      _id: creatorB1,
      tiktok_username: 'bob_only',
      is_live: true,
      current_viewers: 9999,
      peak_viewers: 9999,
    },
  ]);

  // Ownership links
  await db.collection('user_creators').insertMany([
    { user_id: userA, creator_id: creatorA1, created_at: new Date() },
    { user_id: userA, creator_id: creatorA2, created_at: new Date() },
    { user_id: userB, creator_id: creatorB1, created_at: new Date() },
  ]);

  const liveStreamA = new ObjectId();
  const endedStreamA = new ObjectId();
  const liveStreamB = new ObjectId();

  await db.collection('live_streams').insertMany([
    {
      _id: liveStreamA,
      creator_id: creatorA1,
      status: 'live',
      start_time: days(0.1),
      end_time: null,
      total_viewers: 1200,
      peak_viewers: 4500,
    },
    {
      _id: endedStreamA,
      creator_id: creatorA2,
      status: 'ended',
      start_time: days(2),
      end_time: days(2 - 2 / 24), // 2 hour stream
      total_viewers: 600,
      peak_viewers: 800,
    },
    {
      _id: liveStreamB,
      creator_id: creatorB1,
      status: 'live',
      start_time: days(0.05),
      end_time: null,
      total_viewers: 9999,
      peak_viewers: 9999,
    },
  ]);

  // Gifts — A owns 100+50+25=175 revenue across 3 gifts (current period)
  // plus one gift 40 days ago (previous period) worth 40
  // B owns a huge gift that must NEVER appear in A's totals
  await db.collection('gifts').insertMany([
    {
      _id: new ObjectId(),
      creator_id: creatorA1,
      stream_id: liveStreamA,
      total_value: 100,
      diamond_count: 100,
      timestamp: days(1),
      sender_username: 'fan1',
    },
    {
      _id: new ObjectId(),
      creator_id: creatorA1,
      stream_id: liveStreamA,
      total_value: 50,
      diamond_count: 50,
      timestamp: days(3),
      sender_username: 'fan2',
    },
    {
      _id: new ObjectId(),
      creator_id: creatorA2,
      stream_id: endedStreamA,
      total_value: 25,
      diamond_count: 25,
      timestamp: days(5),
      sender_username: 'fan3',
    },
    {
      _id: new ObjectId(),
      creator_id: creatorA1,
      stream_id: endedStreamA,
      total_value: 40,
      diamond_count: 40,
      timestamp: days(40), // previous 30-day window
      sender_username: 'oldfan',
    },
    {
      _id: new ObjectId(),
      creator_id: creatorB1,
      stream_id: liveStreamB,
      total_value: 1_000_000,
      diamond_count: 1_000_000,
      timestamp: days(1),
      sender_username: 'whale',
    },
  ]);

  // ---- Unit-level: ownership helper ----
  const aIds = await getUserCreatorIds(db, userA);
  assert.equal(aIds.length, 2);
  assert.ok(aIds.some((id) => String(id) === String(creatorA1)));
  assert.ok(aIds.some((id) => String(id) === String(creatorA2)));
  assert.ok(!aIds.some((id) => String(id) === String(creatorB1)));

  const bIds = await getUserCreatorIds(db, userB);
  assert.equal(bIds.length, 1);
  assert.equal(String(bIds[0]), String(creatorB1));

  // ---- Unit-level: summary aggregation ----
  const summaryA = await buildAnalyticsSummary(db, userA);
  assert.equal(summaryA.total_gifts, 4, 'A owns 4 gifts');
  assert.equal(summaryA.total_revenue, 215, '100+50+25+40');
  assert.equal(summaryA.total_streams, 2);
  assert.equal(summaryA.peak_viewers, 4500);
  assert.equal(summaryA.owned_creators, 2);
  assert.equal(summaryA.live_streams, 1);
  assert.equal(summaryA.current_viewers, 1200);
  assert.equal(summaryA.live_gifts, 2, 'two gifts on the live stream');
  assert.equal(summaryA.live_revenue, 150);
  assert.equal(summaryA.current_period.revenue, 175, 'gifts within last 30d');
  assert.equal(summaryA.previous_period.revenue, 40, 'gift 40 days ago');
  assert.equal(summaryA.revenue_trend, 'up');
  assert.ok(summaryA.revenue_change_pct > 0);

  // B must see only B's data
  const summaryB = await buildAnalyticsSummary(db, userB);
  assert.equal(summaryB.total_gifts, 1);
  assert.equal(summaryB.total_revenue, 1_000_000);
  assert.equal(summaryB.owned_creators, 1);
  assert.equal(summaryB.current_viewers, 9999);

  // ---- Unit-level: realtime ----
  const rtA = await buildRealtimeAnalytics(db, userA);
  assert.equal(rtA.current_viewers, 1200);
  assert.equal(rtA.live_streams, 1);
  assert.equal(rtA.live_gifts, 2);
  assert.equal(rtA.live_revenue, 150);
  assert.ok(rtA.updated_at);

  // ---- HTTP level through the real Express app ----
  const tokenA = signToken(userA);
  const tokenB = signToken(userB);

  const resA = await request(app)
    .get('/api/analytics/summary')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(resA.status, 200, `summary A: ${JSON.stringify(resA.body)}`);
  assert.equal(resA.body.total_revenue, 215);
  assert.equal(resA.body.total_gifts, 4);
  assert.equal(resA.body.peak_viewers, 4500);
  assert.equal(resA.body.current_viewers, 1200);
  assert.equal(resA.body.live_streams, 1);
  assert.equal(resA.body.live_gifts, 2);
  assert.equal(resA.body.live_revenue, 150);
  assert.equal(resA.body.current_period.revenue, 175);
  assert.equal(resA.body.previous_period.revenue, 40);
  assert.equal(resA.body.revenue_trend, 'up');
  assert.ok(resA.body.success);

  const resB = await request(app)
    .get('/api/analytics/summary')
    .set('Authorization', `Bearer ${tokenB}`);
  assert.equal(resB.status, 200);
  assert.equal(resB.body.total_revenue, 1_000_000);
  assert.equal(resB.body.total_gifts, 1);
  // Isolation: B's enormous revenue must not leak into A
  assert.notEqual(resA.body.total_revenue, resB.body.total_revenue);

  const rtRes = await request(app)
    .get('/api/analytics/realtime')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(rtRes.status, 200, `realtime A: ${JSON.stringify(rtRes.body)}`);
  assert.equal(rtRes.body.current_viewers, 1200);
  assert.equal(rtRes.body.live_gifts, 2);
  assert.equal(rtRes.body.live_revenue, 150);
  assert.equal(rtRes.body.owned_creators, 2);
  assert.ok(rtRes.body.updated_at);

  // Empty user — no creators linked
  const emptyUser = new ObjectId();
  const emptyRes = await request(app)
    .get('/api/analytics/summary')
    .set('Authorization', `Bearer ${signToken(emptyUser)}`);
  assert.equal(emptyRes.status, 200);
  assert.equal(emptyRes.body.total_revenue, 0);
  assert.equal(emptyRes.body.total_gifts, 0);
  assert.equal(emptyRes.body.owned_creators, 0);
  assert.equal(emptyRes.body.revenue_trend, 'flat');
});

test('analytics summary average_duration is computed from stream start/end', async (t) => {
  const harness = await createTestDatabase(dbManager);
  t.after(async () => {
    await harness.stop();
  });
  const db = harness.db;

  const userId = new ObjectId();
  const creatorId = new ObjectId();
  await db.collection('creators').insertOne({
    _id: creatorId,
    tiktok_username: 'dur_test',
    is_live: false,
  });
  await db.collection('user_creators').insertOne({
    user_id: userId,
    creator_id: creatorId,
  });

  const start = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const end = new Date(Date.now() - 1 * 60 * 60 * 1000); // 120 minutes
  await db.collection('live_streams').insertOne({
    _id: new ObjectId(),
    creator_id: creatorId,
    status: 'ended',
    start_time: start,
    end_time: end,
    peak_viewers: 10,
    total_viewers: 10,
  });

  const summary = await buildAnalyticsSummary(db, userId);
  assert.equal(summary.total_streams, 1);
  assert.equal(summary.average_duration, 120);
});
