// ============= PHASE 6: ADVANCED MEDIA INTELLIGENCE ROUTES =============
// Image, Voice/Audio, and Video Generation with Multiple AI Models

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to call Python AI service
async function callEnhancedAIService(method, data) {
  return new Promise((resolve, reject) => {
    const aiServicePath = join(__dirname, 'ai_service_complete.py');
    const env = { ...process.env };
    const python = spawn('/root/.venv/bin/python3', [aiServicePath], { env });
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error(`AI Service error: ${errorOutput}`));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          resolve({ result: output.trim() });
        }
      }
    });
    
    python.stdin.write(JSON.stringify({ method, data }));
    python.stdin.end();
  });
}

export function setupPhase6Routes(app, db, io, authenticateToken, ObjectId) {
  console.log('Setting up Phase 6 routes...');

  // ============= IMAGE GENERATION =============
  
  // Get available image models
  app.get('/api/media/image/models', authenticateToken, (req, res) => {
    res.json({
      models: [
        {
          id: 'gpt-image-1.5',
          name: 'GPT Image 1.5',
          provider: 'OpenAI',
          speed: '4x faster',
          quality: 'Highest',
          cost: 'Medium',
          best_for: 'Professional photography, photorealism'
        },
        {
          id: 'gpt-image-1',
          name: 'GPT Image 1',
          provider: 'OpenAI',
          speed: 'Standard',
          quality: 'High',
          cost: 'Medium',
          best_for: 'General purpose image generation'
        },
        {
          id: 'gpt-image-1-mini',
          name: 'GPT Image Mini',
          provider: 'OpenAI',
          speed: 'Fastest',
          quality: 'Good',
          cost: 'Lowest ($0.005/image)',
          best_for: 'High-volume generation, prototyping'
        },
        {
          id: 'gpt-image-2',
          name: 'GPT Image 2',
          provider: 'OpenAI',
          speed: 'Standard',
          quality: 'Advanced (LEAKED)',
          cost: 'Premium',
          best_for: 'Native 2048x2048/4K, character consistency, region-based prompting'
        },
        {
          id: 'gpt-image-2-turbo',
          name: 'GPT Image 2 Turbo',
          provider: 'OpenAI',
          speed: 'Ultra Fast (<3s)',
          quality: 'Advanced (LEAKED)',
          cost: 'Medium',
          best_for: 'Rapid 4K generation, batch editing, video frames'
        },
        {
          id: 'dall-e-3',
          name: 'DALL-E 3',
          provider: 'OpenAI',
          speed: 'Standard',
          quality: 'High',
          cost: 'Medium',
          best_for: 'Legacy support (deprecated May 2026), higher resolution'
        },
        // Microsoft MAI Image (3 variants)
        {
          id: 'mai-image-2',
          name: 'MAI Image 2',
          provider: 'Microsoft',
          speed: 'Standard',
          quality: '#3 on Arena.ai',
          cost: 'Competitive',
          best_for: 'Natural lighting, accurate skin tones, texture detail, clear in-image text'
        },
        {
          id: 'mai-image-2-pro',
          name: 'MAI Image 2 Pro',
          provider: 'Microsoft',
          speed: 'Slower',
          quality: 'Enhanced detail',
          cost: 'Premium',
          best_for: 'Professional photography, detailed scenes, commercial use'
        },
        {
          id: 'azure-gpt-image-1.5',
          name: 'Azure GPT Image 1.5',
          provider: 'Microsoft Azure',
          speed: '4x faster',
          quality: 'Highest',
          cost: 'Enterprise',
          best_for: 'Azure-hosted enterprise image generation with GPT Image 1.5'
        },
        {
          id: 'nano-banana-2',
          name: 'Nano Banana 2',
          provider: 'Google',
          speed: '1-3s per image',
          quality: 'High fidelity',
          cost: 'Low',
          best_for: 'Text rendering, world knowledge, photorealism'
        },
        {
          id: 'nano-banana-pro',
          name: 'Nano Banana Pro',
          provider: 'Google',
          speed: 'Slower',
          quality: 'Studio quality',
          cost: 'Premium',
          best_for: 'Complex editing, detail precision'
        },
        {
          id: 'grok-imagine-quality',
          name: 'Grok Imagine Quality',
          provider: 'xAI',
          speed: 'Slow',
          quality: 'Premium (4 images)',
          cost: 'Medium',
          best_for: 'Volumetric lighting, fine reflections, realistic textures'
        },
        {
          id: 'grok-imagine-speed',
          name: 'Grok Imagine Speed',
          provider: 'xAI',
          speed: 'Very Fast',
          quality: 'Good',
          cost: 'Low',
          best_for: 'Rapid iteration, testing, exploration'
        },
        // KLING 3.0 Complete Image Suite (9 models)
        {
          id: 'kling-v3',
          name: 'KLING v3',
          provider: 'KLING AI',
          speed: 'Standard',
          quality: 'High',
          cost: 'Medium',
          best_for: 'General image generation'
        },
        {
          id: 'kling-v3-omni',
          name: 'KLING v3 Omni',
          provider: 'KLING AI',
          speed: 'Standard',
          quality: 'Highest',
          cost: 'High',
          best_for: 'Multi-image combination, advanced composition'
        },
        {
          id: 'kling-image-o1',
          name: 'KLING Image O1',
          provider: 'KLING AI',
          speed: 'Slower',
          quality: 'Highest (Reasoning)',
          cost: 'Premium',
          best_for: 'Complex scenes requiring advanced reasoning'
        },
        {
          id: 'kling-omni-human',
          name: 'KLING Omni Human',
          provider: 'KLING AI',
          speed: 'Standard',
          quality: 'High',
          cost: 'Medium',
          best_for: 'Human consistency, character generation'
        },
        {
          id: 'kling-image-to-image',
          name: 'KLING Image-to-Image',
          provider: 'KLING AI',
          speed: 'Fast',
          quality: 'High',
          cost: 'Low',
          best_for: 'Reference-based generation, style transfer'
        },
        {
          id: 'kling-image-extend',
          name: 'KLING Image Extend',
          provider: 'KLING AI',
          speed: 'Fast',
          quality: 'High',
          cost: 'Low',
          best_for: 'Image expansion, outpainting'
        },
        {
          id: 'kling-multi-shot',
          name: 'KLING Multi-Shot',
          provider: 'KLING AI',
          speed: 'Standard',
          quality: 'High',
          cost: 'Medium',
          best_for: 'AI Multi-Shot storyboards (2-9 images)'
        },
        {
          id: 'kling-virtual-tryon',
          name: 'KLING Virtual Try-On',
          provider: 'KLING AI',
          speed: 'Fast',
          quality: 'High',
          cost: 'Medium',
          best_for: 'Virtual clothing try-on'
        },
        {
          id: 'kling-4k',
          name: 'KLING 4K',
          provider: 'KLING AI',
          speed: 'Slow',
          quality: 'Ultra HD (4K)',
          cost: 'High',
          best_for: 'Ultra high definition, professional use'
        },
        // ByteDance Seedream Complete Suite (5 models)
        {
          id: 'seedream-3.0',
          name: 'Seedream 3.0',
          provider: 'ByteDance',
          speed: 'Standard',
          quality: 'Foundational',
          cost: 'Low',
          best_for: 'Basic image generation'
        },
        {
          id: 'seedream-4.0',
          name: 'Seedream 4.0',
          provider: 'ByteDance',
          speed: 'Ultra Fast (1.4s)',
          quality: '2K',
          cost: 'Medium',
          best_for: 'Efficient DiT architecture, rapid 2K generation'
        },
        {
          id: 'seedream-4.5',
          name: 'Seedream 4.5',
          provider: 'ByteDance',
          speed: 'Standard',
          quality: '4K',
          cost: 'High',
          best_for: 'Text rendering, multi-image consistency, professional composition'
        },
        {
          id: 'seedream-5.0-lite',
          name: 'Seedream 5.0 Lite',
          provider: 'ByteDance',
          speed: 'Fast',
          quality: 'Multimodal',
          cost: 'Medium',
          best_for: 'Deep thinking, multimodal generation'
        },
        {
          id: 'seedream-5.0',
          name: 'Seedream 5.0',
          provider: 'ByteDance',
          speed: 'Standard',
          quality: 'Advanced',
          cost: 'Premium',
          best_for: 'Real-time web search integration, contextually accurate current events'
        },
        // Midjourney (4 variants)
        {
          id: 'midjourney-v7',
          name: 'Midjourney v7',
          provider: 'Midjourney',
          speed: 'Standard',
          quality: 'Artistic',
          cost: 'Medium',
          best_for: 'Artistic composition, aesthetic images'
        },
        {
          id: 'midjourney-v8',
          name: 'Midjourney v8',
          provider: 'Midjourney',
          speed: 'Standard',
          quality: 'Advanced Artistic',
          cost: 'Premium',
          best_for: 'Latest artistic quality, photorealism + artistic style'
        },
        {
          id: 'midjourney-niji-6',
          name: 'Midjourney Niji 6',
          provider: 'Midjourney',
          speed: 'Fast',
          quality: 'Anime/Manga Style',
          cost: 'Medium',
          best_for: 'Anime and manga style images'
        },
        {
          id: 'midjourney-personalized',
          name: 'Midjourney Personalized',
          provider: 'Midjourney',
          speed: 'Standard',
          quality: 'Custom Style',
          cost: 'Premium',
          best_for: 'Personalized style learning, consistent aesthetics'
        }
      ],
      default: 'nano-banana-2',
      resolutions: ['512x512', '1024x1024', '1024x1792', '1792x1024', '2048x2048', '4096x4096'],
      aspect_ratios: ['1:1', '4:3', '16:9', '9:16', '4:1', '1:8']
    });
  });

  // Generate images
  app.post('/api/media/image/generate', authenticateToken, async (req, res) => {
    try {
      const { prompt, model = 'nano-banana-2', size = '1024x1024', num_images = 1, quality = 'standard' } = req.body;
      
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      const result = await callEnhancedAIService('generate_image', {
        prompt,
        model,
        size,
        num_images,
        quality
      });
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      
      res.json({
        ...result,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ error: 'Failed to generate images' });
    }
  });

  // ============= VOICE/AUDIO PROCESSING =============
  
  // Get available voice/audio models
  app.get('/api/media/audio/models', authenticateToken, (req, res) => {
    res.json({
      models: [
        {
          id: 'whisper',
          name: 'Whisper (GPT-4o Transcribe)',
          provider: 'OpenAI',
          features: ['Transcription', 'Translation', '50+ languages'],
          best_for: 'General transcription'
        },
        {
          id: 'gemini-audio',
          name: 'Gemini Audio API',
          provider: 'Google',
          features: ['Transcription', 'Audio analysis'],
          best_for: 'Multimodal audio tasks'
        },
        {
          id: 'fish-audio-instant',
          name: 'Fish Audio Instant',
          provider: 'Fish Audio',
          features: ['Voice cloning', '10s sample', '<30s processing', '8 languages'],
          best_for: 'Quick voice cloning, prototyping'
        },
        {
          id: 'fish-audio-hq',
          name: 'Fish Audio HQ',
          provider: 'Fish Audio',
          features: ['Voice cloning', '1-3min sample', '5min processing', 'Better prosody'],
          best_for: 'Podcast quality, audiobooks'
        },
        {
          id: 'voicebox-2.0',
          name: 'VoiceBox 2.0',
          provider: 'Meta',
          features: ['Voice cloning', '50+ languages', '2.5x faster', 'Emotion control'],
          best_for: 'Multilingual voice generation'
        }
      ],
      default: 'whisper',
      supported_formats: ['mp3', 'wav', 'm4a', 'ogg', 'flac'],
      max_file_size: '25MB'
    });
  });

  // Transcribe audio
  app.post('/api/media/audio/transcribe', authenticateToken, async (req, res) => {
    try {
      const { audio_file, model = 'whisper', language = 'en' } = req.body;
      
      const result = await callEnhancedAIService('transcribe_audio', {
        audio_file,
        model,
        language
      });
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      
      res.json({
        ...result,
        transcribed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  });

  // Clone voice
  app.post('/api/media/audio/clone-voice', authenticateToken, async (req, res) => {
    try {
      const { audio_sample, text, model = 'fish-audio-instant', emotion = 'neutral' } = req.body;
      
      const result = await callEnhancedAIService('clone_voice', {
        audio_sample,
        text,
        model,
        emotion
      });
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      
      res.json({
        ...result,
        cloned_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Voice cloning error:', error);
      res.status(500).json({ error: 'Failed to clone voice' });
    }
  });

  // ============= VIDEO GENERATION =============
  
  // Get available video models
  app.get('/api/media/video/models', authenticateToken, (req, res) => {
    res.json({
      models: [
        {
          id: 'sora-2-pro',
          name: 'Sora 2 Pro',
          provider: 'OpenAI',
          max_duration: '60s',
          resolutions: ['720p', '1080p'],
          features: ['Text-to-video', 'High quality'],
          best_for: 'Long-form video generation'
        },
        {
          id: 'veo-3.1',
        },
        // Microsoft Copilot Video (2 variants)
        {
          id: 'microsoft-sora-2-copilot',
          name: 'Microsoft 365 Copilot Sora 2',
          provider: 'Microsoft',
          max_duration: '12s',
          resolutions: ['720p'],
          features: ['Synchronized audio', 'Enterprise integration', 'M365 Copilot Create', 'OneDrive/SharePoint storage'],
          best_for: 'Enterprise video generation with Microsoft 365 integration'
        },
        {
          id: 'azure-sora-2-enhanced',
          name: 'Azure Sora 2 Enhanced',
          provider: 'Microsoft Azure',
          max_duration: '15s',
          resolutions: ['720p', '1080p'],
          features: ['Enhanced fidelity', 'Azure AI Foundry', 'Enterprise security', 'Compliance features'],
          best_for: 'Azure-hosted video generation with enhanced quality'
        },
        {
          id: 'veo-3.1',
          name: 'Veo 3.1',
          provider: 'Google',
          max_duration: '8s',
          resolutions: ['720p', '1080p', '4K'],
          features: ['Highest fidelity', 'Native audio', 'Cinematic controls', 'Reference images'],
          best_for: 'Premium quality, production use'
        },
        {
          id: 'veo-3.1-fast',
          name: 'Veo 3.1 Fast',
          provider: 'Google',
          max_duration: '8s',
          resolutions: ['720p', '1080p', '4K'],
          features: ['Faster generation', 'Native audio'],
          best_for: 'Quick turnaround, testing'
        },
        {
          id: 'veo-3.1-lite',
          name: 'Veo 3.1 Lite',
          provider: 'Google',
          max_duration: '8s',
          resolutions: ['720p', '1080p'],
          features: ['Cost-effective (<50% price)', 'High volume'],
          best_for: 'Scale, high-volume apps'
        },
        {
          id: 'grok-imagine-video-quality',
          name: 'Grok Video Quality',
          provider: 'xAI',
          max_duration: '10-15s',
          resolutions: ['480p', '720p'],
          features: ['Quality mode', 'Native audio', 'Camera controls'],
          best_for: 'High-fidelity short clips'
        },
        {
          id: 'grok-imagine-video-speed',
          name: 'Grok Video Speed',
          provider: 'xAI',
          max_duration: '10-15s',
          resolutions: ['480p', '720p'],
          features: ['Fast generation', 'Native audio'],
          best_for: 'Rapid iteration, exploration'
        },
        // KLING 3.0 Complete Video Suite (15 models)
        {
          id: 'kling-v3',
          name: 'KLING v3',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['720p', '1080p', '4K'],
          features: ['Text-to-video', 'Standard quality'],
          best_for: 'General video generation'
        },
        {
          id: 'kling-v2-6',
          name: 'KLING v2.6',
          provider: 'KLING AI',
          max_duration: '10s',
          resolutions: ['720p', '1080p'],
          features: ['Previous gen', 'Stable'],
          best_for: 'Legacy compatibility'
        },
        {
          id: 'kling-v3-omni',
          name: 'KLING v3 Omni',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Multi-image to video', 'Omni Skills', 'Multilingual audio'],
          best_for: 'Complex multi-shot videos'
        },
        {
          id: 'kling-video-o1',
          name: 'KLING Video O1',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Advanced reasoning', 'Complex scenes', 'Narrative control'],
          best_for: 'Story-driven content'
        },
        {
          id: 'kling-omni-human',
          name: 'KLING Omni Human',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Human consistency', 'Lip-sync', 'Multi-person'],
          best_for: 'Character-focused videos'
        },
        {
          id: 'kling-text-to-video',
          name: 'KLING Text-to-Video',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['1080p', '4K'],
          features: ['Text input', 'Standard generation'],
          best_for: 'Simple prompt-based videos'
        },
        {
          id: 'kling-image-to-video',
          name: 'KLING Image-to-Video',
          provider: 'KLING AI',
          max_duration: '10s',
          resolutions: ['1080p', '4K'],
          features: ['Single image animation', 'Camera movement'],
          best_for: 'Animating still images'
        },
        {
          id: 'kling-multi-image-to-video',
          name: 'KLING Reference Video',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Multi-image reference', 'Shot transitions'],
          best_for: 'Reference-based storytelling'
        },
        {
          id: 'kling-motion-control',
          name: 'KLING Motion Sync',
          provider: 'KLING AI',
          max_duration: '10s',
          resolutions: ['4K'],
          features: ['Motion control', 'Camera movement', 'Precise animation'],
          best_for: 'Controlled camera and object motion'
        },
        {
          id: 'kling-multi-elements',
          name: 'KLING Multi-Elements',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Character + scene elements', 'Complex composition'],
          best_for: 'Multi-element scene composition'
        },
        {
          id: 'kling-video-extend',
          name: 'KLING Video Extend',
          provider: 'KLING AI',
          max_duration: '30s',
          resolutions: ['1080p', '4K'],
          features: ['Video extension', 'Seamless continuation'],
          best_for: 'Extending existing videos'
        },
        {
          id: 'kling-lip-sync',
          name: 'KLING Lip Sync',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Audio-video sync', 'Facial animation', 'Natural speech'],
          best_for: 'Talking head videos with accurate lip sync'
        },
        {
          id: 'kling-avatar',
          name: 'KLING Avatar',
          provider: 'KLING AI',
          max_duration: '10s',
          resolutions: ['1080p', '4K'],
          features: ['Digital human', 'Consistent character', 'AI presenter'],
          best_for: 'Virtual avatar generation'
        },
        {
          id: 'kling-video-effects',
          name: 'KLING Video Effects',
          provider: 'KLING AI',
          max_duration: '15s',
          resolutions: ['4K'],
          features: ['Effect templates', 'Visual enhancements', 'Post-processing'],
          best_for: 'Applying visual effects to videos'
        },
        {
          id: 'kling-image-recognize',
          name: 'KLING Image Recognize',
          provider: 'KLING AI',
          max_duration: 'N/A',
          resolutions: ['N/A'],
          features: ['Image analysis', 'Scene understanding', 'Metadata extraction'],
          best_for: 'Image recognition and analysis'
        },
        // ByteDance Seedance Complete Suite (3 models)
        {
          id: 'seedance-1.0',
          name: 'Seedance 1.0',
          provider: 'ByteDance',
          max_duration: '15s',
          resolutions: ['1080p'],
          features: ['Multi-shot generation', 'Text & image input', 'Cinematic aesthetics'],
          best_for: 'Multi-shot video storytelling'
        },
        {
          id: 'seedance-1.5-pro',
          name: 'Seedance 1.5 Pro',
          provider: 'ByteDance',
          max_duration: '15s',
          resolutions: ['1080p'],
          features: ['Native audio-video', 'Lip-sync', 'Emotion alignment', 'Film-grade cinematography'],
          best_for: 'Professional filmmaking with synchronized audio'
        },
        {
          id: 'seedance-2.0',
          name: 'Seedance 2.0',
          provider: 'ByteDance',
          max_duration: '15s',
          resolutions: ['2K'],
          features: ['Multimodal (text/image/audio/video)', '12 file inputs', 'Dual-channel audio', 'Video editing', 'Character replacement'],
          best_for: 'Advanced multimodal video generation with complex inputs'
        }
      ],
      default: 'veo-3.1-fast',
      aspect_ratios: ['16:9', '9:16', '1:1', '4:3'],
      frame_rates: ['24fps', '30fps']
    });
  });

  // Generate video
  app.post('/api/media/video/generate', authenticateToken, async (req, res) => {
    try {
      const { prompt, model = 'veo-3.1-fast', duration = 8, resolution = '720p', aspect_ratio = '16:9' } = req.body;
      
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      const result = await callEnhancedAIService('generate_video', {
        prompt,
        model,
        duration,
        resolution,
        aspect_ratio
      });
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }
      
      res.json({
        ...result,
        initiated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Video generation error:', error);
      res.status(500).json({ error: 'Failed to generate video' });
    }
  });

  // Get video status
  app.get('/api/media/video/status/:jobId', authenticateToken, async (req, res) => {
    try {
      const { jobId } = req.params;
      
      // Simulate status check (would actually query job status)
      res.json({
        job_id: jobId,
        status: 'completed',  // queued, processing, completed, failed
        progress: 100,
        url: `https://example.com/videos/${jobId}.mp4`,
        estimated_time_remaining: 0
      });
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ error: 'Failed to check video status' });
    }
  });

  console.log('✅ Phase 6 (Advanced Media Intelligence) routes loaded');
}
