from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int
    explanation: str
    source_chunk_ids: List[str] = Field(default_factory=list)


class QuizResponse(BaseModel):
    topic_id: str
    topic_title: str = ""
    questions: List[QuizQuestion]

    model_config = ConfigDict(from_attributes=True)


class FlashcardItem(BaseModel):
    front: str
    back: str
    key_concept: Optional[str] = None
    source_chunk_ids: List[str] = Field(default_factory=list)


class FlashcardResponse(BaseModel):
    topic_id: str
    topic_title: str = ""
    flashcards: List[FlashcardItem]

    model_config = ConfigDict(from_attributes=True)


class SummaryResponse(BaseModel):
    topic_id: str
    topic_title: str
    summary_markdown: str
    source_chunk_ids: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProblemGuideStep(BaseModel):
    step_number: int
    title: str
    explanation: str
    reasoning: str


class ProblemGuideResponse(BaseModel):
    topic_id: str
    topic_title: str
    problem_statement: str
    steps: List[ProblemGuideStep]
    final_solution: str
    source_chunk_ids: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class StudyKitGenerateRequest(BaseModel):
    topic_id: str
    kit_type: str = Field("quiz", description="One of: 'quiz', 'flashcards', 'summary', 'problem_guide'")
    count: int = Field(3, description="Number of quiz questions or flashcards to generate")
