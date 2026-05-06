// ============================================================
// TIKTOK LIVE SERVICE - Standalone Microservice
// Port 8010 - Handles TikTok WebSocket connections
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { WebcastPushConnection } from 'tiktok-live-connector';
import MessageBus from '../../lib/message-bus.js';
import circuitBreaker from '../../lib/circuit-breaker.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.TIKTOK_SERVICE_PORT || 8011;

// Middleware
app.use(express.json());

// Initialize message bus (optional - graceful degradation without Redis)
let messageBus = null;
// Don't initialize MessageBus if Redis is not available to avoid connection errors

// Active connections map
const activeConnections = new Map();

// Reconnection config
const RECONNECT_CONFIG = {
  maxRetries: 10,
  baseDelay: 1000,
  maxDelay: 60000,
  backoffMultiplier: 2
};

// ============================================================
// TIKTOK CONNECTION MANAGER
// ============================================================

class TikTokConnectionManager {
  constructor(username) {
    this.username = username;
    this.connection = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.stats = {
      totalEvents: 0,
      gifts: 0,
      comments: 0,
      likes: 0,
      shares: 0,
      follows: 0,
      connectedAt: null,
      lastEventAt: null
    };
  }

  async connect() {
    try {
      console.log(`[TikTok] Connecting to @${this.username}...`);

      this.connection = new WebcastPushConnection(this.username, {
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        clientParams: {
          app_language: 'en-US',
          device_platform: 'web'
        }
      });

      // Setup event handlers
      this._setupEventHandlers();

      // Connect with circuit breaker
      await circuitBreaker.execute(`tiktok-${this.username}`, async () => {
        await this.connection.connect();
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.stats.connectedAt = new Date();

      console.log(`✅ [TikTok] Connected to @${this.username}`);

      // Publish connection event
      if (messageBus) {
        await messageBus.publish('tiktok.events', 'connection', {
          username: this.username,
          status: 'connected',
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error(`❌ [TikTok] Connection error for @${this.username}:`, error.message);
      this.isConnected = false;
      await this._scheduleReconnect();
    }
  }

  _setupEventHandlers() {
    // Gift event
    this.connection.on('gift', async (data) => {
      this.stats.totalEvents++;
      this.stats.gifts++;
      this.stats.lastEventAt = new Date();

      console.log(`🎁 [TikTok] Gift from ${data.uniqueId}: ${data.giftName} x${data.repeatCount}`);

      if (messageBus) {
        await messageBus.publish('tiktok.events', 'gift', {
          username: this.username,
          user: data.uniqueId,
          userId: data.userId,
          giftId: data.giftId,
          giftName: data.giftName,
          giftPictureUrl: data.giftPictureUrl,
          repeatCount: data.repeatCount,
          diamondCount: data.diamondCount,
          timestamp: Date.now()
        });
      }
    });

    // Comment event
    this.connection.on('chat', async (data) => {
      this.stats.totalEvents++;
      this.stats.comments++;
      this.stats.lastEventAt = new Date();

      console.log(`💬 [TikTok] Comment from ${data.uniqueId}: ${data.comment}`);

      if (messageBus) { await messageBus.publish('tiktok.events', 'comment', {
        username: this.username,
        user: data.uniqueId,
        userId: data.userId,
        comment: data.comment,
        timestamp: Date.now()
      }); }
    });

    // Like event
    this.connection.on('like', async (data) => {
      this.stats.totalEvents++;
      this.stats.likes++;
      this.stats.lastEventAt = new Date();

      if (messageBus) {
        await messageBus.publish('tiktok.events', 'like', {
          username: this.username,
          user: data.uniqueId,
          likeCount: data.likeCount,
          totalLikeCount: data.totalLikeCount,
          timestamp: Date.now()
        });
      }
    });

    // Share event
    this.connection.on('share', async (data) => {
      this.stats.totalEvents++;
      this.stats.shares++;
      this.stats.lastEventAt = new Date();

      if (messageBus) {
        await messageBus.publish('tiktok.events', 'share', {
          username: this.username,
          user: data.uniqueId,
          timestamp: Date.now()
        });
      }
    });

    // Follow event
    this.connection.on('follow', async (data) => {
      this.stats.totalEvents++;
      this.stats.follows++;
      this.stats.lastEventAt = new Date();

      if (messageBus) { await messageBus.publish('tiktok.events', 'follow', {
        username: this.username,
        user: data.uniqueId,
        timestamp: Date.now()
      }); }
    });

    // Disconnect handler
    this.connection.on('disconnect', async () => {
      console.log(`⚠️ [TikTok] Disconnected from @${this.username}`);
      this.isConnected = false;

      if (messageBus) { await messageBus.publish('tiktok.events', 'connection', {
        username: this.username,
        status: 'disconnected',
        timestamp: Date.now()
      }); }

      await this._scheduleReconnect();
    });

    // Error handler
    this.connection.on('error', async (error) => {
      console.error(`❌ [TikTok] Error for @${this.username}:`, error.message);
      
      if (messageBus) { await messageBus.publish('tiktok.events', 'error', {
        username: this.username,
        error: error.message,
        timestamp: Date.now()
      }); }
    });
  }

  async _scheduleReconnect() {
    if (this.reconnectAttempts >= RECONNECT_CONFIG.maxRetries) {
      console.error(`❌ [TikTok] Max reconnection attempts reached for @${this.username}`);
      return;
    }

    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, this.reconnectAttempts),
      RECONNECT_CONFIG.maxDelay
    );

    this.reconnectAttempts++;

    console.log(`🔄 [TikTok] Reconnecting to @${this.username} in ${delay}ms (attempt ${this.reconnectAttempts}/${RECONNECT_CONFIG.maxRetries})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.connection && this.isConnected) {
      await this.connection.disconnect();
    }

    this.isConnected = false;
    console.log(`🛑 [TikTok] Disconnected from @${this.username}`);
  }

  getStats() {
    return {
      username: this.username,
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      ...this.stats
    };
  }
}

// ============================================================
// API ENDPOINTS
// ============================================================

/**
 * POST /connect
 * Start monitoring a TikTok creator
 */
app.post('/connect', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (activeConnections.has(username)) {
      return res.status(400).json({ error: 'Already connected to this creator' });
    }

    const manager = new TikTokConnectionManager(username);
    activeConnections.set(username, manager);

    // Connect in background
    manager.connect();

    res.json({
      success: true,
      username,
      message: 'Connection initiated'
    });
  } catch (error) {
    console.error('[TikTok Service] Connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /disconnect
 * Stop monitoring a creator
 */
app.post('/disconnect', async (req, res) => {
  try {
    const { username } = req.body;

    const manager = activeConnections.get(username);
    if (!manager) {
      return res.status(404).json({ error: 'No active connection for this creator' });
    }

    await manager.disconnect();
    activeConnections.delete(username);

    res.json({
      success: true,
      username,
      message: 'Disconnected'
    });
  } catch (error) {
    console.error('[TikTok Service] Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /connections
 * List all active connections
 */
app.get('/connections', (req, res) => {
  const connections = [];
  
  for (const [username, manager] of activeConnections) {
    connections.push(manager.getStats());
  }

  res.json({
    total: connections.length,
    connections
  });
});

/**
 * GET /stats/:username
 * Get stats for specific creator
 */
app.get('/stats/:username', (req, res) => {
  const { username } = req.params;
  const manager = activeConnections.get(username);

  if (!manager) {
    return res.status(404).json({ error: 'No active connection for this creator' });
  }

  res.json(manager.getStats());
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (req, res) => {
  const circuitStates = circuitBreaker.getAllStates();
  
  res.json({
    status: 'ok',
    service: 'TikTok Live Service',
    port: PORT,
    activeConnections: activeConnections.size,
    messageBus: messageBus ? 'connected' : 'disconnected',
    circuitBreakers: circuitStates,
    uptime: process.uptime()
  });
});

// ============================================================
// STARTUP
// ============================================================

async function start() {
  try {
    // Start message bus (if available)
    if (messageBus) {
      await messageBus.start();
      console.log('✅ Message bus started');
    } else {
      console.log('⚠️ Running without message bus (Redis not available)');
    }

    // Auto-connect to default creator if specified
    const defaultCreator = process.env.DEFAULT_TIKTOK_CREATOR || 'darkskully';
    if (defaultCreator) {
      const manager = new TikTokConnectionManager(defaultCreator);
      activeConnections.set(defaultCreator, manager);
      await manager.connect();
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 TikTok Live Service running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start TikTok service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  
  for (const manager of activeConnections.values()) {
    await manager.disconnect();
  }
  
  if (messageBus) {
    await messageBus.stop();
  }
  process.exit(0);
});

start();
