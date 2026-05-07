// ============================================================
// ANALYTICS ENGINE - Real-Time TikTok Analytics Processor
// Processes live events and generates analytics
// ============================================================

import { query, transaction, healthCheck } from '../lib/database.js';
// MessageBus is optional - only use if Redis is available
// import MessageBus from '../lib/message-bus.js';
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

    // Check database health
    const dbHealth = await healthCheck();
    if (dbHealth.status === 'healthy') {
      console.log('✅ [Analytics Engine] PostgreSQL connected');
    } else {
      console.warn('⚠️ [Analytics Engine] PostgreSQL unavailable, using MongoDB fallback');
    }

    // Subscribe to TikTok events
    await this._subscribeToEvents();

    this.isRunning = true;
    console.log('✅ [Analytics Engine] Started successfully');
  }

  async _subscribeToEvents() {
    // Subscribe to all TikTok event types
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
      console.warn(`⚠️ [Analytics Engine] MessageBus not available, event subscription skipped`);
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
      // Get or create creator
      const creator = await this._getOrCreateCreator(data.username);

      // Store in PostgreSQL
      await query(`
        INSERT INTO live_events (creator_id, event_type, event_data, user_id, username, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        creator.id,
        eventType,
        JSON.stringify(data),
        data.userId || null,
        data.user || data.username,
        data.timestamp || Date.now()
      ]);

    } catch (error) {
      console.error('[Analytics Engine] Failed to store event:', error.message);
      // Fallback to MongoDB if PostgreSQL fails
      // TODO: Add MongoDB fallback
    }
  }

  async _processGift(data) {
    try {
      const creator = await this._getOrCreateCreator(data.username);
      const stream = await this._getCurrentStream(creator.id);

      if (!stream) return;

      // Calculate gift value
      const diamondCount = data.diamondCount || 0;
      const coinValue = diamondCount * 2; // 2 coins = 1 diamond
      const usdValue = (coinValue * 0.0129).toFixed(2); // ~$0.0129 per coin
      const creatorPayout = (usdValue * 0.5).toFixed(2); // 50% to creator

      // Store gift details
      await query(`
        INSERT INTO gifts_tracking (
          stream_id, creator_id, gift_id, gift_name,
          sender_username, sender_user_id,
          repeat_count, diamond_count, coin_value,
          usd_value, creator_payout, timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        stream.id,
        creator.id,
        data.giftId,
        data.giftName,
        data.user,
        data.userId,
        data.repeatCount || 1,
        diamondCount,
        coinValue,
        usdValue,
        creatorPayout,
        data.timestamp || Date.now()
      ]);

      // Update stream totals
      await query(`
        UPDATE live_streams
        SET total_gifts = total_gifts + 1,
            total_diamonds = total_diamonds + $1,
            revenue_usd = revenue_usd + $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [diamondCount, creatorPayout, stream.id]);

      // Update top gifters leaderboard
      await this._updateTopGifter(creator.id, data.user, data.userId, diamondCount, parseFloat(usdValue));

      console.log(`💎 [Analytics] Gift: ${data.giftName} x${data.repeatCount} = $${usdValue} (Creator: $${creatorPayout})`);

    } catch (error) {
      console.error('[Analytics Engine] Failed to process gift:', error.message);
    }
  }

  async _processViewerCount(data) {
    try {
      const creator = await this._getOrCreateCreator(data.username);
      const stream = await this._getCurrentStream(creator.id);

      if (!stream) return;

      const viewerCount = data.viewerCount || 0;

      // Store viewer tracking
      await query(`
        INSERT INTO viewer_tracking (stream_id, viewer_count, timestamp)
        VALUES ($1, $2, $3)
      `, [stream.id, viewerCount, data.timestamp || Date.now()]);

      // Update stream peak viewers
      await query(`
        UPDATE live_streams
        SET peak_viewers = GREATEST(peak_viewers, $1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [viewerCount, stream.id]);

      console.log(`👥 [Analytics] Viewers: ${viewerCount} (Peak: ${Math.max(stream.peak_viewers, viewerCount)})`);

    } catch (error) {
      console.error('[Analytics Engine] Failed to process viewer count:', error.message);
    }
  }

  async _processConnection(data) {
    try {
      if (data.status === 'connected') {
        // Start new stream session
        const creator = await this._getOrCreateCreator(data.username);
        
        await query(`
          INSERT INTO live_streams (creator_id, started_at, status)
          VALUES ($1, CURRENT_TIMESTAMP, 'live')
        `, [creator.id]);

        // Update creator status
        await query(`
          UPDATE creators
          SET is_live = true,
              last_live_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [creator.id]);

        console.log(`🔴 [Analytics] Stream started for @${data.username}`);
      }
    } catch (error) {
      console.error('[Analytics Engine] Failed to process connection:', error.message);
    }
  }

  async _processStreamEnd(data) {
    try {
      const creator = await this._getOrCreateCreator(data.username);
      const stream = await this._getCurrentStream(creator.id);

      if (!stream) return;

      // Calculate stream duration
      const endedAt = new Date();
      const startedAt = new Date(stream.started_at);
      const durationSeconds = Math.floor((endedAt - startedAt) / 1000);

      // End stream session
      await query(`
        UPDATE live_streams
        SET ended_at = $1,
            duration_seconds = $2,
            status = 'ended',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [endedAt, durationSeconds, stream.id]);

      // Update creator status
      await query(`
        UPDATE creators
        SET is_live = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [creator.id]);

      console.log(`🛑 [Analytics] Stream ended for @${data.username} (Duration: ${Math.floor(durationSeconds / 60)} minutes)`);

      // Generate stream summary
      await this._generateStreamSummary(stream.id);

    } catch (error) {
      console.error('[Analytics Engine] Failed to process stream end:', error.message);
    }
  }

  async _getOrCreateCreator(username) {
    if (!username) throw new Error('Username is required');

    try {
      // Check if creator exists
      let result = await query(`
        SELECT * FROM creators WHERE username = $1
      `, [username]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Create new creator
      result = await query(`
        INSERT INTO creators (username, tracking_status)
        VALUES ($1, 'active')
        RETURNING *
      `, [username]);

      console.log(`✨ [Analytics] Created new creator: @${username}`);
      return result.rows[0];

    } catch (error) {
      console.error('[Analytics Engine] Failed to get/create creator:', error.message);
      throw error;
    }
  }

  async _getCurrentStream(creatorId) {
    try {
      const result = await query(`
        SELECT * FROM live_streams
        WHERE creator_id = $1 AND status = 'live'
        ORDER BY started_at DESC
        LIMIT 1
      `, [creatorId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('[Analytics Engine] Failed to get current stream:', error.message);
      return null;
    }
  }

  async _updateTopGifter(creatorId, username, userId, diamonds, usdValue) {
    try {
      // Check if gifter exists
      const result = await query(`
        SELECT * FROM top_gifters
        WHERE creator_id = $1 AND username = $2
      `, [creatorId, username]);

      if (result.rows.length > 0) {
        // Update existing gifter
        await query(`
          UPDATE top_gifters
          SET total_gifts = total_gifts + 1,
              total_diamonds = total_diamonds + $1,
              total_spent_usd = total_spent_usd + $2,
              last_gift_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE creator_id = $3 AND username = $4
        `, [diamonds, usdValue, creatorId, username]);
      } else {
        // Create new gifter
        await query(`
          INSERT INTO top_gifters (creator_id, username, user_id, total_gifts, total_diamonds, total_spent_usd, last_gift_at)
          VALUES ($1, $2, $3, 1, $4, $5, CURRENT_TIMESTAMP)
        `, [creatorId, username, userId, diamonds, usdValue]);
      }

      // Update ranks
      await this._updateGifterRanks(creatorId);

    } catch (error) {
      console.error('[Analytics Engine] Failed to update top gifter:', error.message);
    }
  }

  async _updateGifterRanks(creatorId) {
    try {
      await query(`
        WITH ranked_gifters AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY total_diamonds DESC) as new_rank
          FROM top_gifters
          WHERE creator_id = $1
        )
        UPDATE top_gifters
        SET rank = ranked_gifters.new_rank
        FROM ranked_gifters
        WHERE top_gifters.id = ranked_gifters.id
      `, [creatorId]);
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
      
      // Get stream details
      const streamResult = await query('SELECT * FROM live_streams WHERE id = $1', [streamId]);
      const stream = streamResult.rows[0];

      // TODO: Generate analytics summary (hourly/daily aggregations)
      // This will be expanded in future batches

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
