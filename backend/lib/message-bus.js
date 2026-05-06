// ============================================================
// MESSAGE BUS - Redis Streams Wrapper
// Event-driven communication between services
// ============================================================

import Redis from 'ioredis';
import { EventEmitter } from 'events';

class MessageBus extends EventEmitter {
  constructor(redisUrl = 'redis://localhost:6379') {
    super();
    this.redis = new Redis(redisUrl);
    this.consumers = new Map();
    this.isRunning = false;
  }

  /**
   * Publish event to stream
   */
  async publish(stream, event, data) {
    try {
      const message = {
        event,
        data: JSON.stringify(data),
        timestamp: Date.now(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const id = await this.redis.xadd(
        stream,
        'MAXLEN',
        '~',
        10000, // Keep last 10k messages
        '*',
        'event', message.event,
        'data', message.data,
        'timestamp', message.timestamp,
        'id', message.id
      );

      console.log(`[MessageBus] Published to ${stream}:`, event);
      return id;
    } catch (error) {
      console.error(`[MessageBus] Publish error:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to stream with consumer group
   */
  async subscribe(stream, group, consumer, handler) {
    try {
      // Create consumer group if doesn't exist
      try {
        await this.redis.xgroup('CREATE', stream, group, '0', 'MKSTREAM');
      } catch (err) {
        // Group already exists
      }

      const key = `${stream}:${group}:${consumer}`;
      this.consumers.set(key, { stream, group, consumer, handler });

      console.log(`[MessageBus] Subscribed: ${key}`);
    } catch (error) {
      console.error(`[MessageBus] Subscribe error:`, error);
      throw error;
    }
  }

  /**
   * Start consuming messages
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[MessageBus] Starting consumers...`);

    for (const [key, config] of this.consumers) {
      this._consumeStream(config);
    }
  }

  /**
   * Internal: Consume from stream
   */
  async _consumeStream({ stream, group, consumer, handler }) {
    while (this.isRunning) {
      try {
        // Read new messages
        const results = await this.redis.xreadgroup(
          'GROUP', group, consumer,
          'COUNT', 10,
          'BLOCK', 1000,
          'STREAMS', stream, '>'
        );

        if (!results) continue;

        for (const [streamName, messages] of results) {
          for (const [id, fields] of messages) {
            const message = this._parseMessage(fields);
            
            try {
              await handler(message);
              
              // Acknowledge message
              await this.redis.xack(stream, group, id);
            } catch (error) {
              console.error(`[MessageBus] Handler error:`, error);
              // Message will be retried by pending entry mechanism
            }
          }
        }
      } catch (error) {
        console.error(`[MessageBus] Consume error:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Parse message from Redis stream
   */
  _parseMessage(fields) {
    const message = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      message[key] = key === 'data' ? JSON.parse(value) : value;
    }
    return message;
  }

  /**
   * Stop all consumers
   */
  async stop() {
    this.isRunning = false;
    await this.redis.quit();
    console.log(`[MessageBus] Stopped`);
  }

  /**
   * Get pending messages (for retry logic)
   */
  async getPending(stream, group, consumer) {
    const pending = await this.redis.xpending(stream, group, '-', '+', 100, consumer);
    return pending;
  }
}

export default MessageBus;
