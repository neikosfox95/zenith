/**
 * SMART MODEL ROUTER
 * Routes requests to optimal model based on task type, complexity, and context
 */

class ModelRouter {
  /**
   * Select optimal model for task
   */
  route(taskType, complexity = 'medium', context = {}) {
    const routingTable = {
      // TEXT GENERATION
      text: {
        low: 'gemini-3.1-pro',           // Fast
        medium: 'gpt-5.5-instant',        // Balanced
        high: 'gpt-5.5-pro',              // Best overall
        ultra: 'claude-opus-4.7',         // Deep reasoning
      },

      // CODE GENERATION
      code: {
        low: 'gemini-3.1-pro',
        medium: 'gpt-5.2-codex',
        high: 'gpt-5.3-codex',
        ultra: 'deepseek-v4-pro',         // Best coding
      },

      // REASONING & ANALYSIS
      reasoning: {
        low: 'gemini-3.1-pro',
        medium: 'gpt-5.5-pro',
        high: 'claude-opus-4.7',
        ultra: 'gemini-3.1-deep-think',   // Advanced reasoning
      },

      // MULTI-AGENT PLANNING
      planning: {
        low: 'gpt-5.5-instant',
        medium: 'muse-spark-thinking',
        high: 'muse-spark-contemplating',  // Multi-agent
        ultra: 'grok-4-heavy',            // 16 agents
      },

      // IMAGE GENERATION
      image: {
        low: 'dall-e-4-ultra',
        medium: 'dall-e-4-ultra',
        high: 'midjourney-v7',            // Artistic
        ultra: 'flux-2-pro',              // Photorealistic
      },

      // VIDEO GENERATION
      video: {
        low: 'grok-imagine-video',
        medium: 'hailuo-2.3',             // Cinematic
        high: 'happyhorse-1.0',           // #1 ranked, audio sync
        ultra: 'veo-3',                   // 4K, best physics
      },

      // VOICE/AUDIO
      voice: {
        low: 'elevenlabs-flash-v2.5',    // 75ms latency
        medium: 'elevenlabs-eleven-v3',   // Best quality
        high: 'grok-tts',                 // 5 voices
        ultra: 'grok-voice-think-fast',   // Real-time agent
      },

      // MODERATION
      moderation: {
        low: 'llama-4-maverick',          // Fast, open-source
        medium: 'claude-opus-4.7',        // Best context
        high: 'claude-opus-4.7',
        ultra: 'claude-opus-4.7',         // Complex context
      },

      // MULTILINGUAL
      multilingual: {
        low: 'gemini-3.1-pro',
        medium: 'qwen-3.5',               // 119 languages
        high: 'qwen-3.5',
        ultra: 'qwen-3.5 + doubao-2.0',   // Ensemble
      },

      // FINANCIAL ANALYSIS
      financial: {
        low: 'gpt-5.5-instant',
        medium: 'claude-opus-4.7',
        high: 'claude-opus-4.7',
        ultra: 'claude-opus-4.7',         // Best financial reasoning
      },

      // SEARCH & RESEARCH
      search: {
        low: 'gemini-3.1-pro',
        medium: 'grok-4.3',               // 1M context + X search
        high: 'grok-4.3 + perplexity',    // Real-time web
        ultra: 'grok-4.3 + perplexity',
      },
    };

    // Context-based routing
    if (context.requiresMultilingual) {
      return routingTable.multilingual[complexity];
    }

    if (context.requiresRealtime) {
      return 'grok-4.3'; // Real-time X/web search
    }

    if (context.requiresLongContext) {
      return 'claude-opus-4.7'; // 1M+ context
    }

    if (context.requiresSpeed) {
      return 'gemini-3.1-pro'; // Fastest
    }

    if (context.requiresCostOptimization) {
      return 'deepseek-v4-pro'; // Cheapest per token
    }

    // Default routing
    return routingTable[taskType]?.[complexity] || 'gpt-5.5-pro';
  }

  /**
   * Get ensemble models for critical tasks
   */
  getEnsemble(taskType) {
    const ensembles = {
      text: ['gpt-5.5-pro', 'claude-opus-4.7', 'gemini-3.1-ultra'],
      code: ['gpt-5.3-codex', 'deepseek-v4-pro', 'claude-opus-4.7'],
      reasoning: ['claude-opus-4.7', 'gemini-3.1-deep-think', 'gpt-5.5-pro'],
      image: ['dall-e-4-ultra', 'midjourney-v7', 'flux-2-pro'],
      video: ['happyhorse-1.0', 'veo-3', 'hailuo-2.3'],
    };

    return ensembles[taskType] || ['gpt-5.5-pro', 'claude-opus-4.7', 'gemini-3.1-pro'];
  }

  /**
   * Get fallback models if primary fails
   */
  getFallbacks(primary) {
    const fallbacks = {
      'gpt-5.5-pro': ['claude-opus-4.7', 'gemini-3.1-ultra'],
      'claude-opus-4.7': ['gpt-5.5-pro', 'gemini-3.1-ultra'],
      'gemini-3.1-ultra': ['gpt-5.5-pro', 'claude-opus-4.7'],
      'happyhorse-1.0': ['veo-3', 'hailuo-2.3'],
      'grok-4.3': ['gpt-5.5-pro', 'claude-opus-4.7'],
    };

    return fallbacks[primary] || ['gpt-5.5-pro', 'claude-opus-4.7'];
  }
}

export default new ModelRouter();
