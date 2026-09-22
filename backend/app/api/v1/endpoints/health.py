import redis
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.services.vector_store import get_vector_store
from app.schemas.common import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """System health endpoint verifying database, cache, and vector store connectivity."""
    service_status = {
        "database": "unknown",
        "redis": "unknown",
        "vector_store": "unknown",
    }

    # 1. Check PostgreSQL
    try:
        db.execute(text("SELECT 1"))
        service_status["database"] = "healthy"
    except Exception as e:
        service_status["database"] = f"unhealthy: {str(e)}"

    # 2. Check Redis
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        service_status["redis"] = "healthy"
    except Exception as e:
        service_status["redis"] = f"unhealthy: {str(e)}"

    # 3. Check ChromaDB
    try:
        vs = get_vector_store()
        if vs.heartbeat():
            service_status["vector_store"] = "healthy"
        else:
            service_status["vector_store"] = "unhealthy"
    except Exception as e:
        service_status["vector_store"] = f"unhealthy: {str(e)}"

    overall_status = (
        "healthy"
        if all("healthy" in v for v in service_status.values())
        else "degraded"
    )

    return HealthResponse(
        status=overall_status,
        environment=settings.ENVIRONMENT,
        services=service_status,
    )
