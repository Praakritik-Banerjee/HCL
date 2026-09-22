from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RemedialPracticeQuestion(BaseModel):
    question: str
    hint: str
    answer: str


class RemediationResponse(BaseModel):
    topic_id: str
    topic_title: str
    concept_breakdown: str
    key_analogies: List[str]
    practice_questions: List[RemedialPracticeQuestion]
    source_chunk_ids: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class RemediationTriggerRequest(BaseModel):
    learner_id: str = "default_learner"
    topic_id: str
