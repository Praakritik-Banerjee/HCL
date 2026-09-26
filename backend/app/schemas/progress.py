from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class NextTopicResponse(BaseModel):
    topic_id: str
    title: str
    topic_title: Optional[str] = None
    unit_label: Optional[str] = None
    level: int = 1
    order_index: int = 0
    mastery_score: float = 0.0
    current_mastery: float = 0.0
    reason: str
    description: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProgressUpdateRequest(BaseModel):
    learner_id: str = "default_learner"
    topic_id: str
    score: float = Field(..., ge=0.0, le=1.0, description="Quiz attempt score between 0.0 and 1.0")


class ProgressUpdateResponse(BaseModel):
    learner_id: str
    topic_id: str
    new_mastery_score: float
    new_mastery: float = 0.0
    attempts_count: int
    consecutive_low_scores: int
    remediation_triggered: bool
    struggle_detected: bool = False
    message: str

    model_config = ConfigDict(from_attributes=True)


class TopicMasteryItem(BaseModel):
    topic_id: str
    title: str
    topic_title: str = ""
    unit_label: Optional[str] = None
    level: int = 1
    mastery_score: float = 0.0
    status: str = "not_started"  # not_started, in_progress, mastered, struggling
    attempts: int = 0

    model_config = ConfigDict(from_attributes=True)


class MasteryDashboardResponse(BaseModel):
    learner_id: str
    overall_mastery: float
    total_topics: int
    mastered_topics: int
    in_progress_topics: int
    struggling_topics: int
    struggling_topics_count: int = 0
    topics: List[TopicMasteryItem]

    model_config = ConfigDict(from_attributes=True)

