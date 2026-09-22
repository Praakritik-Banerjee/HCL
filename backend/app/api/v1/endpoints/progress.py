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

router = APIRouter()


@router.get("/next-topic", response_model=ResponseEnvelope[NextTopicResponse])
def get_next_recommended_topic(
    learner_id: str = Query("default_learner", description="Learner ID"),
    db: Session = Depends(get_db),
):
    """Recommends the next study topic based on syllabus sequence and mastery status."""
    agent = LearningPathAgent(db=db)
    result = agent.run({"intent": "next_topic", "learner_id": learner_id})
    rec = result.get("output")

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
    """Fetches comprehensive mastery dashboard metrics for the student."""
    tool = ProgressTrackerTool(db=db)
    dashboard = tool.get_mastery_dashboard(learner_id=learner_id)

    return ResponseEnvelope[MasteryDashboardResponse](
        success=True,
        data=dashboard,
    )
