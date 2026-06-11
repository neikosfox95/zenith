// ============================================================
// CREATOR MANAGEMENT API ROUTES (MongoDB-backed)
// Manage multiple TikTok creators for monitoring
// ============================================================

import express from 'express';
import axios from 'axios';
import { getDb } from '../lib/mongo.js';

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

    const db = await getDb();

    // Check if creator already exists in database
    const existing = await db.collection('tracked_creators').findOne({ username });

    if (existing) {
      // If already tracking, return existing
      if (existing.tracking_status === 'active') {
        return res.status(200).json({
          success: true,
          message: 'Creator already being tracked',
          creator: existing
        });
      }

      // Reactivate if was paused
      await db.collection('tracked_creators').updateOne(
        { _id: existing._id },
        { $set: { tracking_status: 'active', updated_at: new Date() } }
      );

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
          ...existing,
          tracking_status: 'active'
        }
      });
    }

    // Create new creator in database
    const doc = {
      username,
      display_name: displayName || username,
      tracking_status: 'active',
      is_live: false,
      last_live_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await db.collection('tracked_creators').insertOne(doc);
    const newCreator = { _id: result.insertedId, ...doc };

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

    const db = await getDb();

    const creator = await db.collection('tracked_creators').findOne({ username });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    // Update status to stopped (don't delete - keep historical data)
    await db.collection('tracked_creators').updateOne(
      { _id: creator._id },
      { $set: { tracking_status: 'stopped', updated_at: new Date() } }
    );

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

    const db = await getDb();

    const result = await db.collection('tracked_creators').findOneAndUpdate(
      { username },
      { $set: { tracking_status: 'paused', updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
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
      creator: result
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
    const db = await getDb();

    const filter = status ? { tracking_status: status } : {};

    const rows = await db.collection('tracked_creators')
      .find(filter)
      .sort({ last_live_at: -1, created_at: -1 })
      .toArray();

    // Get TikTok service connection status for each creator
    let tiktokConnections = [];
    try {
      const response = await axios.get(`${TIKTOK_SERVICE_URL}/connections`, { timeout: 2000 });
      tiktokConnections = response.data.connections || [];
    } catch (error) {
      // TikTok service optional in preview environment
    }

    // Merge database data with connection status
    const creators = rows.map(creator => {
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
    const db = await getDb();

    const creator = await db.collection('tracked_creators').findOne({ username });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    // Get TikTok service connection status
    let connectionStatus = null;
    try {
      const response = await axios.get(`${TIKTOK_SERVICE_URL}/stats/${username}`, { timeout: 2000 });
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

    const db = await getDb();
    const results = [];

    for (const username of usernames) {
      try {
        // Check if exists
        const existing = await db.collection('tracked_creators').findOne({ username });

        if (existing) {
          results.push({
            username,
            status: 'already_exists',
            creator: existing
          });
          continue;
        }

        // Create new creator
        const doc = {
          username,
          display_name: username,
          tracking_status: 'active',
          is_live: false,
          last_live_at: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        const inserted = await db.collection('tracked_creators').insertOne(doc);

        // Connect to TikTok service
        try {
          await axios.post(`${TIKTOK_SERVICE_URL}/connect`, { username });
        } catch (error) {
          console.error(`[Creator Management] Failed to connect ${username}:`, error.message);
        }

        results.push({
          username,
          status: 'added',
          creator: { _id: inserted.insertedId, ...doc }
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
