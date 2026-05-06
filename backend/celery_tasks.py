# ============================================================
# AI STUDIO ENTERPRISE MICROSERVICE - CELERY TASKS
# Async task processing for long-running AI operations
# ============================================================

from celery_config import celery_app
from typing import Dict, Any
import asyncio
import httpx
import time
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
ATLAS_CLOUD_API_KEY = os.getenv('ATLAS_CLOUD_API_KEY', '')
ATLAS_CLOUD_BASE_URL = 'https://api.atlascloud.ai/v1'
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', 'sk-emergent-3A6Ba8062AfA8B036E')

# ============================================================
# ATLAS CLOUD API INTEGRATION
# ============================================================

async def call_atlas_cloud_api(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Call Atlas Cloud API with error handling"""
    if not ATLAS_CLOUD_API_KEY:
        raise Exception('Atlas Cloud API key not configured')
    
    headers = {
        'Authorization': f'Bearer {ATLAS_CLOUD_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f'{ATLAS_CLOUD_BASE_URL}/{endpoint}',
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        return response.json()

async def poll_atlas_task(prediction_id: str, max_wait: int = 180) -> Dict[str, Any]:
    """Poll Atlas Cloud task with exponential backoff"""
    start_time = time.time()
    backoff = 2
    
    while time.time() - start_time < max_wait:
        try:
            result = await call_atlas_cloud_api(
                f'model/prediction/{prediction_id}',
                {}
            )
            
            status = result.get('data', {}).get('status')
            
            if status == 'completed':
                return result.get('data', {})
            elif status == 'failed':
                error = result.get('data', {}).get('error', 'Unknown error')
                raise Exception(f'Atlas Cloud task failed: {error}')
            
            await asyncio.sleep(min(backoff, 10))
            backoff *= 1.5
            
        except httpx.HTTPError as e:
            logger.error(f'Atlas Cloud polling error: {e}')
            await asyncio.sleep(backoff)
    
    raise Exception('Atlas Cloud task timeout')

# ============================================================
# CELERY TASKS
# ============================================================

@celery_app.task(
    bind=True,
    name='tasks.generate_music',
    max_retries=3,
    default_retry_delay=30
)
def generate_music_task(self, model: str, prompt: str, **kwargs):
    """Async task for music generation"""
    try:
        logger.info(f'Starting music generation: {model} - {prompt[:50]}')
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            _generate_music_async(model, prompt, kwargs)
        )
        
        logger.info(f'Music generation completed: {model}')
        return result
        
    except Exception as e:
        logger.error(f'Music generation error: {e}')
        raise self.retry(exc=e)

async def _generate_music_async(model: str, prompt: str, kwargs: Dict) -> Dict:
    """Async music generation logic"""
    result = await call_atlas_cloud_api('audio/generations', {
        'model': model,
        'prompt': prompt,
        'make_instrumental': kwargs.get('instrumental_only', False),
        'duration': kwargs.get('duration', 120)
    })
    
    prediction_id = result.get('data', {}).get('id')
    if not prediction_id:
        raise Exception('No prediction ID returned')
    
    completed_data = await poll_atlas_task(prediction_id, max_wait=180)
    
    return {
        'model': model,
        'music_url': completed_data.get('outputs', [{}])[0].get('url'),
        'duration': kwargs.get('duration', 120),
        'prompt': prompt,
        'status': 'completed'
    }

@celery_app.task(
    bind=True,
    name='tasks.generate_video',
    max_retries=3,
    default_retry_delay=30
)
def generate_video_task(self, model: str, prompt: str, **kwargs):
    """Async task for video generation"""
    try:
        logger.info(f'Starting video generation: {model} - {prompt[:50]}')
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            _generate_video_async(model, prompt, kwargs)
        )
        
        logger.info(f'Video generation completed: {model}')
        return result
        
    except Exception as e:
        logger.error(f'Video generation error: {e}')
        raise self.retry(exc=e)

async def _generate_video_async(model: str, prompt: str, kwargs: Dict) -> Dict:
    """Async video generation logic"""
    model_mapping = {
        'veo-3.1': 'veo-3.1',
        'vidu-q3': 'vidu-q3',
        'seedance-2.0': 'seedance-2.0',
        'kling-3.0': 'kling-3.0',
        'sora-2-api': 'sora-2.0',
        'wan-2.7': 'wan-2.7',
        'happy-horse-1.0': 'happy-horse-1.0'
    }
    
    atlas_model = model_mapping.get(model, 'veo-3.1')
    
    result = await call_atlas_cloud_api('video/generate', {
        'model': atlas_model,
        'prompt': prompt,
        'image_url': kwargs.get('image_url'),
        'duration': kwargs.get('duration', 10),
        'aspect_ratio': kwargs.get('aspect_ratio', '16:9')
    })
    
    prediction_id = result.get('data', {}).get('id')
    if not prediction_id:
        raise Exception('No prediction ID returned')
    
    completed_data = await poll_atlas_task(prediction_id, max_wait=240)
    
    return {
        'model': model,
        'video_url': completed_data.get('outputs', [{}])[0].get('url'),
        'duration': kwargs.get('duration', 10),
        'prompt': prompt,
        'status': 'completed'
    }

def map_model_to_provider(model_id: str) -> tuple:
    """Map model ID to provider"""
    if model_id in ['o3', 'o3-pro', 'gpt-5.5', 'gpt-5.2']:
        return ('openai', 'gpt-5.2')
    elif 'claude' in model_id:
        return ('anthropic', 'claude-4-sonnet-20250514')
    elif 'gemini' in model_id or 'gemma' in model_id:
        return ('gemini', 'gemini-2.5-pro')
    else:
        return ('openai', 'gpt-5.2')
