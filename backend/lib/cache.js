// ============================================================
// CACHE MANAGER - Multi-layer caching
// ============================================================

import Redis from 'ioredis';
import crypto from 'crypto';

class CacheManager {
  constructor(redisUrl = 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    this.memoryCache = new Map();
    this.memoryCacheMaxSize = 1000;
    this.isConnected = false;

    this.redis.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Cache Manager connected to Redis');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Cache Manager Redis error:', err);
      this.isConnected = false;
    });
  }

  /**
   * Generate cache key from params
   */
  generateKey(prefix, params) {
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('md5').update(paramsStr).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Get from cache (memory first, then Redis)
   */
  async get(key) {
    try {
      // Try memory cache first
      if (this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        if (cached.expiry > Date.now()) {
          return cached.value;
        }
        this.memoryCache.delete(key);
      }

      // Try Redis
      if (this.isConnected) {
        const data = await this.redis.get(key);
        if (data) {
          const value = JSON.parse(data);
          // Store in memory for faster next access
          this._setMemory(key, value, 60); // 60s in memory
          return value;
        }
      }

      return null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      return null;
    }
  }

  /**
   * Set in cache (both memory and Redis)
   */
  async set(key, value, ttlSeconds = 3600) {
    try {
      // Set in memory
      this._setMemory(key, value, Math.min(ttlSeconds, 300)); // Max 5 min in memory

      // Set in Redis
      if (this.isConnected) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      }

      return true;
    } catch (error) {
      console.error('[Cache] Set error:', error);
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async delete(key) {
    try {
      this.memoryCache.delete(key);
      if (this.isConnected) {
        await this.redis.del(key);
      }
      return true;
    } catch (error) {
      console.error('[Cache] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete by pattern
   */
  async deletePattern(pattern) {
    try {
      if (this.isConnected) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Clear matching keys from memory
      for (const key of this.memoryCache.keys()) {
        if (this._matchPattern(key, pattern)) {
          this.memoryCache.delete(key);
        }
      }
      
      return true;
    } catch (error) {
      console.error('[Cache] Delete pattern error:', error);
      return false;
    }
  }

  /**
   * Wrap async function with caching
   */
  async wrap(key, fn, ttl = 3600) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  /**
   * Internal: Set in memory cache
   */
  _setMemory(key, value, ttlSeconds) {
    // LRU eviction if cache is full
    if (this.memoryCache.size >= this.memoryCacheMaxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  /**
   * Internal: Match pattern
   */
  _matchPattern(key, pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      memoryMaxSize: this.memoryCacheMaxSize,
      redisConnected: this.isConnected
    };
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();
    if (this.isConnected) {
      await this.redis.flushdb();
    }
  }
}

export default CacheManager;
