from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ExamUnitSetupItem(BaseModel):
    unit_label: str
    topic_id: Optional[str] = None


class ExamSetupRequest(BaseModel):
    learner_id: str = "default_learner"
    subject_name: str
    exam_date: date
    units: List[ExamUnitSetupItem]


class RoadmapDayItem(BaseModel):
    day_number: int
    date: str
    unit_label: str
    topic_id: Optional[str] = None
    topic_title: str
    target_task: Optional[str] = None
    allocated_hours: float
    mastery_score: float
    status: str = "pending"  # pending, in_progress, completed, overdue


class ExamRoadmapResponse(BaseModel):
    exam_id: str
    subject_name: str
    exam_date: str
    days_remaining: int
    total_units: int
    on_track_status: str  # on_track, behind, ahead
    is_repaced: bool
    is_active: bool = True
    schedule: List[RoadmapDayItem]
    entries: List[RoadmapDayItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)



class ExamToggleRequest(BaseModel):
    learner_id: str = "default_learner"
    is_active: bool


class ExamToggleResponse(BaseModel):
    learner_id: str
    exam_id: Optional[str]
    is_active: bool
    message: str
