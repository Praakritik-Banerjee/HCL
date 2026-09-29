from typing import Any, Union
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ResponseEnvelope
from app.schemas.study_kit import (
    StudyKitGenerateRequest,
    QuizResponse,
    FlashcardResponse,
    SummaryResponse,
    ProblemGuideResponse,
)
from app.services.agent.graph import LearningPathAgent

router = APIRouter()


@router.post("/generate", response_model=ResponseEnvelope[Any])
def generate_study_kit(
    request: StudyKitGenerateRequest,
    db: Session = Depends(get_db),
):
    """Generates grounded quizzes, flashcards, summaries, or problem guides for a specific topic."""
    agent = LearningPathAgent(db=db)
    result = agent.run({
        "intent": "study_kit",
        "topic_id": request.topic_id,
        "kit_type": request.kit_type.lower(),
        "count": request.count,
    })

    kit_output = result.get("output")

    return ResponseEnvelope[Any](
        success=True,
        data=kit_output,
        message=f"Generated {request.kit_type} successfully.",
    )
