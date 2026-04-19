// ============= PHASE 8: VOICE CLONING & CONVERSION ROUTES =============
// Voice cloning, voice conversion, TTS with voice cloning capabilities
// Inspired by Applio and comprehensive voice model ecosystem

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

export function setupPhase8Routes(app, db, io, authenticateToken, ObjectId) {
  console.log('Setting up Phase 8 (Voice Cloning & Conversion) routes...');

  // ============= GROK SPEECH-TO-TEXT (NEW 2025) =============
  
  // Grok STT - Batch Transcription
  app.post('/api/voice/grok-stt/batch', authenticateToken, async (req, res) => {
    try {
      const { audio_url, language = 'auto', options = {} } = req.body;

      const transcription = {
        job_id: new ObjectId(),
        user_id: req.user.userId,
        audio_url,
        language,
        model: 'grok-stt-batch',
        options: {
          speaker_diarization: options.speaker_diarization || false,
          word_timestamps: options.word_timestamps || true,
          smart_formatting: options.smart_formatting || true,
          multi_channel: options.multi_channel || false,
          ...options
        },
        status: 'processing',
        created_at: new Date(),
        result: null,
        pricing: { rate: '$0.10/hour', estimated_cost: 0 },
        features: {
          languages_supported: 25,
          wer: '6.9%',  // Word Error Rate - beats competitors
          accuracy: 'blazing'
        }
      };

      await db.collection('voice_transcriptions').insertOne(transcription);

      // Simulate processing
      setTimeout(async () => {
        const mockResult = {
          text: 'This is a sample transcription from Grok Speech-to-Text API. [laugh] It supports 25+ languages with 6.9% WER accuracy.',
          duration_seconds: 45,
          language_detected: 'en',
          word_timestamps: [
            { word: 'This', start: 0.0, end: 0.2, confidence: 0.99 },
            { word: 'is', start: 0.2, end: 0.3, confidence: 0.98 }
          ],
          speakers: options.speaker_diarization ? [
            { speaker_id: 'speaker_1', segments: [[0, 15]] },
            { speaker_id: 'speaker_2', segments: [[15, 45]] }
          ] : null,
          formatted: {
            numbers: true,
            dates: true,
            currencies: true
          }
        };

        await db.collection('voice_transcriptions').updateOne(
          { job_id: transcription.job_id },
          { 
            $set: { 
              status: 'completed', 
              result: mockResult,
              completed_at: new Date(),
              'pricing.estimated_cost': ((45 / 3600) * 0.10).toFixed(4)
            }
          }
        );

        io.emit('voice:transcription-complete', { job_id: transcription.job_id.toString() });
      }, 3000);

      res.json({
        ...transcription,
        job_id: transcription.job_id.toString(),
        message: 'Grok STT batch transcription started',
        estimated_time: '5-10 seconds'
      });
    } catch (error) {
      console.error('Grok STT batch error:', error);
      res.status(500).json({ error: 'Failed to start transcription' });
    }
  });

  // Grok STT - Real-time Streaming (WebSocket endpoint info)
  app.get('/api/voice/grok-stt/streaming/info', authenticateToken, (req, res) => {
    res.json({
      websocket_url: 'wss://api.x.ai/v1/audio/speech-to-text/stream',
      method: 'WebSocket',
      pricing: '$0.20/hour',
      features: {
        real_time: true,
        low_latency: '<100ms',
        languages: 25,
        wer: '6.9%',
        speaker_diarization: true,
        word_timestamps: true,
        smart_formatting: true
      },
      example_usage: {
        connect: 'WebSocket connection with audio stream',
        response: 'Real-time transcription chunks'
      }
    });
  });

  // ============= GROK TEXT-TO-SPEECH (NEW 2025) =============

  // Grok TTS - Generate Speech
  app.post('/api/voice/grok-tts/generate', authenticateToken, async (req, res) => {
    try {
      const { text, voice = 'default', options = {} } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const tts = {
        job_id: new ObjectId(),
        user_id: req.user.userId,
        text,
        voice,
        model: 'grok-tts',
        options: {
          speed: options.speed || 1.0,
          pitch: options.pitch || 1.0,
          format: options.format || 'mp3',
          ...options
        },
        status: 'processing',
        created_at: new Date(),
        audio_url: null,
        pricing: {
          rate: '$4.20 per 1M characters',
          characters: text.length,
          estimated_cost: ((text.length / 1000000) * 4.20).toFixed(4)
        },
        features: {
          natural_voices: true,
          expressive: true,
          controls: ['[laugh]', '[sigh]', '<emphasis>', '<slow>', '<pause>'],
          no_complex_markup: true
        }
      };

      await db.collection('voice_tts').insertOne(tts);

      // Simulate TTS generation
      setTimeout(async () => {
        const audioUrl = `/storage/tts/${tts.job_id}.mp3`;
        await db.collection('voice_tts').updateOne(
          { job_id: tts.job_id },
          { 
            $set: { 
              status: 'completed', 
              audio_url: audioUrl,
              completed_at: new Date(),
              duration_seconds: Math.ceil(text.length / 15)  // ~15 chars/sec
            }
          }
        );

        io.emit('voice:tts-complete', { job_id: tts.job_id.toString(), audio_url: audioUrl });
      }, 2000);

      res.json({
        ...tts,
        job_id: tts.job_id.toString(),
        message: 'Grok TTS generation started',
        estimated_time: '2-5 seconds',
        voice_controls_example: 'Use [laugh], [sigh], <emphasis>, <slow>, <pause> in your text'
      });
    } catch (error) {
      console.error('Grok TTS error:', error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  });

  // Grok TTS - Streaming (WebSocket info)
  app.get('/api/voice/grok-tts/streaming/info', authenticateToken, (req, res) => {
    res.json({
      websocket_url: 'wss://api.x.ai/v1/audio/text-to-speech/stream',
      method: 'WebSocket',
      pricing: '$4.20 per 1M characters',
      features: {
        real_time: true,
        low_latency: true,
        natural_voices: true,
        expressive_controls: true,
        easy_markup: true
      },
      voice_controls: {
        emotions: ['[laugh]', '[sigh]', '[gasp]', '[cry]'],
        emphasis: ['<emphasis>text</emphasis>'],
        speed: ['<slow>text</slow>', '<fast>text</fast>'],
        pause: ['<pause duration=\"1s\"/>']
      },
      example: 'Hello [laugh] this is amazing <emphasis>truly</emphasis> <slow>wonderful</slow>!'
    });
  });

  // Get Grok voice job status
  app.get('/api/voice/grok/:job_type/:job_id', authenticateToken, async (req, res) => {
    try {
      const { job_type, job_id } = req.params;
      const collection = job_type === 'stt' ? 'voice_transcriptions' : 'voice_tts';

      const job = await db.collection(collection).findOne({ job_id: new ObjectId(job_id) });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ ...job, job_id: job.job_id.toString() });
    } catch (error) {
      console.error('Get Grok job error:', error);
      res.status(500).json({ error: 'Failed to retrieve job' });
    }
  });

  // ============= ORIGINAL VOICE CLONING ROUTES (PRESERVED) =============

  // ============= VOICE CLONING MODELS DATABASE =============
  
  const voiceModels = {
    // Top Tier Production Models
    'fish-audio-s2-pro': {
      id: 'fish-audio-s2-pro',
      name: 'Fish Audio S2 Pro',
      provider: 'Fish Audio',
      parameters: '5B',
      languages: '80+',
      zeroShot: true,
      streaming: true,
      quality: 'production',
      features: ['emotion-control', 'prosody-control', '15k-tags'],
      bestFor: 'High-quality commercial TTS'
    },
    'kokoro-82m': {
      id: 'kokoro-82m',
      name: 'Kokoro 82M',
      provider: 'HexGrad',
      parameters: '82M',
      languages: '8 (54 voices)',
      zeroShot: true,
      streaming: true,
      quality: 'high',
      features: ['lightweight', 'fast', 'cost-effective'],
      bestFor: 'Fast, efficient voice cloning'
    },
    'kokoclone': {
      id: 'kokoclone',
      name: 'KokoClone',
      provider: 'Ashish Patnaik',
      parameters: '82M',
      languages: '7',
      zeroShot: true,
      streaming: true,
      quality: 'high',
      features: ['3-10s-reference', 'real-time', 'multilingual'],
      bestFor: 'Quick voice cloning'
    },
    
    // Lightweight Fast Models
    'kittentts': {
      id: 'kittentts',
      name: 'KittenTTS',
      provider: 'KittenML',
      parameters: '15M-80M',
      languages: 'English+',
      zeroShot: true,
      streaming: true,
      quality: 'good',
      features: ['lightweight', 'no-gpu', '25MB'],
      bestFor: 'On-device, mobile apps'
    },
    'neutts-air': {
      id: 'neutts-air',
      name: 'NeuTTS Air',
      provider: 'Neuphonic',
      parameters: '360M',
      languages: '4 (En/Es/De/Fr)',
      zeroShot: true,
      streaming: true,
      quality: 'good',
      features: ['on-device', 'gguf-quantized'],
      bestFor: 'Edge deployment'
    },
    'sopro-tts': {
      id: 'sopro-tts',
      name: 'SoproTTS',
      provider: 'Samuel Vitorino',
      parameters: '135M',
      languages: 'English',
      zeroShot: true,
      streaming: true,
      quality: 'good',
      features: ['250ms-latency', 'cpu-optimized'],
      bestFor: 'Real-time English TTS'
    },
    
    // Enterprise Grade
    'moss-tts': {
      id: 'moss-tts',
      name: 'MOSS-TTS',
      provider: 'OpenMOSS / MOSI.AI',
      parameters: '8B',
      languages: '20',
      zeroShot: true,
      streaming: true,
      quality: 'production',
      features: ['1-hour-max', 'pronunciation-control', 'emotion'],
      bestFor: 'Enterprise-grade TTS'
    },
    'qwen3-tts': {
      id: 'qwen3-tts',
      name: 'Qwen3-TTS',
      provider: 'Alibaba',
      parameters: '0.6B-1.7B',
      languages: '10',
      zeroShot: true,
      streaming: true,
      quality: 'high',
      features: ['97ms-latency', 'voice-design', 'free-form'],
      bestFor: 'Multilingual production'
    },
    
    // Singing Voice
    'soulx-singer': {
      id: 'soulx-singer',
      name: 'SoulX-Singer',
      provider: 'Soul-AILab',
      parameters: 'N/A',
      languages: 'Mandarin/English/Cantonese',
      zeroShot: true,
      streaming: true,
      quality: 'high',
      features: ['singing', 'midi-control', 'f0-control'],
      bestFor: 'Singing voice synthesis'
    },
    
    // Specialized
    'vibevoice-realtime': {
      id: 'vibevoice-realtime',
      name: 'VibeVoice-Realtime',
      provider: 'Microsoft',
      parameters: '0.5B',
      languages: 'Multilingual',
      zeroShot: true,
      streaming: true,
      quality: 'high',
      features: ['300ms-latency', 'streaming-text-input'],
      bestFor: 'Real-time conversational AI'
    }
  };

  // Get available voice cloning models
  app.get('/api/voice/models', authenticateToken, (req, res) => {
    res.json({
      models: Object.values(voiceModels),
      count: Object.keys(voiceModels).length
    });
  });

  // Clone voice from reference audio
  app.post('/api/voice/clone', authenticateToken, async (req, res) => {
    try {
      const { 
        text, 
        reference_audio_url, 
        model = 'kokoro-82m',
        language = 'en',
        emotion = 'neutral',
        speed = 1.0
      } = req.body;
      
      if (!text || !reference_audio_url) {
        return res.status(400).json({ error: 'Text and reference audio are required' });
      }

      const selectedModel = voiceModels[model];
      if (!selectedModel) {
        return res.status(400).json({ error: 'Invalid model selection' });
      }

      // Return mock response for now - in production would call actual TTS/voice cloning API
      const result = {
        job_id: `voice_clone_${model}_${Date.now()}`,
        status: 'queued',
        model: selectedModel.name,
        provider: selectedModel.provider,
        text,
        reference_audio: reference_audio_url,
        language,
        emotion,
        speed,
        estimated_time: '10-30 seconds',
        features: selectedModel.features,
        audio_url: null, // Would be populated when processing completes
        message: 'Voice cloning job queued. This is a mock response - integrate actual voice cloning API for production.'
      };

      res.json(result);
    } catch (error) {
      console.error('Voice cloning error:', error);
      res.status(500).json({ error: 'Failed to clone voice' });
    }
  });

  // Voice conversion (change voice characteristics)
  app.post('/api/voice/convert', authenticateToken, async (req, res) => {
    try {
      const {
        source_audio_url,
        target_voice_reference,
        model = 'kokoclone',
        pitch_shift = 0,
        formant_shift = 0,
        quality = 'high'
      } = req.body;

      if (!source_audio_url || !target_voice_reference) {
        return res.status(400).json({ error: 'Source audio and target voice reference are required' });
      }

      const selectedModel = voiceModels[model];
      if (!selectedModel) {
        return res.status(400).json({ error: 'Invalid model selection' });
      }

      const result = {
        job_id: `voice_convert_${model}_${Date.now()}`,
        status: 'queued',
        model: selectedModel.name,
        provider: selectedModel.provider,
        source_audio: source_audio_url,
        target_voice: target_voice_reference,
        pitch_shift,
        formant_shift,
        quality,
        estimated_time: '30-60 seconds',
        converted_audio_url: null,
        message: 'Voice conversion job queued. Integrate RVC/Applio-style conversion for production.'
      };

      res.json(result);
    } catch (error) {
      console.error('Voice conversion error:', error);
      res.status(500).json({ error: 'Failed to convert voice' });
    }
  });

  // Text-to-Speech with cloned voice
  app.post('/api/voice/tts-clone', authenticateToken, async (req, res) => {
    try {
      const {
        text,
        voice_id, // Pre-saved voice profile
        model = 'fish-audio-s2-pro',
        language = 'en',
        style = 'neutral',
        speed = 1.0,
        pitch = 0
      } = req.body;

      if (!text || !voice_id) {
        return res.status(400).json({ error: 'Text and voice ID are required' });
      }

      const selectedModel = voiceModels[model];
      if (!selectedModel) {
        return res.status(400).json({ error: 'Invalid model selection' });
      }

      const result = {
        job_id: `tts_clone_${model}_${Date.now()}`,
        status: 'processing',
        model: selectedModel.name,
        text,
        voice_id,
        language,
        style,
        speed,
        pitch,
        audio_url: null,
        duration_estimate: `${Math.ceil(text.length / 20)} seconds`,
        message: 'TTS generation with cloned voice. Integrate production TTS API.'
      };

      res.json(result);
    } catch (error) {
      console.error('TTS clone error:', error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  });

  // Save voice profile from reference audio
  app.post('/api/voice/profile/save', authenticateToken, async (req, res) => {
    try {
      const {
        name,
        reference_audio_urls, // Array of 3-10 second clips
        description,
        language = 'en',
        gender = 'neutral'
      } = req.body;

      if (!name || !reference_audio_urls || reference_audio_urls.length === 0) {
        return res.status(400).json({ error: 'Name and reference audio URLs are required' });
      }

      const voiceProfile = {
        _id: new ObjectId(),
        user_id: req.userId,
        name,
        reference_audio_urls,
        description,
        language,
        gender,
        created_at: new Date(),
        status: 'processing',
        model_data: null
      };

      await db.collection('voice_profiles').insertOne(voiceProfile);

      res.json({
        voice_id: voiceProfile._id.toString(),
        name,
        status: 'processing',
        message: 'Voice profile created. Processing reference audio to create voice model.',
        estimated_time: '2-5 minutes'
      });
    } catch (error) {
      console.error('Voice profile save error:', error);
      res.status(500).json({ error: 'Failed to save voice profile' });
    }
  });

  // Get user's voice profiles
  app.get('/api/voice/profiles', authenticateToken, async (req, res) => {
    try {
      const profiles = await db.collection('voice_profiles')
        .find({ user_id: req.userId })
        .sort({ created_at: -1 })
        .toArray();

      res.json({
        profiles: profiles.map(p => ({
          voice_id: p._id.toString(),
          name: p.name,
          description: p.description,
          language: p.language,
          gender: p.gender,
          status: p.status,
          created_at: p.created_at,
          reference_count: p.reference_audio_urls?.length || 0
        })),
        count: profiles.length
      });
    } catch (error) {
      console.error('Get profiles error:', error);
      res.status(500).json({ error: 'Failed to retrieve voice profiles' });
    }
  });

  // Delete voice profile
  app.delete('/api/voice/profile/:voiceId', authenticateToken, async (req, res) => {
    try {
      const { voiceId } = req.params;
      
      const result = await db.collection('voice_profiles').deleteOne({
        _id: new ObjectId(voiceId),
        user_id: req.userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Voice profile not found' });
      }

      res.json({ message: 'Voice profile deleted successfully' });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({ error: 'Failed to delete voice profile' });
    }
  });

  // Get voice cloning job status
  app.get('/api/voice/job/:jobId', authenticateToken, async (req, res) => {
    try {
      const { jobId } = req.params;
      
      // In production, would query actual job processing system
      res.json({
        job_id: jobId,
        status: 'completed',
        progress: 100,
        audio_url: 'https://example.com/generated-audio.mp3',
        duration: 15.5,
        message: 'Voice generation completed successfully'
      });
    } catch (error) {
      console.error('Job status error:', error);
      res.status(500).json({ error: 'Failed to retrieve job status' });
    }
  });

  // Voice similarity analysis
  app.post('/api/voice/similarity', authenticateToken, async (req, res) => {
    try {
      const { audio_url_1, audio_url_2 } = req.body;

      if (!audio_url_1 || !audio_url_2) {
        return res.status(400).json({ error: 'Two audio URLs are required' });
      }

      // Mock similarity score - in production would use actual voice embedding comparison
      const similarity = Math.random() * 0.3 + 0.7; // 0.7-1.0 range

      res.json({
        similarity_score: similarity,
        confidence: 0.95,
        verdict: similarity > 0.85 ? 'very_similar' : similarity > 0.70 ? 'similar' : 'different',
        message: 'Voice similarity analysis complete'
      });
    } catch (error) {
      console.error('Similarity analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze voice similarity' });
    }
  });

  console.log('✅ Phase 8 (Voice Cloning & Conversion) routes loaded');
}
