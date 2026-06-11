// ============================================================
// IDEMPOTENT SEED - Analytics demo data (MongoDB)
// Run: node seed_analytics.js
// ============================================================

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new MongoClient(process.env.MONGO_URL);

async function seed() {
  await client.connect();
  const db = client.db(process.env.DB_NAME);

  const now = new Date();
  const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

  // ---- Creators (upsert by username) ----
  const creators = [
    { username: 'darkskully', display_name: 'Dark Skully', is_live: true, last_live_at: now },
    { username: 'streamerqueen', display_name: 'Streamer Queen', is_live: false, last_live_at: hoursAgo(26) },
  ];

  const creatorIds = {};
  for (const c of creators) {
    const result = await db.collection('tracked_creators').findOneAndUpdate(
      { username: c.username },
      {
        $set: { ...c, tracking_status: 'active', updated_at: now },
        $setOnInsert: { created_at: now }
      },
      { upsert: true, returnDocument: 'after' }
    );
    creatorIds[c.username] = result._id;
    console.log(`✅ creator: @${c.username} (${result._id})`);
  }

  // ---- Streams (skip if already seeded) ----
  const existingStreams = await db.collection('live_streams').countDocuments({
    creator_id: { $in: Object.values(creatorIds) }
  });

  if (existingStreams > 0) {
    console.log('⏭️  Streams already seeded, skipping stream/event/gift seed');
    await client.close();
    return;
  }

  const liveStream = {
    _id: new ObjectId(),
    creator_id: creatorIds.darkskully,
    started_at: hoursAgo(2),
    ended_at: null,
    duration_seconds: null,
    status: 'live',
    total_gifts: 3,
    total_diamonds: 1500,
    revenue_usd: 19.35,
    peak_viewers: 5240,
    created_at: hoursAgo(2),
    updated_at: now
  };

  const endedStream = {
    _id: new ObjectId(),
    creator_id: creatorIds.streamerqueen,
    started_at: hoursAgo(28),
    ended_at: hoursAgo(26),
    duration_seconds: 7200,
    status: 'ended',
    total_gifts: 12,
    total_diamonds: 4200,
    revenue_usd: 54.18,
    peak_viewers: 3180,
    created_at: hoursAgo(28),
    updated_at: hoursAgo(26)
  };

  await db.collection('live_streams').insertMany([liveStream, endedStream]);
  console.log('✅ streams: 2 inserted');

  // ---- Events ----
  const eventTemplates = [
    { type: 'gift', user: 'whale_user', minsAgo: 5 },
    { type: 'comment', user: 'chattycathy', minsAgo: 8 },
    { type: 'like', user: 'fan_4life', minsAgo: 12 },
    { type: 'follow', user: 'newbie22', minsAgo: 20 },
    { type: 'share', user: 'hypeman', minsAgo: 30 },
    { type: 'comment', user: 'lurker_x', minsAgo: 45 },
    { type: 'gift', user: 'gifter_pro', minsAgo: 60 },
    { type: 'like', user: 'doubletapper', minsAgo: 75 },
  ];

  const events = eventTemplates.map(e => ({
    creator_id: creatorIds.darkskully,
    event_type: e.type,
    event_data: { username: 'darkskully', user: e.user },
    user_id: null,
    username: e.user,
    timestamp: Date.now() - e.minsAgo * 60 * 1000,
    created_at: new Date(Date.now() - e.minsAgo * 60 * 1000)
  }));

  await db.collection('live_events').insertMany(events);
  console.log(`✅ events: ${events.length} inserted`);

  // ---- Gifts ----
  const gifts = [
    { gift_name: 'Galaxy', sender: 'whale_user', diamonds: 1000, minsAgo: 5 },
    { gift_name: 'Rose', sender: 'gifter_pro', diamonds: 300, minsAgo: 60 },
    { gift_name: 'Lion', sender: 'whale_user', diamonds: 200, minsAgo: 90 },
  ].map(g => ({
    stream_id: liveStream._id,
    creator_id: creatorIds.darkskully,
    gift_id: null,
    gift_name: g.gift_name,
    sender_username: g.sender,
    sender_user_id: null,
    repeat_count: 1,
    diamond_count: g.diamonds,
    coin_value: g.diamonds * 2,
    usd_value: parseFloat((g.diamonds * 2 * 0.0129).toFixed(2)),
    creator_payout: parseFloat((g.diamonds * 2 * 0.0129 * 0.5).toFixed(2)),
    timestamp: Date.now() - g.minsAgo * 60 * 1000,
    created_at: new Date(Date.now() - g.minsAgo * 60 * 1000)
  }));

  await db.collection('gifts_tracking').insertMany(gifts);
  console.log(`✅ gifts: ${gifts.length} inserted`);

  // ---- Viewer tracking ----
  const viewerPoints = Array.from({ length: 12 }, (_, i) => ({
    stream_id: liveStream._id,
    viewer_count: 2000 + Math.round(Math.random() * 3240),
    timestamp: Date.now() - (120 - i * 10) * 60 * 1000,
    created_at: new Date(Date.now() - (120 - i * 10) * 60 * 1000)
  }));

  await db.collection('viewer_tracking').insertMany(viewerPoints);
  console.log(`✅ viewer_tracking: ${viewerPoints.length} inserted`);

  // ---- Top gifters ----
  const topGifters = [
    { username: 'whale_user', total_gifts: 2, total_diamonds: 1200, total_spent_usd: 30.96, rank: 1 },
    { username: 'gifter_pro', total_gifts: 1, total_diamonds: 300, total_spent_usd: 7.74, rank: 2 },
  ].map(g => ({
    creator_id: creatorIds.darkskully,
    ...g,
    user_id: null,
    last_gift_at: now,
    created_at: now,
    updated_at: now
  }));

  await db.collection('top_gifters').insertMany(topGifters);
  console.log(`✅ top_gifters: ${topGifters.length} inserted`);

  console.log('🎉 Seed complete');
  await client.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
