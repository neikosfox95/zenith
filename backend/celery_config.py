# ============================================================
# AI STUDIO ENTERPRISE MICROSERVICE - CELERY CONFIGURATION
# Production-grade task queue for async AI generation
# ============================================================

from celery import Celery
import os
from kombu import Queue

# Redis configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Initialize Celery
celery_app = Celery(
    'ai_studio',
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task routing
    task_routes={
        'tasks.generate_music': {'queue': 'music'},
        'tasks.generate_video': {'queue': 'video'},
        'tasks.generate_text': {'queue': 'text'},
        'tasks.generate_image': {'queue': 'image'},
    },
    
    # Queue configuration
    task_queues=(
        Queue('music', routing_key='music'),
        Queue('video', routing_key='video'),
        Queue('text', routing_key='text'),
        Queue('image', routing_key='image'),
        Queue('default', routing_key='default'),
    ),
    
    # Task execution
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=300,
    task_soft_time_limit=280,
    
    # Results
    result_expires=3600,
    result_backend_transport_options={
        'retry_on_timeout': True,
    },
    
    # Worker configuration
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Retry policy
    task_default_retry_delay=10,
    task_max_retries=3,
    
    # Rate limiting
    task_annotations={
        'tasks.generate_music': {'rate_limit': '10/m'},
        'tasks.generate_video': {'rate_limit': '5/m'},
    }
)
