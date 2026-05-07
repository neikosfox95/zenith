// ============================================================
// CREATOR MANAGEMENT API ROUTES
// Manage multiple TikTok creators for monitoring
// ============================================================

import express from 'express';
import { query } from '../lib/database.js';
import axios from 'axios';

const router = express.Router();

const TIKTOK_SERVICE_URL = process.env.TIKTOK_SERVICE_URL || 'http://localhost:8011';

// ============================================================
// ADD CREATOR TO TRACKING
// ============================================================

router.post('/add', async (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Check if creator already exists in database
    const existingCreator = await query(`
      SELECT * FROM creators WHERE username = $1
    `, [username]);

    if (existingCreator.rows.length > 0) {
      const creator = existingCreator.rows[0];
      
      // If already tracking, return existing
      if (creator.tracking_status === 'active') {
        return res.status(200).json({
          success: true,
          message: 'Creator already being tracked',
          creator
        });
      }

      // Reactivate if was paused
      await query(`
        UPDATE creators
        SET tracking_status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [creator.id]);

      // Connect to TikTok service
      try {
        await axios.post(`${TIKTOK_SERVICE_URL}/connect`, { username });
      } catch (error) {
        console.error(`[Creator Management] Failed to connect to TikTok service:`, error.message);
      }

      return res.json({
        success: true,
        message: 'Creator reactivated',
        creator: {
          ...creator,
          tracking_status: 'active'
        }
      });
    }

    // Create new creator in database
    const result = await query(`
      INSERT INTO creators (username, display_name, tracking_status)
      VALUES ($1, $2, 'active')
      RETURNING *
    `, [username, displayName || username]);

    const newCreator = result.rows[0];

    // Connect to TikTok service
    try {
      const tiktokResponse = await axios.post(`${TIKTOK_SERVICE_URL}/connect`, { username });
      console.log(`✅ [Creator Management] Connected to @${username}:`, tiktokResponse.data.message);
    } catch (error) {
      console.error(`[Creator Management] Failed to connect to TikTok service:`, error.message);
      // Continue anyway - creator is in DB, service will retry
    }

    res.json({
      success: true,
      message: 'Creator added and tracking started',
      creator: newCreator
    });

  } catch (error) {
    console.error('[Creator Management] Add creator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// REMOVE CREATOR FROM TRACKING
// ============================================================

router.post('/remove', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Check if creator exists
    const result = await query(`
      SELECT * FROM creators WHERE username = $1
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creator = result.rows[0];

    // Update status to stopped (don't delete - keep historical data)
    await query(`
      UPDATE creators
      SET tracking_status = 'stopped',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [creator.id]);

    // Disconnect from TikTok service
    try {
      await axios.post(`${TIKTOK_SERVICE_URL}/disconnect`, { username });
      console.log(`🛑 [Creator Management] Disconnected from @${username}`);
    } catch (error) {
      console.error(`[Creator Management] Failed to disconnect from TikTok service:`, error.message);
    }

    res.json({
      success: true,
      message: 'Creator removed from tracking',
      creator: {
        ...creator,
        tracking_status: 'stopped'
      }
    });

  } catch (error) {
    console.error('[Creator Management] Remove creator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// PAUSE CREATOR TRACKING
// ============================================================

router.post('/pause', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Update status to paused
    const result = await query(`
      UPDATE creators
      SET tracking_status = 'paused',
          updated_at = CURRENT_TIMESTAMP
      WHERE username = $1
      RETURNING *
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    // Disconnect from TikTok service
    try {
      await axios.post(`${TIKTOK_SERVICE_URL}/disconnect`, { username });
    } catch (error) {
      console.error(`[Creator Management] Failed to disconnect:`, error.message);
    }

    res.json({
      success: true,
      message: 'Creator tracking paused',
      creator: result.rows[0]
    });

  } catch (error) {
    console.error('[Creator Management] Pause creator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// LIST ALL CREATORS
// ============================================================

router.get('/list', async (req, res) => {
  try {
    const { status } = req.query; // Filter by status: active, paused, stopped

    let sql = 'SELECT * FROM creators';
    const params = [];

    if (status) {
      sql += ' WHERE tracking_status = $1';
      params.push(status);
    }

    sql += ' ORDER BY last_live_at DESC NULLS LAST, created_at DESC';

    const result = await query(sql, params);

    // Get TikTok service connection status for each creator
    let tiktokConnections = [];
    try {
      const response = await axios.get(`${TIKTOK_SERVICE_URL}/connections`);
      tiktokConnections = response.data.connections || [];
    } catch (error) {
      console.error('[Creator Management] Failed to get TikTok connections:', error.message);
    }

    // Merge database data with connection status
    const creators = result.rows.map(creator => {
      const connection = tiktokConnections.find(c => c.username === creator.username);
      return {
        ...creator,
        connectionStatus: connection ? {
          isConnected: connection.isConnected,
          totalEvents: connection.totalEvents,
          viewers: connection.viewers
        } : null
      };
    });

    res.json({
      success: true,
      total: creators.length,
      creators
    });

  } catch (error) {
    console.error('[Creator Management] List creators error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET SINGLE CREATOR INFO
// ============================================================

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await query(`
      SELECT * FROM creators WHERE username = $1
    `, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    const creator = result.rows[0];

    // Get TikTok service connection status
    let connectionStatus = null;
    try {
      const response = await axios.get(`${TIKTOK_SERVICE_URL}/stats/${username}`);
      connectionStatus = response.data;
    } catch (error) {
      // Not connected or not found
      connectionStatus = { isConnected: false };
    }

    res.json({
      success: true,
      creator: {
        ...creator,
        connectionStatus
      }
    });

  } catch (error) {
    console.error('[Creator Management] Get creator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// BULK ADD CREATORS
// ============================================================

router.post('/bulk-add', async (req, res) => {
  try {
    const { usernames } = req.body;

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'usernames array is required'
      });
    }

    if (usernames.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 creators at a time'
      });
    }

    const results = [];

    for (const username of usernames) {
      try {
        // Check if exists
        const existing = await query(`
          SELECT * FROM creators WHERE username = $1
        `, [username]);

        if (existing.rows.length > 0) {
          results.push({
            username,
            status: 'already_exists',
            creator: existing.rows[0]
          });
          continue;
        }

        // Create new creator
        const result = await query(`
          INSERT INTO creators (username, tracking_status)
          VALUES ($1, 'active')
          RETURNING *
        `, [username]);

        // Connect to TikTok service
        try {
          await axios.post(`${TIKTOK_SERVICE_URL}/connect`, { username });
        } catch (error) {
          console.error(`[Creator Management] Failed to connect ${username}:`, error.message);
        }

        results.push({
          username,
          status: 'added',
          creator: result.rows[0]
        });

      } catch (error) {
        results.push({
          username,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[Creator Management] Bulk add error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
