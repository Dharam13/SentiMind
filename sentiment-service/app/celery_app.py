"""
Celery Application Configuration for SentiMind ML Service.
Connects to RabbitMQ or Redis message broker.
"""

import os
from celery import Celery

# Priority: RABBITMQ_URL -> REDIS_URL -> default local RabbitMQ
BROKER_URL = os.getenv("RABBITMQ_URL") or os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL", "pyamqp://guest:guest@localhost:5672//")
BACKEND_URL = os.getenv("CELERY_RESULT_BACKEND") or os.getenv("REDIS_URL", "redis://localhost:6379/0") if "redis" in BROKER_URL else "rpc://"

celery_app = Celery(
    "sentimind_ml",
    broker=BROKER_URL,
    backend=BACKEND_URL,
    include=["app.tasks"],
)

from kombu import Queue

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="sentiment_tasks",
    task_queues=[
        Queue("sentiment_tasks", routing_key="sentiment_tasks"),
        Queue("celery", routing_key="celery"),
    ],
    task_routes={
        "tasks.analyze_single_mention": {"queue": "sentiment_tasks"},
        "tasks.check_spike_callback": {"queue": "sentiment_tasks"},
    },
)

if __name__ == "__main__":
    celery_app.start()
