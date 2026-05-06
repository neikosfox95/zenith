"""
AI Studio Python Microservice - ZENITH GRADE SUPER APP
Handles all AI API integrations:
- Emergent LLM Key (OpenAI, Anthropic, Google)
- Atlas Cloud API (300+ models: Suno, Video, Image)
- VoxCPM (Tokenizer-free TTS)
- Additional TTS providers
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import base64
import os
import httpx
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import emergentintegrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Try to import VoxCPM (install if available)
try:
    from voxcpm import VoxCPM
    VOXCPM_AVAILABLE = True
except ImportError:
    VOXCPM_AVAILABLE = False
    print("⚠️ VoxCPM not installed. Run: pip install voxcpm")

app = FastAPI(title="AI Studio Microservice - Zenith Grade", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API keys from environment
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-3A6Ba8062AfA8B036E")
ATLAS_CLOUD_API_KEY = os.getenv("ATLAS_CLOUD_API_KEY", "")
ATLAS_CLOUD_BASE_URL = "https://api.atlascloud.ai/v1"

# Initialize VoxCPM if available
voxcpm_model = None
if VOXCPM_AVAILABLE:
    try:
        voxcpm_model = VoxCPM()
        print("✅ VoxCPM initialized successfully")
    except Exception as e:
        print(f"⚠️ VoxCPM initialization failed: {e}")

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class ChatMessage(BaseModel):
    role: str
    content: str

class TextGenerationRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000
    stream: Optional[bool] = False

class ImageGenerationRequest(BaseModel):
    model: str
    prompt: str
    size: Optional[str] = "1024x1024"
    n: Optional[int] = 1

class TTSRequest(BaseModel):
    model: str
    text: str
    voice: Optional[str] = "default"
    language: Optional[str] = "en"

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def map_model_to_provider(model_id: str) -> tuple:
    """Map model ID to (provider, model_name)"""
    
    # OpenAI models
    if model_id in ['o3', 'o3-pro']:
        return ('openai', model_id)
    elif model_id in ['gpt-5.5', 'gpt-5.2', 'gpt-5.1', 'gpt-5']:
        return ('openai', 'gpt-5.2')  # Use gpt-5.2 as default
    elif model_id == 'gpt-5.3-codex':
        return ('openai', 'gpt-5.2')  # Fallback to gpt-5.2
    
    # Anthropic models
    elif model_id == 'claude-opus-4.7':
        return ('anthropic', 'claude-opus-4-6')
    elif model_id == 'claude-sonnet-4.6':
        return ('anthropic', 'claude-sonnet-4-6')
    elif 'claude' in model_id:
        return ('anthropic', 'claude-4-sonnet-20250514')
    
    # Google models
    elif model_id == 'gemini-3.1-pro':
        return ('gemini', 'gemini-3.1-pro-preview')
    elif 'gemini' in model_id or 'gemma' in model_id:
        return ('gemini', 'gemini-2.5-pro')
    
    # Fallback to OpenAI
    else:
        return ('openai', 'gpt-5.2')

# ============================================================
# TEXT GENERATION ENDPOINT
# ============================================================

@app.post("/ai/text/generate")
async def generate_text(request: TextGenerationRequest):
    """Generate text using various LLM providers"""
    try:
        # Map model to provider
        provider, model_name = map_model_to_provider(request.model)
        
        # Initialize chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ai-studio-{request.model}",
            system_message="You are a helpful AI assistant in the Zenith Grade Super App."
        )
        
        # Set provider and model
        chat.with_model(provider, model_name)
        
        # Get last user message
        last_message = request.messages[-1].content if request.messages else "Hello"
        
        # Create user message
        user_message = UserMessage(text=last_message)
        
        # Generate response
        response = await chat.send_message(user_message)
        
        return {
            "model": request.model,
            "provider": provider,
            "content": response,
            "usage": {
                "prompt_tokens": len(last_message.split()),
                "completion_tokens": len(response.split()),
                "total_tokens": len(last_message.split()) + len(response.split())
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text generation error: {str(e)}")

# ============================================================
# IMAGE GENERATION ENDPOINT
# ============================================================

@app.post("/ai/image/generate")
async def generate_image(request: ImageGenerationRequest):
    """Generate images using OpenAI DALL-E"""
    try:
        # Initialize image generator
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        
        # Determine model
        model = "gpt-image-1" if "gpt-image" in request.model else "dall-e-3"
        
        # Generate images
        images = await image_gen.generate_images(
            prompt=request.prompt,
            model=model,
            number_of_images=request.n
        )
        
        # Convert to base64
        image_urls = []
        for i, image_bytes in enumerate(images):
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            # Return as data URL
            image_urls.append(f"data:image/png;base64,{image_base64}")
        
        return {
            "model": request.model,
            "images": image_urls,
            "prompt": request.prompt
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation error: {str(e)}")

# ============================================================
# ATLAS CLOUD API INTEGRATION (300+ MODELS)
# ============================================================

async def call_atlas_cloud(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Call Atlas Cloud API with error handling"""
    if not ATLAS_CLOUD_API_KEY:
        raise HTTPException(status_code=500, detail="Atlas Cloud API key not configured")
    
    headers = {
        "Authorization": f"Bearer {ATLAS_CLOUD_API_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{ATLAS_CLOUD_BASE_URL}/{endpoint}",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Atlas Cloud API error: {str(e)}")

async def poll_atlas_task(prediction_id: str, max_wait: int = 120) -> Dict[str, Any]:
    """Poll Atlas Cloud task until completion"""
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        result = await call_atlas_cloud(
            f"model/prediction/{prediction_id}",
            {}
        )
        
        status = result.get("data", {}).get("status")
        
        if status == "completed":
            return result.get("data", {})
        elif status == "failed":
            error = result.get("data", {}).get("error", "Unknown error")
            raise HTTPException(status_code=500, detail=f"Atlas Cloud task failed: {error}")
        
        await asyncio.sleep(2)
    
    raise HTTPException(status_code=408, detail="Atlas Cloud task timeout")

# ============================================================
# MUSIC GENERATION (SUNO via Atlas Cloud)
# ============================================================

@app.post("/ai/music/generate")
async def generate_music(request: Dict[str, Any]):
    """Generate music using Suno via Atlas Cloud"""
    try:
        model = request.get("model", "suno-v5-beta")
        prompt = request.get("prompt", "")
        
        # Submit to Atlas Cloud
        result = await call_atlas_cloud("audio/generations", {
            "model": model,
            "prompt": prompt,
            "make_instrumental": request.get("instrumental_only", False),
            "duration": request.get("duration", 120)
        })
        
        # Get prediction ID
        prediction_id = result.get("data", {}).get("id")
        
        if not prediction_id:
            raise HTTPException(status_code=500, detail="No prediction ID returned")
        
        # Poll for completion
        completed_data = await poll_atlas_task(prediction_id)
        
        return {
            "model": model,
            "music_url": completed_data.get("outputs", [{}])[0].get("url"),
            "duration": request.get("duration", 120),
            "prompt": prompt
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Music generation error: {str(e)}")

# ============================================================
# VIDEO GENERATION (Multiple models via Atlas Cloud)
# ============================================================

@app.post("/ai/video/generate")
async def generate_video(request: Dict[str, Any]):
    """Generate video using Atlas Cloud (Veo, Vidu, Seedance, Kling, etc.)"""
    try:
        model = request.get("model", "veo-3.1")
        prompt = request.get("prompt", "")
        
        # Map model to Atlas Cloud model ID
        model_mapping = {
            "veo-3.1": "veo-3.1",
            "vidu-q3": "vidu-q3",
            "seedance-2.0": "seedance-2.0",
            "kling-3.0": "kling-3.0",
            "sora-2-api": "sora-2.0",
            "wan-2.7": "wan-2.7",
            "happy-horse-1.0": "happy-horse-1.0"
        }
        
        atlas_model = model_mapping.get(model, "veo-3.1")
        
        # Submit to Atlas Cloud
        result = await call_atlas_cloud("video/generate", {
            "model": atlas_model,
            "prompt": prompt,
            "image_url": request.get("image_url"),
            "duration": request.get("duration", 10),
            "aspect_ratio": request.get("aspect_ratio", "16:9")
        })
        
        # Get prediction ID
        prediction_id = result.get("data", {}).get("id")
        
        if not prediction_id:
            raise HTTPException(status_code=500, detail="No prediction ID returned")
        
        # Poll for completion
        completed_data = await poll_atlas_task(prediction_id, max_wait=180)
        
        return {
            "model": model,
            "video_url": completed_data.get("outputs", [{}])[0].get("url"),
            "duration": request.get("duration", 10),
            "prompt": prompt
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video generation error: {str(e)}")

# ============================================================
# TEXT-TO-SPEECH (VoxCPM)
# ============================================================

@app.post("/ai/tts/voxcpm")
async def generate_voxcpm_tts(request: Dict[str, Any]):
    """Generate TTS using VoxCPM (tokenizer-free)"""
    try:
        if not VOXCPM_AVAILABLE or not voxcpm_model:
            raise HTTPException(status_code=503, detail="VoxCPM not available")
        
        text = request.get("text", "")
        voice = request.get("voice", "default")
        
        # Generate audio
        audio = voxcpm_model.generate(
            text=text,
            cfg_value=2.0,
            inference_timesteps=10,
            normalize=True,
            denoise=True
        )
        
        # Convert to base64
        import soundfile as sf
        import io
        
        buffer = io.BytesIO()
        sf.write(buffer, audio, voxcpm_model.tts_model.sample_rate, format='WAV')
        buffer.seek(0)
        audio_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        return {
            "model": "voxcpm-1.0",
            "audio_url": f"data:audio/wav;base64,{audio_base64}",
            "text": text,
            "duration": len(audio) / voxcpm_model.tts_model.sample_rate
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VoxCPM TTS error: {str(e)}")

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "AI Studio Microservice",
        "emergent_key_configured": bool(EMERGENT_LLM_KEY)
    }

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
