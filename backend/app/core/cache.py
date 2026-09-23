import json
import logging
from typing import Any, Optional
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Reusable Redis client instance
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Returns singleton Redis client with connection error handling."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            _redis_client.ping()
            logger.info("Connected to Redis cache at %s", settings.REDIS_URL)
        except Exception as e:
            logger.warning("Redis cache unavailable: %s", e)
            _redis_client = None
    return _redis_client


def get_cache(key: str) -> Optional[Any]:
    """Retrieve and deserialize JSON value from Redis by key."""
    client = get_redis_client()
    if not client:
        return None
    try:
        val = client.get(key)
        if val is not None:
            return json.loads(val)
    except Exception as e:
        logger.warning("Redis get_cache error for %s: %s", key, e)
    return None


def set_cache(key: str, value: Any, ttl_seconds: int = 60) -> bool:
    """Serialize and store JSON value into Redis with a TTL."""
    client = get_redis_client()
    if not client:
        return False
    try:
        serialized = json.dumps(value, default=str)
        client.setex(key, ttl_seconds, serialized)
        return True
    except Exception as e:
        logger.warning("Redis set_cache error for %s: %s", key, e)
        return False


def delete_cache(key: str) -> bool:
    """Delete a key from Redis."""
    client = get_redis_client()
    if not client:
        return False
    try:
        client.delete(key)
        return True
    except Exception as e:
        logger.warning("Redis delete_cache error for %s: %s", key, e)
        return False


def invalidate_learner_cache(learner_id: str) -> None:
    """Invalidate all cached metrics and recommendations for a learner."""
    delete_cache(f"cache:mastery:{learner_id}")
    delete_cache(f"cache:next_topic:{learner_id}")
