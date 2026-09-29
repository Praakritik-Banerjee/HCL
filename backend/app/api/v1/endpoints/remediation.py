from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ResponseEnvelope
from app.schemas.remediation import RemediationResponse, RemediationTriggerRequest
from app.services.agent.graph import LearningPathAgent

router = APIRouter()


@router.post("/trigger", response_model=ResponseEnvelope[RemediationResponse])
def trigger_remediation(
    request: RemediationTriggerRequest,
    db: Session = Depends(get_db),
):
    """Triggers targeted remedial breakdown and practice for a struggling topic."""
    agent = LearningPathAgent(db=db)
    result = agent.run({
        "intent": "remediation",
        "topic_id": request.topic_id,
        "learner_id": request.learner_id,
    })

    output = result.get("output")

    return ResponseEnvelope[RemediationResponse](
        success=True,
        data=output,
        message="Targeted remediation package generated successfully.",
    )
