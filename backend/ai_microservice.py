"""
AI Studio Python Microservice
Handles all AI API integrations using emergentintegrations library
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import base64
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import emergentintegrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

app = FastAPI(title="AI Studio Microservice", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get API key from environment
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-3A6Ba8062AfA8B036E")

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
# TTS ENDPOINT (Mock for now - can be extended)
# ============================================================

@app.post("/ai/tts/generate")
async def generate_tts(request: TTSRequest):
    """Generate text-to-speech (mock implementation)"""
    try:
        return {
            "model": request.model,
            "audio_url": "https://placeholder.com/audio.mp3",
            "text": request.text,
            "voice": request.voice,
            "duration": len(request.text.split()) * 0.5  # Rough estimate
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")

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
