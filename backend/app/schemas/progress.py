from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class NextTopicResponse(BaseModel):
    topic_id: str
    title: str
    unit_label: Optional[str] = None
    level: int = 1
    order_index: int = 0
    mastery_score: float = 0.0
    reason: str

    model_config = ConfigDict(from_attributes=True)


class ProgressUpdateRequest(BaseModel):
    learner_id: str = "default_learner"
    topic_id: str
    score: float = Field(..., ge=0.0, le=1.0, description="Quiz attempt score between 0.0 and 1.0")


class ProgressUpdateResponse(BaseModel):
    learner_id: str
    topic_id: str
    new_mastery_score: float
    attempts_count: int
    consecutive_low_scores: int
    remediation_triggered: bool
    message: str

    model_config = ConfigDict(from_attributes=True)


class TopicMasteryItem(BaseModel):
    topic_id: str
    title: str
    unit_label: Optional[str] = None
    level: int = 1
    mastery_score: float = 0.0
    status: str = "not_started"  # not_started, in_progress, mastered, struggling

    model_config = ConfigDict(from_attributes=True)


class MasteryDashboardResponse(BaseModel):
    learner_id: str
    overall_mastery: float
    total_topics: int
    mastered_topics: int
    in_progress_topics: int
    struggling_topics: int
    topics: List[TopicMasteryItem]

    model_config = ConfigDict(from_attributes=True)
