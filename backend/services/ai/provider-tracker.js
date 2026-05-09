/**
 * PROVIDER USAGE TRACKER
 * Tracks which provider (Emergent, Atlas, Mock) handles each request
 */

class ProviderUsageTracker {
  constructor() {
    // In-memory storage (replace with database in production)
    this.requests = [];
    this.stats = {
      emergent: { requests: 0, cost: 0, tokens: 0, success: 0, failed: 0 },
      atlas: { requests: 0, cost: 0, tokens: 0, success: 0, failed: 0 },
      mock: { requests: 0, cost: 0, tokens: 0, success: 0, failed: 0 }
    };
  }

  /**
   * Track a generation request
   */
  track(data) {
    const {
      type, // 'text', 'image', 'video', 'audio', 'music'
      model,
      provider, // 'emergent-primary', 'atlas-backup', 'mock-fallback'
      source,
      cost = 0,
      tokens = 0,
      success = true,
      prompt = '',
      result = ''
    } = data;

    const request = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      model,
      provider,
      source,
      cost,
      tokens,
      success,
      promptLength: prompt.length,
      resultLength: result.length
    };

    // Store request
    this.requests.unshift(request);
    
    // Keep only last 100 requests
    if (this.requests.length > 100) {
      this.requests = this.requests.slice(0, 100);
    }

    // Update stats
    let providerKey = 'mock';
    if (source === 'emergent-primary') providerKey = 'emergent';
    else if (source === 'atlas-backup' || source === 'atlas-primary') providerKey = 'atlas';

    this.stats[providerKey].requests++;
    this.stats[providerKey].cost += cost;
    this.stats[providerKey].tokens += tokens;
    
    if (success) {
      this.stats[providerKey].success++;
    } else {
      this.stats[providerKey].failed++;
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    const total = {
      requests: this.stats.emergent.requests + this.stats.atlas.requests + this.stats.mock.requests,
      cost: this.stats.emergent.cost + this.stats.atlas.cost + this.stats.mock.cost,
      tokens: this.stats.emergent.tokens + this.stats.atlas.tokens + this.stats.mock.tokens
    };

    return {
      total,
      byProvider: {
        emergent: {
          ...this.stats.emergent,
          percentage: total.requests > 0 ? ((this.stats.emergent.requests / total.requests) * 100).toFixed(1) : 0
        },
        atlas: {
          ...this.stats.atlas,
          percentage: total.requests > 0 ? ((this.stats.atlas.requests / total.requests) * 100).toFixed(1) : 0
        },
        mock: {
          ...this.stats.mock,
          percentage: total.requests > 0 ? ((this.stats.mock.requests / total.requests) * 100).toFixed(1) : 0
        }
      },
      recentRequests: this.requests.slice(0, 20)
    };
  }

  /**
   * Get provider breakdown by type
   */
  getBreakdownByType() {
    const breakdown = {
      text: { emergent: 0, atlas: 0, mock: 0 },
      image: { emergent: 0, atlas: 0, mock: 0 },
      video: { emergent: 0, atlas: 0, mock: 0 },
      audio: { emergent: 0, atlas: 0, mock: 0 },
      music: { emergent: 0, atlas: 0, mock: 0 }
    };

    this.requests.forEach(req => {
      let providerKey = 'mock';
      if (req.source === 'emergent-primary') providerKey = 'emergent';
      else if (req.source === 'atlas-backup' || req.source === 'atlas-primary') providerKey = 'atlas';

      if (breakdown[req.type]) {
        breakdown[req.type][providerKey]++;
      }
    });

    return breakdown;
  }

  /**
   * Reset statistics
   */
  reset() {
    this.requests = [];
    this.stats = {
      emergent: { requests: 0, cost: 0, tokens: 0, success: 0, failed: 0 },
      atlas: { requests: 0, cost: 0, tokens: 0, success: 0, failed: 0 },
      mock: { requests: 0, cost: 0, tokens: 0, success: 0, failed: 0 }
    };
  }
}

export default new ProviderUsageTracker();
