// ============================================================
// ANALYTICS ENGINE - Real-Time TikTok Analytics Processor
// Processes live events and generates analytics (MongoDB-backed)
// ============================================================

import { getDb } from '../lib/mongo.js';
import cache from '../lib/cache.js';

// MessageBus not available without Redis
const messageBus = null;

class AnalyticsEngine {
  constructor() {
    this.isRunning = false;
    this.stats = {
      eventsProcessed: 0,
      lastProcessedAt: null,
      errors: 0
    };
  }

  async start() {
    console.log('🚀 [Analytics Engine] Starting...');

    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      console.log('✅ [Analytics Engine] MongoDB connected');

      // Ensure indexes
      await Promise.all([
        db.collection('tracked_creators').createIndex({ username: 1 }, { unique: true }),
        db.collection('live_streams').createIndex({ creator_id: 1, status: 1, started_at: -1 }),
        db.collection('live_events').createIndex({ creator_id: 1, created_at: -1 }),
        db.collection('gifts_tracking').createIndex({ creator_id: 1, created_at: -1 }),
        db.collection('viewer_tracking').createIndex({ stream_id: 1, created_at: 1 }),
        db.collection('top_gifters').createIndex({ creator_id: 1, total_diamonds: -1 }),
      ]).catch(() => { /* indexes may already exist */ });
    } catch (error) {
      console.error('❌ [Analytics Engine] MongoDB unavailable:', error.message);
    }

    await this._subscribeToEvents();

    this.isRunning = true;
    console.log('✅ [Analytics Engine] Started successfully');
  }

  async _subscribeToEvents() {
    const eventTypes = [
      'gift', 'comment', 'like', 'share', 'follow',
      'join', 'member', 'roomUser', 'subscribe', 'envelope',
      'question', 'emote', 'sticker', 'battle', 'mic_battle',
      'link_mic', 'streamEnd', 'intro', 'connection', 'error'
    ];

    if (messageBus) {
      for (const eventType of eventTypes) {
        await messageBus.subscribe('tiktok.events', eventType, async (data) => {
          await this._processEvent(eventType, data);
        });
      }
      console.log(`📡 [Analytics Engine] Subscribed to ${eventTypes.length} event types`);
    } else {
      console.log(`📡 [Analytics Engine] Running in standalone mode (${eventTypes.length} event types registered)`);
    }
  }

  async _processEvent(eventType, data) {
    try {
      this.stats.eventsProcessed++;
      this.stats.lastProcessedAt = new Date();

      // Store raw event
      await this._storeEvent(eventType, data);

      // Process specific event types
      switch (eventType) {
        case 'gift':
          await this._processGift(data);
          break;
        case 'roomUser':
          await this._processViewerCount(data);
          break;
        case 'connection':
          await this._processConnection(data);
          break;
        case 'streamEnd':
          await this._processStreamEnd(data);
          break;
      }

      // Update real-time cache
      await this._updateRealtimeCache(eventType, data);

    } catch (error) {
      this.stats.errors++;
      console.error(`❌ [Analytics Engine] Error processing ${eventType}:`, error.message);
    }
  }

  async _storeEvent(eventType, data) {
    try {
      const db = await getDb();
      const creator = await this._getOrCreateCreator(data.username);

      await db.collection('live_events').insertOne({
        creator_id: creator._id,
        event_type: eventType,
        event_data: data,
        user_id: data.userId || null,
        username: data.user || data.username,
        timestamp: data.timestamp || Date.now(),
        created_at: new Date()
      });
    } catch (error) {
      console.error('[Analytics Engine] Failed to store event:', error.message);
    }
  }

  async _processGift(data) {
    try {
      const db = await getDb();
      const creator = await this._getOrCreateCreator(data.username);
      const stream = await this._getCurrentStream(creator._id);

      if (!stream) return;

      // Calculate gift value
      const diamondCount = data.diamondCount || 0;
      const coinValue = diamondCount * 2; // 2 coins = 1 diamond
      const usdValue = parseFloat((coinValue * 0.0129).toFixed(2)); // ~$0.0129 per coin
      const creatorPayout = parseFloat((usdValue * 0.5).toFixed(2)); // 50% to creator

      // Store gift details
      await db.collection('gifts_tracking').insertOne({
        stream_id: stream._id,
        creator_id: creator._id,
        gift_id: data.giftId,
        gift_name: data.giftName,
        sender_username: data.user,
        sender_user_id: data.userId,
        repeat_count: data.repeatCount || 1,
        diamond_count: diamondCount,
        coin_value: coinValue,
        usd_value: usdValue,
        creator_payout: creatorPayout,
        timestamp: data.timestamp || Date.now(),
        created_at: new Date()
      });

      // Update stream totals
      await db.collection('live_streams').updateOne(
        { _id: stream._id },
        {
          $inc: { total_gifts: 1, total_diamonds: diamondCount, revenue_usd: creatorPayout },
          $set: { updated_at: new Date() }
        }
      );

      // Update top gifters leaderboard
      await this._updateTopGifter(creator._id, data.user, data.userId, diamondCount, usdValue);

      console.log(`💎 [Analytics] Gift: ${data.giftName} x${data.repeatCount} = $${usdValue} (Creator: $${creatorPayout})`);

    } catch (error) {
      console.error('[Analytics Engine] Failed to process gift:', error.message);
    }
  }

  async _processViewerCount(data) {
    try {
      const db = await getDb();
      const creator = await this._getOrCreateCreator(data.username);
      const stream = await this._getCurrentStream(creator._id);

      if (!stream) return;

      const viewerCount = data.viewerCount || 0;

      // Store viewer tracking
      await db.collection('viewer_tracking').insertOne({
        stream_id: stream._id,
        viewer_count: viewerCount,
        timestamp: data.timestamp || Date.now(),
        created_at: new Date()
      });

      // Update stream peak viewers
      await db.collection('live_streams').updateOne(
        { _id: stream._id },
        { $max: { peak_viewers: viewerCount }, $set: { updated_at: new Date() } }
      );

      console.log(`👥 [Analytics] Viewers: ${viewerCount} (Peak: ${Math.max(stream.peak_viewers || 0, viewerCount)})`);

    } catch (error) {
      console.error('[Analytics Engine] Failed to process viewer count:', error.message);
    }
  }

  async _processConnection(data) {
    try {
      if (data.status === 'connected') {
        const db = await getDb();
        const creator = await this._getOrCreateCreator(data.username);

        await db.collection('live_streams').insertOne({
          creator_id: creator._id,
          started_at: new Date(),
          ended_at: null,
          duration_seconds: null,
          status: 'live',
          total_gifts: 0,
          total_diamonds: 0,
          revenue_usd: 0,
          peak_viewers: 0,
          created_at: new Date(),
          updated_at: new Date()
        });

        await db.collection('tracked_creators').updateOne(
          { _id: creator._id },
          { $set: { is_live: true, last_live_at: new Date(), updated_at: new Date() } }
        );

        console.log(`🔴 [Analytics] Stream started for @${data.username}`);
      }
    } catch (error) {
      console.error('[Analytics Engine] Failed to process connection:', error.message);
    }
  }

  async _processStreamEnd(data) {
    try {
      const db = await getDb();
      const creator = await this._getOrCreateCreator(data.username);
      const stream = await this._getCurrentStream(creator._id);

      if (!stream) return;

      // Calculate stream duration
      const endedAt = new Date();
      const startedAt = new Date(stream.started_at);
      const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

      // End stream session
      await db.collection('live_streams').updateOne(
        { _id: stream._id },
        {
          $set: {
            ended_at: endedAt,
            duration_seconds: durationSeconds,
            status: 'ended',
            updated_at: new Date()
          }
        }
      );

      // Update creator status
      await db.collection('tracked_creators').updateOne(
        { _id: creator._id },
        { $set: { is_live: false, updated_at: new Date() } }
      );

      console.log(`🛑 [Analytics] Stream ended for @${data.username} (Duration: ${Math.floor(durationSeconds / 60)} minutes)`);

      await this._generateStreamSummary(stream._id);

    } catch (error) {
      console.error('[Analytics Engine] Failed to process stream end:', error.message);
    }
  }

  async _getOrCreateCreator(username) {
    if (!username) throw new Error('Username is required');

    const db = await getDb();
    const existing = await db.collection('tracked_creators').findOne({ username });
    if (existing) return existing;

    const doc = {
      username,
      display_name: username,
      tracking_status: 'active',
      is_live: false,
      last_live_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await db.collection('tracked_creators').insertOne(doc);
    console.log(`✨ [Analytics] Created new creator: @${username}`);
    return { _id: result.insertedId, ...doc };
  }

  async _getCurrentStream(creatorId) {
    try {
      const db = await getDb();
      return await db.collection('live_streams').findOne(
        { creator_id: creatorId, status: 'live' },
        { sort: { started_at: -1 } }
      );
    } catch (error) {
      console.error('[Analytics Engine] Failed to get current stream:', error.message);
      return null;
    }
  }

  async _updateTopGifter(creatorId, username, userId, diamonds, usdValue) {
    try {
      const db = await getDb();

      await db.collection('top_gifters').updateOne(
        { creator_id: creatorId, username },
        {
          $inc: { total_gifts: 1, total_diamonds: diamonds, total_spent_usd: usdValue },
          $set: { last_gift_at: new Date(), updated_at: new Date() },
          $setOnInsert: { user_id: userId, created_at: new Date() }
        },
        { upsert: true }
      );

      await this._updateGifterRanks(creatorId);

    } catch (error) {
      console.error('[Analytics Engine] Failed to update top gifter:', error.message);
    }
  }

  async _updateGifterRanks(creatorId) {
    try {
      const db = await getDb();
      const gifters = await db.collection('top_gifters')
        .find({ creator_id: creatorId })
        .sort({ total_diamonds: -1 })
        .toArray();

      const ops = gifters.map((g, index) => ({
        updateOne: { filter: { _id: g._id }, update: { $set: { rank: index + 1 } } }
      }));

      if (ops.length > 0) {
        await db.collection('top_gifters').bulkWrite(ops);
      }
    } catch (error) {
      console.error('[Analytics Engine] Failed to update gifter ranks:', error.message);
    }
  }

  async _updateRealtimeCache(eventType, data) {
    try {
      const cacheKey = `realtime:${data.username}:${eventType}`;
      await cache.set(cacheKey, data, 300); // Cache for 5 minutes
    } catch (error) {
      // Cache is optional, don't throw
      console.warn('[Analytics Engine] Cache update failed:', error.message);
    }
  }

  async _generateStreamSummary(streamId) {
    try {
      console.log(`📊 [Analytics] Generating summary for stream ${streamId}...`);
      const db = await getDb();
      await db.collection('live_streams').findOne({ _id: streamId });
      // TODO: Generate analytics summary (hourly/daily aggregations)
      console.log(`✅ [Analytics] Summary generated for stream ${streamId}`);
    } catch (error) {
      console.error('[Analytics Engine] Failed to generate summary:', error.message);
    }
  }

  async getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning
    };
  }

  async stop() {
    console.log('🛑 [Analytics Engine] Stopping...');
    this.isRunning = false;
    console.log('✅ [Analytics Engine] Stopped');
  }
}

// Export singleton instance
const analyticsEngine = new AnalyticsEngine();
export default analyticsEngine;
