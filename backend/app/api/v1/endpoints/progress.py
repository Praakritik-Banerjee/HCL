from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ResponseEnvelope
from app.schemas.progress import (
    NextTopicResponse,
    ProgressUpdateRequest,
    ProgressUpdateResponse,
    MasteryDashboardResponse,
)
from app.services.agent.graph import LearningPathAgent
from app.services.agent.tools.progress_tracker import ProgressTrackerTool
from app.core.cache import get_cache, set_cache, invalidate_learner_cache

router = APIRouter()


@router.get("/next-topic", response_model=ResponseEnvelope[NextTopicResponse])
def get_next_recommended_topic(
    learner_id: str = Query("default_learner", description="Learner ID"),
    db: Session = Depends(get_db),
):
    """Recommends the next study topic based on syllabus sequence and mastery status."""
    cache_key = f"cache:next_topic:{learner_id}"
    cached = get_cache(cache_key)
    if cached:
        rec = NextTopicResponse(**cached)
        return ResponseEnvelope[NextTopicResponse](
            success=True,
            data=rec,
            message="Topic recommendation retrieved from fast cache.",
        )

    agent = LearningPathAgent(db=db)
    result = agent.run({"intent": "next_topic", "learner_id": learner_id})
    rec = result.get("output")

    if rec:
        set_cache(cache_key, rec.model_dump(), ttl_seconds=30)

    return ResponseEnvelope[NextTopicResponse](
        success=True,
        data=rec,
        message=rec.reason if rec else "Topic recommended.",
    )


@router.post("/update", response_model=ResponseEnvelope[ProgressUpdateResponse])
def update_progress(
    request: ProgressUpdateRequest,
    db: Session = Depends(get_db),
):
    """Records quiz attempt score, updates mastery score, and triggers remediation if struggling."""
    agent = LearningPathAgent(db=db)
    result = agent.run({
        "intent": "update_progress",
        "learner_id": request.learner_id,
        "topic_id": request.topic_id,
        "score": request.score,
    })
    output = result.get("output", {})

    # Invalidate cached progress and recommendation so the learner gets fresh data immediately
    invalidate_learner_cache(request.learner_id)

    return ResponseEnvelope[ProgressUpdateResponse](
        success=True,
        data=ProgressUpdateResponse(**output),
        message=output.get("message", "Progress updated successfully."),
    )


@router.get("/mastery", response_model=ResponseEnvelope[MasteryDashboardResponse])
def get_mastery_dashboard(
    learner_id: str = Query("default_learner", description="Learner ID"),
    db: Session = Depends(get_db),
):
    """Fetches comprehensive mastery dashboard metrics for the student with Redis caching."""
    cache_key = f"cache:mastery:{learner_id}"
    cached = get_cache(cache_key)
    if cached:
        return ResponseEnvelope[MasteryDashboardResponse](
            success=True,
            data=MasteryDashboardResponse(**cached),
        )

    tool = ProgressTrackerTool(db=db)
    dashboard = tool.get_mastery_dashboard(learner_id=learner_id)

    # Cache for 60 seconds
    set_cache(cache_key, dashboard.model_dump(), ttl_seconds=60)

    return ResponseEnvelope[MasteryDashboardResponse](
        success=True,
        data=dashboard,
    )
