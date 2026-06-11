// ============================================================
// ANALYTICS API ROUTES (MongoDB-backed)
// Endpoints for querying analytics data
// ============================================================

import express from 'express';
import { getDb } from '../lib/mongo.js';
import analyticsEngine from '../services/analytics-engine.js';

const router = express.Router();

// Helper: find a tracked creator by username
async function findCreator(username) {
  const db = await getDb();
  return db.collection('tracked_creators').findOne({ username });
}

// ============================================================
// ANALYTICS ENGINE STATUS
// ============================================================

router.get('/status', async (req, res) => {
  try {
    const stats = await analyticsEngine.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// CREATOR ANALYTICS
// ============================================================

router.get('/creator/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const db = await getDb();

    const creator = await findCreator(username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    // Get current stream
    const currentStream = await db.collection('live_streams').findOne(
      { creator_id: creator._id, status: 'live' },
      { sort: { started_at: -1 } }
    );

    // Get stream stats
    let streamStats = null;
    if (currentStream) {
      const counts = await db.collection('live_events').aggregate([
        {
          $match: {
            creator_id: creator._id,
            created_at: { $gte: new Date(currentStream.started_at) }
          }
        },
        { $group: { _id: '$event_type', count: { $sum: 1 } } }
      ]).toArray();

      const byType = Object.fromEntries(counts.map(c => [c._id, c.count]));
      streamStats = {
        total_gifts: byType.gift || 0,
        total_comments: byType.comment || 0,
        total_likes: byType.like || 0,
        total_shares: byType.share || 0,
        total_follows: byType.follow || 0
      };
    }

    res.json({
      success: true,
      creator,
      currentStream,
      streamStats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// TOP GIFTERS LEADERBOARD
// ============================================================

router.get('/creator/:username/top-gifters', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const db = await getDb();

    const creator = await findCreator(username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const topGifters = await db.collection('top_gifters')
      .find({ creator_id: creator._id })
      .sort({ rank: 1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      topGifters
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// RECENT GIFTS
// ============================================================

router.get('/creator/:username/recent-gifts', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const db = await getDb();

    const creator = await findCreator(username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const gifts = await db.collection('gifts_tracking')
      .find({ creator_id: creator._id })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      gifts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// VIEWER TRENDS
// ============================================================

router.get('/creator/:username/viewer-trends', async (req, res) => {
  try {
    const { username } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    const db = await getDb();

    const creator = await findCreator(username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Join viewer_tracking with this creator's streams
    const streamIds = await db.collection('live_streams')
      .find({ creator_id: creator._id })
      .project({ _id: 1 })
      .toArray();

    const trends = await db.collection('viewer_tracking')
      .find({
        stream_id: { $in: streamIds.map(s => s._id) },
        created_at: { $gte: since }
      })
      .sort({ created_at: 1 })
      .toArray();

    res.json({
      success: true,
      trends: trends.map(t => ({
        viewer_count: t.viewer_count,
        timestamp: t.timestamp,
        stream_id: t.stream_id
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// STREAM HISTORY
// ============================================================

router.get('/creator/:username/streams', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const db = await getDb();

    const creator = await findCreator(username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const streams = await db.collection('live_streams')
      .find({ creator_id: creator._id })
      .sort({ started_at: -1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      streams
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// REAL-TIME EVENTS (Last N events)
// ============================================================

router.get('/creator/:username/events', async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const eventType = req.query.type;
    const db = await getDb();

    const creator = await findCreator(username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const filter = { creator_id: creator._id };
    if (eventType) {
      filter.event_type = eventType;
    }

    const events = await db.collection('live_events')
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      events
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// ALL TRACKED CREATORS
// ============================================================

router.get('/creators', async (req, res) => {
  try {
    const db = await getDb();

    const creators = await db.collection('tracked_creators')
      .find({ tracking_status: 'active' })
      .sort({ last_live_at: -1 })
      .toArray();

    res.json({
      success: true,
      creators
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GLOBAL TOP GIFTERS (across all creators)
// ============================================================

router.get('/top-gifters', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const db = await getDb();

    const topGifters = await db.collection('top_gifters')
      .find({})
      .sort({ total_diamonds: -1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      topGifters
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GLOBAL REVENUE HISTORY (daily aggregate, all creators)
// ============================================================

router.get('/revenue-history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const db = await getDb();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await db.collection('gifts_tracking').aggregate([
      { $match: { created_at: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          revenue_usd: { $sum: '$creator_payout' },
          gifts: { $sum: 1 },
          diamonds: { $sum: '$diamond_count' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Fill missing days with zeros so charts always have `days` points
    const byDate = Object.fromEntries(rows.map(r => [r._id, r]));
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const row = byDate[key];
      history.push({
        date: key,
        revenue: Math.round((row?.revenue_usd || 0) * 100), // cents
        gifts: row?.gifts || 0,
        diamonds: row?.diamonds || 0
      });
    }

    res.json({
      success: true,
      history
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
