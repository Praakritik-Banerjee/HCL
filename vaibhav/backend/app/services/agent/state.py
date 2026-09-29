from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):
    learner_id: str
    intent: str  # "next_topic", "study_kit", "update_progress", "remediation", "exam_roadmap"
    topic_id: Optional[str]
    kit_type: Optional[str]  # "quiz", "flashcards", "summary", "problem_guide"
    score: Optional[float]
    count: Optional[int]
    exam_id: Optional[str]
    messages: List[Dict[str, str]]
    output: Any
    error: Optional[str]
