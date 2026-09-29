from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.exam import Exam
from app.schemas.common import ResponseEnvelope
from app.schemas.exam_mode import (
    ExamSetupRequest,
    ExamRoadmapResponse,
    ExamToggleRequest,
    ExamToggleResponse,
)
from app.services.agent.tools.exam_roadmap import ExamRoadmapGeneratorTool
from app.core.exceptions import AppException

router = APIRouter()


@router.post("/setup", response_model=ResponseEnvelope[ExamRoadmapResponse])
def setup_exam(
    request: ExamSetupRequest,
    db: Session = Depends(get_db),
):
    """Sets up or updates exam details (subject, date, units) and generates a paced roadmap."""
    tool = ExamRoadmapGeneratorTool(db=db)
    roadmap = tool.setup_exam(request=request)

    return ResponseEnvelope[ExamRoadmapResponse](
        success=True,
        data=roadmap,
        message=f"Exam roadmap for '{request.subject_name}' generated successfully. {roadmap.days_remaining} days remaining.",
    )


@router.get("/roadmap", response_model=ResponseEnvelope[ExamRoadmapResponse])
def get_current_roadmap(
    learner_id: str = Query("default_learner", description="Learner ID"),
    exam_id: str = Query(None, description="Optional specific exam ID"),
    db: Session = Depends(get_db),
):
    """Fetches the current active day-by-day exam roadmap for the student."""
    tool = ExamRoadmapGeneratorTool(db=db)

    # Locate active exam for learner
    query = db.query(Exam).filter(Exam.learner_id == learner_id)
    if exam_id:
        query = query.filter(Exam.id == exam_id)
    else:
        query = query.filter(Exam.is_active == True).order_by(Exam.created_at.desc())

    active_exam = query.first()
    if not active_exam:
        raise AppException(
            error_code="NO_ACTIVE_EXAM",
            message="No active exam found for this learner. Use /api/v1/exam-mode/setup to configure one.",
            status_code=404,
        )

    roadmap = tool.generate_roadmap(exam_id=active_exam.id, learner_id=learner_id)

    return ResponseEnvelope[ExamRoadmapResponse](
        success=True,
        data=roadmap,
    )


@router.patch("/toggle", response_model=ResponseEnvelope[ExamToggleResponse])
def toggle_exam_mode(
    request: ExamToggleRequest,
    db: Session = Depends(get_db),
):
    """Toggles Exam Mode on/off without deleting exam configurations or progress."""
    tool = ExamRoadmapGeneratorTool(db=db)
    toggle_result = tool.toggle_exam_mode(learner_id=request.learner_id, is_active=request.is_active)

    return ResponseEnvelope[ExamToggleResponse](
        success=True,
        data=toggle_result,
        message=toggle_result.message,
    )
