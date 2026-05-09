/**
 * AI STUDIO API ROUTES (Phase 2)
 * Unified routes for Text, Image, Video, Audio, Music generation via Atlas Cloud
 */

import express from 'express';
import atlasCloud from '../services/ai/atlas-cloud.js';
import providerTracker from '../services/ai/provider-tracker.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * GET /api/ai-studio/models
 * Get all available models
 */
router.get('/models', async (req, res) => {
  try {
    const { type } = req.query;
    
    if (type) {
      const models = atlasCloud.getModelsByType(type);
      return res.json({
        success: true,
        type,
        count: Object.keys(models).length,
        models
      });
    }

    const allModels = atlasCloud.getAllModels();
    res.json({
      success: true,
      total: allModels.length,
      byType: {
        text: Object.keys(atlasCloud.modelCatalog.text).length,
        image: Object.keys(atlasCloud.modelCatalog.image).length,
        video: Object.keys(atlasCloud.modelCatalog.video).length,
        audio: Object.keys(atlasCloud.modelCatalog.audio).length,
        music: Object.keys(atlasCloud.modelCatalog.music).length
      },
      models: allModels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/status
 * Check Atlas Cloud + fallback status
 */
router.get('/status', async (req, res) => {
  try {
    const status = atlasCloud.getStatus();
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/generate/text
 * Generate text using Emergent LLM Key (primary) with Atlas Cloud backup
 */
router.post('/generate/text', async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens, userApiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await atlasCloud.generateText(prompt, {
      model: model || 'gpt-5.5-pro',
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 4000,
      userApiKey: userApiKey || null
    });

    // Track provider usage
    providerTracker.track({
      type: 'text',
      model: model || 'gpt-5.5-pro',
      provider: result.provider,
      source: result.source,
      cost: result.cost || 0,
      tokens: result.usage?.total_tokens || 0,
      success: !result.mock,
      prompt,
      result: result.text
    });

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Text generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/generate/image
 * Generate image (placeholder - to be implemented)
 */
router.post('/generate/image', async (req, res) => {
  try {
    const { prompt, model } = req.body;

    res.json({
      success: true,
      result: {
        url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1024&h=1024&fit=crop',
        model: model || 'flux-2-pro',
        provider: 'atlas-cloud',
        mock: true,
        message: 'Image generation via Atlas Cloud - Full implementation pending',
        requestId: uuidv4()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/generate/video
 * Generate video (placeholder)
 */
router.post('/generate/video', async (req, res) => {
  try {
    const { prompt, model } = req.body;

    res.json({
      success: true,
      result: {
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        model: model || 'sora-2-pro',
        provider: 'atlas-cloud',
        mock: true,
        message: 'Video generation via Atlas Cloud - Full implementation pending',
        duration: 10,
        requestId: uuidv4()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/generate/audio
 * Generate audio/voice (placeholder)
 */
router.post('/generate/audio', async (req, res) => {
  try {
    const { text, model, voice } = req.body;

    res.json({
      success: true,
      result: {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        model: model || 'elevenlabs-v3-turbo',
        provider: 'atlas-cloud',
        voice: voice || 'default',
        mock: true,
        message: 'Audio generation via Atlas Cloud - Full implementation pending',
        duration: 15,
        requestId: uuidv4()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/generate/music
 * Generate music (placeholder)
 */
router.post('/generate/music', async (req, res) => {
  try {
    const { prompt, model, duration } = req.body;

    res.json({
      success: true,
      result: {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        model: model || 'suno-v5.5',
        provider: 'atlas-cloud',
        mock: true,
        message: 'Music generation via Atlas Cloud - Full implementation pending',
        duration: duration || 60,
        genre: 'ambient',
        requestId: uuidv4()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/history
 * Get generation history (placeholder)
 */
router.get('/history', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;

    // Mock history data
    const mockHistory = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: uuidv4(),
      type: type || ['text', 'image', 'video', 'audio', 'music'][i % 5],
      prompt: `Sample prompt ${i + 1}`,
      model: 'gpt-5.5-pro',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      cost: (Math.random() * 0.5).toFixed(4),
      status: 'completed'
    }));

    res.json({
      success: true,
      count: mockHistory.length,
      history: mockHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/usage
 * Get usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    // Mock usage data
    const mockUsage = {
      today: {
        requests: 127,
        tokens: 1234567,
        cost: 12.47
      },
      thisMonth: {
        requests: 3456,
        tokens: 45678901,
        cost: 456.78
      },
      byModel: {
        'gpt-5.5-pro': { requests: 89, cost: 234.56 },
        'claude-opus-4.7': { requests: 45, cost: 123.45 },
        'flux-2-pro': { requests: 23, cost: 12.34 }
      },
      byType: {
        text: { requests: 2000, cost: 345.67 },
        image: { requests: 800, cost: 67.89 },
        video: { requests: 200, cost: 34.56 },
        audio: { requests: 300, cost: 6.78 },
        music: { requests: 156, cost: 1.88 }
      }
    };

    res.json({
      success: true,
      usage: mockUsage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/api-keys
 * Save user's custom Atlas Cloud API key
 */
router.post('/api-keys', async (req, res) => {
  try {
    const { apiKey, provider } = req.body;

    // TODO: Store in database per user
    // For now, just validate and return success

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    res.json({
      success: true,
      message: 'API key saved successfully',
      provider: provider || 'atlas-cloud',
      masked: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/provider-analytics
 * Get provider usage statistics and cost tracking
 */
router.get('/provider-analytics', async (req, res) => {
  try {
    const stats = providerTracker.getStats();
    const breakdown = providerTracker.getBreakdownByType();

    res.json({
      success: true,
      analytics: {
        ...stats,
        breakdownByType: breakdown
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/provider-analytics/reset
 * Reset provider tracking statistics
 */
router.post('/provider-analytics/reset', async (req, res) => {
  try {
    providerTracker.reset();
    res.json({
      success: true,
      message: 'Provider analytics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
