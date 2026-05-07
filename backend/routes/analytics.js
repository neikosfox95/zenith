// ============================================================
// ANALYTICS API ROUTES
// Endpoints for querying analytics data
// ============================================================

import express from 'express';
import { query } from '../lib/database.js';
import analyticsEngine from '../services/analytics-engine.js';

const router = express.Router();

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

    // Get creator
    const creatorResult = await query(`
      SELECT * FROM creators WHERE username = $1
    `, [username]);

    if (creatorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creator = creatorResult.rows[0];

    // Get current stream
    const streamResult = await query(`
      SELECT * FROM live_streams
      WHERE creator_id = $1 AND status = 'live'
      ORDER BY started_at DESC
      LIMIT 1
    `, [creator.id]);

    const currentStream = streamResult.rows[0] || null;

    // Get stream stats
    let streamStats = null;
    if (currentStream) {
      const statsResult = await query(`
        SELECT
          COUNT(CASE WHEN event_type = 'gift' THEN 1 END) as total_gifts,
          COUNT(CASE WHEN event_type = 'comment' THEN 1 END) as total_comments,
          COUNT(CASE WHEN event_type = 'like' THEN 1 END) as total_likes,
          COUNT(CASE WHEN event_type = 'share' THEN 1 END) as total_shares,
          COUNT(CASE WHEN event_type = 'follow' THEN 1 END) as total_follows
        FROM live_events
        WHERE creator_id = $1
        AND created_at >= (SELECT started_at FROM live_streams WHERE id = $2)
      `, [creator.id, currentStream.id]);

      streamStats = statsResult.rows[0];
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

    // Get creator
    const creatorResult = await query(`
      SELECT id FROM creators WHERE username = $1
    `, [username]);

    if (creatorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creatorId = creatorResult.rows[0].id;

    // Get top gifters
    const result = await query(`
      SELECT *
      FROM top_gifters
      WHERE creator_id = $1
      ORDER BY rank ASC
      LIMIT $2
    `, [creatorId, limit]);

    res.json({
      success: true,
      topGifters: result.rows
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

    // Get creator
    const creatorResult = await query(`
      SELECT id FROM creators WHERE username = $1
    `, [username]);

    if (creatorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creatorId = creatorResult.rows[0].id;

    // Get recent gifts
    const result = await query(`
      SELECT *
      FROM gifts_tracking
      WHERE creator_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [creatorId, limit]);

    res.json({
      success: true,
      gifts: result.rows
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

    // Get creator
    const creatorResult = await query(`
      SELECT id FROM creators WHERE username = $1
    `, [username]);

    if (creatorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creatorId = creatorResult.rows[0].id;

    // Get viewer trends
    const result = await query(`
      SELECT vt.viewer_count, vt.timestamp, ls.id as stream_id
      FROM viewer_tracking vt
      JOIN live_streams ls ON vt.stream_id = ls.id
      WHERE ls.creator_id = $1
      AND vt.created_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY vt.created_at ASC
    `, [creatorId]);

    res.json({
      success: true,
      trends: result.rows
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

    // Get creator
    const creatorResult = await query(`
      SELECT id FROM creators WHERE username = $1
    `, [username]);

    if (creatorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creatorId = creatorResult.rows[0].id;

    // Get stream history
    const result = await query(`
      SELECT *
      FROM live_streams
      WHERE creator_id = $1
      ORDER BY started_at DESC
      LIMIT $2
    `, [creatorId, limit]);

    res.json({
      success: true,
      streams: result.rows
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

    // Get creator
    const creatorResult = await query(`
      SELECT id FROM creators WHERE username = $1
    `, [username]);

    if (creatorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creatorId = creatorResult.rows[0].id;

    // Build query
    let sql = `
      SELECT *
      FROM live_events
      WHERE creator_id = $1
    `;
    const params = [creatorId];

    if (eventType) {
      sql += ` AND event_type = $2`;
      params.push(eventType);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);

    res.json({
      success: true,
      events: result.rows
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
    const result = await query(`
      SELECT * FROM creators
      WHERE tracking_status = 'active'
      ORDER BY last_live_at DESC NULLS LAST
    `);

    res.json({
      success: true,
      creators: result.rows
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
