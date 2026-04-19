// Enhanced TikTok Live Service with dual library support
// Supports both tiktok-live-connector (current) and @tiktool/live (upgraded)

import { WebcastPushConnection } from 'tiktok-live-connector';
import WebSocket from 'ws';

/**
 * TikTok Live Monitor with support for multiple backends
 * 
 * Features:
 * - Primary: tiktok-live-connector (no API key required)
 * - Secondary: @tiktool/live (requires API key from tik.tools)
 * - Automatic failover between services
 * - Real-time events: chat, gifts, likes, follows, viewers
 * - AI captions & translation (tiktool only)
 */

export class TikTokLiveMonitor {
  constructor(username, options = {}) {
    this.username = username;
    this.options = options;
    this.connection = null;
    this.wsConnection = null;
    this.isConnected = false;
    this.useT iktool = options.tiktoolApiKey ? true : false;
    this.listeners = {};
  }

  /**
   * Connect to TikTok Live using primary method (tiktok-live-connector)
   */
  async connectPrimary() {
    try {
      this.connection = new WebcastPushConnection(this.username, {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
        clientParams: {},
        requestOptions: {
          timeout: 10000
        },
        websocketOptions: {
          timeout: 10000
        }
      });

      // Setup event listeners
      this.connection.on('connected', () => {
        console.log(`✅ Connected to @${this.username}'s live stream (primary)`);
        this.isConnected = true;
        this.emit('connected', { username: this.username, method: 'primary' });
      });

      this.connection.on('disconnected', () => {
        console.log(`❌ Disconnected from @${this.username}`);
        this.isConnected = false;
        this.emit('disconnected', { username: this.username });
      });

      this.connection.on('streamEnd', () => {
        console.log(`📴 Stream ended for @${this.username}`);
        this.emit('streamEnd', { username: this.username });
      });

      this.connection.on('chat', (data) => {
        this.emit('chat', {
          user: data.uniqueId,
          nickname: data.nickname,
          comment: data.comment,
          timestamp: new Date()
        });
      });

      this.connection.on('gift', (data) => {
        this.emit('gift', {
          user: data.uniqueId,
          nickname: data.nickname,
          giftName: data.giftName,
          giftId: data.giftId,
          diamondCount: data.diamondCount,
          repeatCount: data.repeatCount || 1,
          repeatEnd: data.repeatEnd || false,
          timestamp: new Date()
        });
      });

      this.connection.on('like', (data) => {
        this.emit('like', {
          user: data.uniqueId,
          nickname: data.nickname,
          likeCount: data.likeCount,
          totalLikeCount: data.totalLikeCount,
          timestamp: new Date()
        });
      });

      this.connection.on('follow', (data) => {
        this.emit('follow', {
          user: data.uniqueId,
          nickname: data.nickname,
          timestamp: new Date()
        });
      });

      this.connection.on('share', (data) => {
        this.emit('share', {
          user: data.uniqueId,
          nickname: data.nickname,
          timestamp: new Date()
        });
      });

      this.connection.on('roomUser', (data) => {
        this.emit('viewerCount', {
          viewerCount: data.viewerCount,
          timestamp: new Date()
        });
      });

      this.connection.on('error', (err) => {
        console.error('TikTok Live error:', err);
        this.emit('error', { error: err.message });
      });

      // Connect
      await this.connection.connect();
      return true;

    } catch (error) {
      console.error('Failed to connect with primary method:', error);
      return false;
    }
  }

  /**
   * Connect to TikTok Live using secondary method (@tiktool/live)
   * Requires API key from https://tik.tools
   */
  async connectSecondary() {
    if (!this.options.tiktoolApiKey) {
      console.log('⚠️ TikTool API key not provided, skipping secondary connection');
      return false;
    }

    try {
      const wsUrl = `wss://api.tik.tools?uniqueId=${this.username}&apiKey=${this.options.tiktoolApiKey}`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.on('open', () => {
        console.log(`✅ Connected to @${this.username}'s live stream (tiktool - with AI features)`);
        this.isConnected = true;
        this.emit('connected', { username: this.username, method: 'tiktool', features: ['ai-captions', 'translation'] });
      });

      this.wsConnection.on('message', (msg) => {
        try {
          const data = JSON.parse(msg);
          
          switch(data.event) {
            case 'chat':
              this.emit('chat', {
                user: data.user,
                nickname: data.nickname || data.user,
                comment: data.comment,
                timestamp: new Date()
              });
              break;

            case 'gift':
              this.emit('gift', {
                user: data.user,
                nickname: data.nickname || data.user,
                giftName: data.giftName,
                giftId: data.giftId,
                diamondCount: data.diamondCount || 0,
                repeatCount: data.repeatCount || 1,
                timestamp: new Date()
              });
              break;

            case 'like':
              this.emit('like', {
                user: data.user,
                nickname: data.nickname || data.user,
                likeCount: data.likeCount || 1,
                timestamp: new Date()
              });
              break;

            case 'follow':
              this.emit('follow', {
                user: data.user,
                nickname: data.nickname || data.user,
                timestamp: new Date()
              });
              break;

            case 'caption':
              // AI-powered live captions (tiktool exclusive)
              this.emit('caption', {
                text: data.text,
                language: data.language,
                confidence: data.confidence,
                timestamp: new Date()
              });
              break;

            case 'translation':
              // AI translation (tiktool exclusive)
              this.emit('translation', {
                originalText: data.original,
                translatedText: data.translated,
                fromLanguage: data.from,
                toLanguage: data.to,
                timestamp: new Date()
              });
              break;

            case 'viewer_count':
              this.emit('viewerCount', {
                viewerCount: data.count,
                timestamp: new Date()
              });
              break;

            default:
              console.log(`📦 Received event: ${data.event}`);
          }
        } catch (error) {
          console.error('Error parsing TikTool message:', error);
        }
      });

      this.wsConnection.on('close', () => {
        console.log(`❌ Disconnected from @${this.username} (tiktool)`);
        this.isConnected = false;
        this.emit('disconnected', { username: this.username });
      });

      this.wsConnection.on('error', (err) => {
        console.error('TikTool WebSocket error:', err);
        this.emit('error', { error: err.message });
      });

      return true;

    } catch (error) {
      console.error('Failed to connect with TikTool:', error);
      return false;
    }
  }

  /**
   * Smart connect with automatic failover
   */
  async connect() {
    // Try TikTool first if API key is provided (better features)
    if (this.useT iktool) {
      const tiktoolSuccess = await this.connectSecondary();
      if (tiktoolSuccess) return true;
      console.log('⚠️ TikTool connection failed, falling back to primary method');
    }

    // Fallback to primary method
    const primarySuccess = await this.connectPrimary();
    if (primarySuccess) return true;

    throw new Error('Failed to connect with both methods');
  }

  /**
   * Disconnect from live stream
   */
  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }

    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.isConnected = false;
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      username: this.username,
      isConnected: this.isConnected,
      method: this.wsConnection ? 'tiktool' : this.connection ? 'primary' : 'none',
      features: this.wsConnection ? ['ai-captions', 'translation', 'advanced'] : ['basic']
    };
  }
}

/**
 * Factory function to create monitors
 */
export function createTikTokMonitor(username, options = {}) {
  return new TikTokLiveMonitor(username, options);
}

/**
 * Helper to check if user is live
 */
export async function checkIfLive(username) {
  try {
    const tempConnection = new WebcastPushConnection(username);
    const state = await tempConnection.getAvailableGifts();
    return state ? true : false;
  } catch (error) {
    return false;
  }
}

export default { TikTokLiveMonitor, createTikTokMonitor, checkIfLive };
