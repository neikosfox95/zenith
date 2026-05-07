/**
 * AI API ROUTES
 * Endpoints for all AI operations across 43 screens
 */

import express from 'express';
import aiOrchestrator from '../services/ai/orchestrator.js';
import modelRouter from '../services/ai/modelRouter.js';

const router = express.Router();

/**
 * POST /api/ai/generate
 * Universal text generation endpoint
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, taskType = 'text', complexity = 'medium', options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Route to optimal model
    const model = modelRouter.route(taskType, complexity, options.context || {});

    // Generate
    const result = await aiOrchestrator.generateText(prompt, {
      model,
      ...options,
    });

    res.json({
      success: true,
      result,
      metadata: {
        model,
        taskType,
        complexity,
      },
    });
  } catch (error) {
    console.error('AI Generate Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/ensemble
 * Generate using multiple models and select best
 */
router.post('/ensemble', async (req, res) => {
  try {
    const { prompt, taskType = 'text', options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiOrchestrator.generateText(prompt, {
      ensemble: true,
      ...options,
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('AI Ensemble Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/image
 * Generate images
 */
router.post('/image', async (req, res) => {
  try {
    const { prompt, model = 'dall-e-4-ultra', size = '1024x1024', quality = 'hd' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiOrchestrator.generateImage(prompt, { model, size, quality });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('AI Image Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/models
 * List available models
 */
router.get('/models', (req, res) => {
  res.json({
    success: true,
    models: {
      text: [
        { id: 'gpt-5.5-pro', provider: 'openai', description: 'Best overall' },
        { id: 'claude-opus-4.7', provider: 'anthropic', description: 'Best reasoning' },
        { id: 'gemini-3.1-ultra', provider: 'google', description: 'Best multimodal' },
        { id: 'grok-4.3', provider: 'xai', description: '1M context' },
        { id: 'muse-spark', provider: 'meta', description: 'Multi-agent' },
      ],
      code: [
        { id: 'gpt-5.3-codex', provider: 'openai', description: 'Best balanced' },
        { id: 'deepseek-v4-pro', provider: 'deepseek', description: 'Best coding' },
        { id: 'claude-opus-4.7', provider: 'anthropic', description: 'Large context' },
      ],
      image: [
        { id: 'dall-e-4-ultra', provider: 'openai', description: 'Fast, high quality' },
        { id: 'midjourney-v7', provider: 'midjourney', description: 'Artistic' },
        { id: 'flux-2-pro', provider: 'blackforest', description: 'Photorealistic' },
      ],
      video: [
        { id: 'happyhorse-1.0', provider: 'alibaba', description: '#1 ranked, audio sync' },
        { id: 'veo-3', provider: 'google', description: '4K, best physics' },
        { id: 'hailuo-2.3', provider: 'minimax', description: 'Cinematic' },
      ],
    },
  });
});

/**
 * GET /api/ai/usage
 * Get AI usage stats
 */
router.get('/usage', async (req, res) => {
  try {
    // Get today's usage from Redis
    const costs = await redis.hgetall('ai:costs:daily');
    const tokens = await redis.hgetall('ai:tokens:daily');

    res.json({
      success: true,
      usage: {
        costs,
        tokens,
      },
    });
  } catch (error) {
    console.error('AI Usage Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
