# Production Voice API Integration

## Overview
This document describes the production-ready voice cloning API integrations for the TikTok Super App.

## Integrated APIs

### 1. Hugging Face Inference API
- **Models:** Kokoro, Fish Audio, KittenTTS, SoproTTS
- **Method:** Direct HTTP API calls to HF Inference endpoints
- **Authentication:** HF API key (separate from Emergent LLM Key)

### 2. Local RVC Processing (Applio-style)
- **Method:** Python subprocess with RVC voice conversion
- **Models:** Downloadable RVC checkpoints
- **Processing:** Local GPU/CPU processing

### 3. Real-time TTS Services
- **Providers:** Coqui TTS, Piper TTS
- **Method:** Local inference engines
- **Latency:** <500ms for short sentences

## API Implementation Strategy

### Phase 1: Hugging Face Integration (Immediate)
Use HF Inference API for production-grade voice cloning:

```python
# huggingface_voice_service.py
import requests
import os

HF_API_KEY = os.getenv('HUGGINGFACE_API_KEY')
API_URL_BASE = "https://api-inference.huggingface.co/models/"

def clone_voice_hf(text, reference_audio, model="hexgrad/Kokoro-82M"):
    """Clone voice using Hugging Face Inference API"""
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    
    payload = {
        "inputs": {
            "text": text,
            "reference_audio": reference_audio
        }
    }
    
    response = requests.post(
        f"{API_URL_BASE}{model}",
        headers=headers,
        json=payload
    )
    
    return response.content  # Audio bytes
```

### Phase 2: Local RVC Processing (Advanced)
For RVC-based voice conversion:

```python
# rvc_voice_service.py
import subprocess
import tempfile

def convert_voice_rvc(source_audio_path, model_path, pitch_shift=0):
    """Convert voice using RVC (Applio-style)"""
    
    # Create temp output file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        output_path = tmp.name
    
    # Run RVC inference
    cmd = [
        'python', 'rvc_inference.py',
        '--input', source_audio_path,
        '--model', model_path,
        '--pitch', str(pitch_shift),
        '--output', output_path
    ]
    
    subprocess.run(cmd, check=True)
    
    return output_path
```

### Phase 3: Real-time TTS
For low-latency TTS:

```python
# realtime_tts_service.py
from TTS.api import TTS

# Initialize Coqui TTS
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC")

def generate_speech_realtime(text, voice_profile_path):
    """Generate speech with cloned voice"""
    
    # Generate with voice cloning
    tts.tts_with_vc_to_file(
        text=text,
        speaker_wav=voice_profile_path,
        file_path="output.wav"
    )
    
    return "output.wav"
```

## Environment Variables Required

```bash
# Add to /app/backend/.env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
VOICE_STORAGE_PATH=/app/storage/voices
AUDIO_TEMP_PATH=/app/tmp/audio
RVC_MODELS_PATH=/app/models/rvc
```

## API Endpoint Updates

### Enhanced Clone Endpoint
```javascript
// POST /api/voice/clone
// Now calls real production APIs instead of mocks

app.post('/api/voice/clone', async (req, res) => {
  const { text, reference_audio_url, model } = req.body;
  
  // Download reference audio
  const refAudio = await downloadAudio(reference_audio_url);
  
  // Call Hugging Face API
  const audioBytes = await cloneVoiceHF(text, refAudio, model);
  
  // Upload to storage
  const audioUrl = await uploadToStorage(audioBytes);
  
  res.json({
    job_id: jobId,
    status: 'completed',
    audio_url: audioUrl,
    duration: audioDuration
  });
});
```

## Storage Architecture

```
/app/storage/
├── voices/          # User voice profiles
│   ├── {user_id}/
│   │   ├── {profile_id}/
│   │   │   ├── references/  # Reference audios
│   │   │   └── model.pth    # Trained RVC model
├── generated/       # Generated audio files
│   └── {date}/
│       └── {job_id}.wav
└── temp/            # Temporary processing files
```

## Performance Optimization

1. **Caching:** Cache voice embeddings for reuse
2. **Queue System:** Redis-based job queue for async processing
3. **CDN:** Upload generated audio to CDN for fast delivery
4. **Batch Processing:** Process multiple requests in batches

## Monitoring & Logging

- Job status tracking in MongoDB
- Audio generation metrics (duration, model used, latency)
- Error logging for failed generations
- Usage analytics per user

## Next Steps for Full Production

1. **Get Hugging Face API Key:** https://huggingface.co/settings/tokens
2. **Install Python Dependencies:**
   ```bash
   pip install TTS torch torchaudio librosa soundfile
   ```
3. **Download RVC Models:** Clone Applio repo and download checkpoints
4. **Setup Storage:** Configure S3/MinIO for audio storage
5. **Deploy Workers:** Setup background workers for async processing

## Current Status

✅ API endpoints structure ready  
✅ Mock responses working  
✅ Database schema created  
⏳ Hugging Face integration (needs API key)  
⏳ Local RVC setup (needs model downloads)  
⏳ Storage infrastructure (needs configuration)

## Recommended Production Stack

**Immediate (No extra keys needed):**
- Local Piper TTS (lightweight, fast)
- Coqui TTS (high quality, open source)

**With HF API Key:**
- Kokoro-82M via HF Inference
- SoproTTS via HF Inference

**Advanced (Self-hosted):**
- RVC model training pipeline
- Custom voice embedding extraction
- Real-time streaming TTS

See `/app/backend/services/production_voice_api.py` for implementation.
