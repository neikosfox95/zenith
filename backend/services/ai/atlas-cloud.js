/**
 * ATLAS CLOUD AI INTEGRATION
 * Unified API for 300+ models (Text, Image, Video, Audio)
 * Primary provider with automatic failover to direct APIs
 */

import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Atlas Cloud API Configuration
const ATLAS_API_KEY = process.env.ATLAS_CLOUD_API_KEY;
const ATLAS_BASE_URL = 'https://api.atlascloud.ai/v1';
const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;

// Initialize Atlas Cloud client (OpenAI-compatible)
let atlasClient;
let hasAtlasKey = false;

try {
  if (ATLAS_API_KEY && ATLAS_API_KEY !== 'your-atlas-cloud-api-key-here') {
    atlasClient = new OpenAI({
      apiKey: ATLAS_API_KEY,
      baseURL: ATLAS_BASE_URL,
      dangerouslyAllowBrowser: false
    });
    hasAtlasKey = true;
    console.log('✅ Atlas Cloud backup client initialized');
  } else {
    console.warn('⚠️ Atlas Cloud not configured - using Emergent LLM Key as primary');
  }
} catch (e) {
  console.warn('⚠️ Atlas Cloud initialization failed:', e.message);
}

// Initialize direct providers as fallback
let openaiDirect, googleAI;

try {
  if (EMERGENT_LLM_KEY) {
    const { OpenAI } = await import('openai');
    openaiDirect = new OpenAI({ apiKey: EMERGENT_LLM_KEY });
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    googleAI = new GoogleGenerativeAI(EMERGENT_LLM_KEY);
    
    console.log('✅ Fallback providers initialized (Emergent LLM Key)');
  }
} catch (e) {
  console.warn('⚠️ Fallback provider initialization failed:', e.message);
}

/**
 * MODEL CATALOG - 39 Models across all modalities
 */
export const MODEL_CATALOG = {
  // TEXT GENERATION (7 models)
  text: {
    'gpt-5.5-pro': {
      atlasId: 'openai/gpt-4-turbo',
      provider: 'openai',
      contextWindow: 270000,
      pricing: { input: 30, output: 180 },
      logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop',
      color: '#10B981'
    },
    'gpt-5.4': {
      atlasId: 'openai/gpt-4',
      provider: 'openai',
      contextWindow: 272000,
      pricing: { input: 2.5, output: 15 },
      logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop',
      color: '#10B981'
    },
    'claude-opus-4.7': {
      atlasId: 'anthropic/claude-3-opus-20240229',
      provider: 'anthropic',
      contextWindow: 1000000,
      pricing: { input: 5, output: 25 },
      logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=64&h=64&fit=crop',
      color: '#FF7A45'
    },
    'gemini-3.0-pro': {
      atlasId: 'google/gemini-1.5-pro-latest',
      provider: 'google',
      contextWindow: 1000000,
      pricing: { input: 2, output: 12 },
      logo: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=64&h=64&fit=crop',
      color: '#A855F7'
    },
    'gemini-2.0-flash': {
      atlasId: 'google/gemini-1.5-flash-latest',
      provider: 'google',
      contextWindow: 1000000,
      pricing: { input: 0.1, output: 0.4 },
      logo: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=64&h=64&fit=crop',
      color: '#A855F7'
    },
    'deepseek-v3': {
      atlasId: 'deepseek-ai/DeepSeek-V3-0324',
      provider: 'deepseek',
      contextWindow: 128000,
      pricing: { input: 0.27, output: 1.1 },
      logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=64&h=64&fit=crop',
      color: '#3B82F6'
    },
    'qwen-3-32b': {
      atlasId: 'qwen/qwen3-32b',
      provider: 'alibaba',
      contextWindow: 32000,
      pricing: { input: 0.12, output: 0.12 },
      logo: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=64&h=64&fit=crop',
      color: '#EF4444'
    }
  },
  
  // IMAGE GENERATION (10 models)
  image: {
    'dall-e-3': {
      atlasId: 'openai/dall-e-3',
      provider: 'openai',
      pricing: { perImage: 0.04 },
      logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop',
      color: '#10B981'
    },
    'flux-2-pro': {
      atlasId: 'flux/flux-pro',
      provider: 'blackforest',
      pricing: { perImage: 0.055 },
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop',
      color: '#8B5CF6'
    },
    'flux-2-schnell': {
      atlasId: 'flux/flux-schnell',
      provider: 'blackforest',
      pricing: { perImage: 0.003 },
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop',
      color: '#8B5CF6'
    },
    'stable-diffusion-xl': {
      atlasId: 'stability-ai/sdxl',
      provider: 'stability',
      pricing: { perImage: 0.01 },
      logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=64&h=64&fit=crop',
      color: '#06B6D4'
    },
    'stable-diffusion-3.5': {
      atlasId: 'stability-ai/sd3.5',
      provider: 'stability',
      pricing: { perImage: 0.035 },
      logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=64&h=64&fit=crop',
      color: '#06B6D4'
    },
    'midjourney-v7': {
      atlasId: 'midjourney/v7',
      provider: 'midjourney',
      pricing: { subscription: 30 },
      logo: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=64&h=64&fit=crop',
      color: '#3B82F6'
    },
    'nano-banana': {
      atlasId: 'google/imagen-3',
      provider: 'google',
      pricing: { perImage: 0.04 },
      logo: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=64&h=64&fit=crop',
      color: '#A855F7'
    },
    'recraft-v3': {
      atlasId: 'recraft/v3',
      provider: 'recraft',
      pricing: { perImage: 0.02 },
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop',
      color: '#F59E0B'
    },
    'ideogram-v2': {
      atlasId: 'ideogram/v2',
      provider: 'ideogram',
      pricing: { perImage: 0.08 },
      logo: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=64&h=64&fit=crop',
      color: '#EC4899'
    },
    'playground-v3': {
      atlasId: 'playground/v3',
      provider: 'playground',
      pricing: { perImage: 0.02 },
      logo: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=64&h=64&fit=crop',
      color: '#14B8A6'
    }
  },
  
  // VIDEO GENERATION (12 models)
  video: {
    'sora-2-pro': {
      atlasId: 'openai/sora-pro',
      provider: 'openai',
      pricing: { perSecond: 0.30 },
      logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop',
      color: '#10B981'
    },
    'sora-2': {
      atlasId: 'openai/sora',
      provider: 'openai',
      pricing: { perSecond: 0.10 },
      logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop',
      color: '#10B981'
    },
    'runway-gen-4.5': {
      atlasId: 'runway/gen-4.5',
      provider: 'runway',
      pricing: { perSecond: 0.25 },
      logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=64&h=64&fit=crop',
      color: '#8B5CF6'
    },
    'runway-gen-3-turbo': {
      atlasId: 'runway/gen-3-alpha-turbo',
      provider: 'runway',
      pricing: { perSecond: 0.15 },
      logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=64&h=64&fit=crop',
      color: '#8B5CF6'
    },
    'kling-3.0-pro': {
      atlasId: 'kling/v3-pro',
      provider: 'kling',
      pricing: { perSecond: 0.07 },
      logo: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=64&h=64&fit=crop',
      color: '#F59E0B'
    },
    'kling-3.0-std': {
      atlasId: 'kling/v3-standard',
      provider: 'kling',
      pricing: { perSecond: 0.05 },
      logo: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=64&h=64&fit=crop',
      color: '#F59E0B'
    },
    'pika-2.0': {
      atlasId: 'pika/v2',
      provider: 'pika',
      pricing: { perSecond: 0.20 },
      logo: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=64&h=64&fit=crop',
      color: '#EC4899'
    },
    'luma-dream-machine': {
      atlasId: 'luma/dream-machine',
      provider: 'luma',
      pricing: { perSecond: 0.12 },
      logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=64&h=64&fit=crop',
      color: '#06B6D4'
    },
    'seedance-2.0': {
      atlasId: 'bytedance/seedance-2',
      provider: 'bytedance',
      pricing: { perSecond: 0.08 },
      logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=64&h=64&fit=crop',
      color: '#EF4444'
    },
    'vidu-ai': {
      atlasId: 'vidu/v1',
      provider: 'vidu',
      pricing: { perSecond: 0.06 },
      logo: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=64&h=64&fit=crop',
      color: '#14B8A6'
    },
    'haiper-2.0': {
      atlasId: 'haiper/v2',
      provider: 'haiper',
      pricing: { perSecond: 0.09 },
      logo: 'https://images.unsplash.com/photo-1519810755548-39cd217da494?w=64&h=64&fit=crop',
      color: '#A855F7'
    },
    'morph-studio': {
      atlasId: 'morph/v1',
      provider: 'morph',
      pricing: { perSecond: 0.11 },
      logo: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=64&h=64&fit=crop',
      color: '#10B981'
    }
  },
  
  // AUDIO/VOICE (5 models)
  audio: {
    'elevenlabs-v3-turbo': {
      atlasId: 'elevenlabs/turbo-v3',
      provider: 'elevenlabs',
      pricing: { per1kChars: 0.22 },
      logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=64&h=64&fit=crop',
      color: '#7C3AED'
    },
    'elevenlabs-v2.5': {
      atlasId: 'elevenlabs/v2.5',
      provider: 'elevenlabs',
      pricing: { per1kChars: 0.11 },
      logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=64&h=64&fit=crop',
      color: '#7C3AED'
    },
    'gemini-3.1-flash-tts': {
      atlasId: 'google/gemini-tts',
      provider: 'google',
      pricing: { per1kChars: 0.05 },
      logo: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=64&h=64&fit=crop',
      color: '#A855F7'
    },
    'playht-dialog': {
      atlasId: 'playht/dialog',
      provider: 'playht',
      pricing: { per1kWords: 0.0975 },
      logo: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=64&h=64&fit=crop',
      color: '#3B82F6'
    },
    'playht-standard': {
      atlasId: 'playht/standard',
      provider: 'playht',
      pricing: { per1kWords: 0.19 },
      logo: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=64&h=64&fit=crop',
      color: '#3B82F6'
    }
  },
  
  // MUSIC (5 models)
  music: {
    'suno-v5.5': {
      atlasId: 'suno/v5.5',
      provider: 'suno',
      pricing: { perSong: 0.015 },
      logo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=64&h=64&fit=crop',
      color: '#EC4899'
    },
    'suno-v4.5': {
      atlasId: 'suno/v4.5',
      provider: 'suno',
      pricing: { perSong: 0.02 },
      logo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=64&h=64&fit=crop',
      color: '#EC4899'
    },
    'udio-pro': {
      atlasId: 'udio/pro',
      provider: 'udio',
      pricing: { perSong: 0.005 },
      logo: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=64&h=64&fit=crop',
      color: '#F59E0B'
    },
    'udio-standard': {
      atlasId: 'udio/standard',
      provider: 'udio',
      pricing: { perSong: 0.00417 },
      logo: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=64&h=64&fit=crop',
      color: '#F59E0B'
    },
    'musicgen': {
      atlasId: 'meta/musicgen',
      provider: 'meta',
      pricing: { perMinute: 0.80 },
      logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=64&h=64&fit=crop',
      color: '#0084FF'
    }
  }
};

/**
 * ATLAS CLOUD SERVICE
 */
class AtlasCloudService {
  constructor() {
    this.hasAtlas = hasAtlasKey;
    this.modelCatalog = MODEL_CATALOG;
  }

  /**
   * Generate Text using Emergent LLM Key (primary) with Atlas Cloud backup
   */
  async generateText(prompt, options = {}) {
    const {
      model = 'gpt-5.5-pro',
      temperature = 0.7,
      maxTokens = 4000,
      userApiKey = null
    } = options;

    const modelConfig = this.modelCatalog.text[model];
    if (!modelConfig) {
      throw new Error(`Unknown text model: ${model}`);
    }

    // PRIMARY: Try Emergent LLM Key first (direct provider APIs)
    if (openaiDirect || googleAI) {
      const directResult = await this.tryDirectProviders(model, prompt, temperature, maxTokens, modelConfig);
      if (directResult && !directResult.failed) {
        return directResult;
      }
      console.warn(`Direct provider failed for ${model}, trying Atlas Cloud backup...`);
    }

    // BACKUP: Try Atlas Cloud if direct providers fail
    if (this.hasAtlas || userApiKey) {
      try {
        const client = userApiKey ? new OpenAI({
          apiKey: userApiKey,
          baseURL: ATLAS_BASE_URL
        }) : atlasClient;

        const response = await client.chat.completions.create({
          model: modelConfig.atlasId,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        });

        return {
          text: response.choices[0].message.content,
          model: modelConfig.atlasId,
          provider: 'atlas-cloud-backup',
          usage: response.usage,
          cost: this.calculateTextCost(model, response.usage),
          requestId: uuidv4(),
          source: 'atlas-backup'
        };
      } catch (error) {
        console.warn(`Atlas Cloud backup failed for ${model}:`, error.message);
      }
    }

    // FINAL FALLBACK: Mock mode
    return this.mockResponse(model, prompt);
  }

  /**
   * Try direct provider APIs (Emergent LLM Key)
   */
  async tryDirectProviders(model, prompt, temperature, maxTokens, modelConfig) {
    // Try OpenAI direct for OpenAI/Anthropic models
    if ((modelConfig.provider === 'openai' || modelConfig.provider === 'anthropic') && openaiDirect) {
      try {
        const response = await openaiDirect.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        });

        return {
          text: response.choices[0].message.content,
          model: 'gpt-4-turbo-preview',
          provider: 'openai-emergent',
          usage: response.usage,
          cost: this.calculateTextCost(model, response.usage),
          requestId: uuidv4(),
          source: 'emergent-primary'
        };
      } catch (error) {
        console.warn('OpenAI Emergent failed:', error.message);
        return { failed: true };
      }
    }

    // Try Google direct for Google models
    if (modelConfig.provider === 'google' && googleAI) {
      try {
        const geminiModel = googleAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;

        return {
          text: response.text(),
          model: 'gemini-pro',
          provider: 'google-emergent',
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          cost: 0,
          requestId: uuidv4(),
          source: 'emergent-primary'
        };
      } catch (error) {
        console.warn('Google Emergent failed:', error.message);
        return { failed: true };
      }
    }

    return { failed: true };
  }

  /**
   * Mock response when all providers fail
   */
  mockResponse(model, prompt) {
    return {
      text: `[MOCK MODE]\n\nAll providers unavailable for ${model}.\n\nPrompt: "${prompt.substring(0, 100)}..."\n\n✅ Emergent LLM Key (Primary): Not available\n⚠️ Atlas Cloud (Backup): ${this.hasAtlas ? 'API credits needed' : 'Not configured'}\n\nPlease configure API keys or add Atlas Cloud credits.`,
      model: model,
      provider: 'mock',
      mock: true,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      requestId: uuidv4(),
      source: 'mock-fallback'
    };
  }

  /**
   * Calculate text generation cost
   */
  calculateTextCost(model, usage) {
    const modelConfig = this.modelCatalog.text[model];
    if (!modelConfig || !modelConfig.pricing || !usage) return 0;

    const inputCost = (usage.prompt_tokens / 1000000) * modelConfig.pricing.input;
    const outputCost = (usage.completion_tokens / 1000000) * modelConfig.pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Get all models by type
   */
  getModelsByType(type) {
    return this.modelCatalog[type] || {};
  }

  /**
   * Get all models (flattened)
   */
  getAllModels() {
    const all = [];
    Object.keys(this.modelCatalog).forEach(type => {
      Object.keys(this.modelCatalog[type]).forEach(modelId => {
        all.push({
          id: modelId,
          type,
          ...this.modelCatalog[type][modelId]
        });
      });
    });
    return all;
  }

  /**
   * Check Atlas Cloud status
   */
  getStatus() {
    return {
      atlasCloudAvailable: this.hasAtlas,
      fallbackAvailable: !!openaiDirect || !!googleAI,
      totalModels: this.getAllModels().length,
      modelsByType: {
        text: Object.keys(this.modelCatalog.text).length,
        image: Object.keys(this.modelCatalog.image).length,
        video: Object.keys(this.modelCatalog.video).length,
        audio: Object.keys(this.modelCatalog.audio).length,
        music: Object.keys(this.modelCatalog.music).length
      }
    };
  }
}

export default new AtlasCloudService();
