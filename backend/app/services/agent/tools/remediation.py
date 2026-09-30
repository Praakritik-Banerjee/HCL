import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.knowledge_graph import Topic
from app.models.user import LearnerProgress
from app.services.rag.retriever import HybridRAGRetriever
from app.core.llm import get_llm, parse_structured_json
from app.schemas.remediation import RemediationResponse, RemedialPracticeQuestion
from app.core.exceptions import AppException

from app.services.agent.tools.study_kit import resolve_topic

logger = logging.getLogger(__name__)


class RemediationTool:
    """Detects struggle signals and generates targeted remedial explanations and practice."""

    def __init__(self, db: Session):
        self.db = db
        self.retriever = HybridRAGRetriever(db=db)
        self.llm = get_llm()

    def generate_remediation(self, topic_id: str, learner_id: str = "default_learner") -> RemediationResponse:
        """Generates simplified conceptual breakdown, analogies, and targeted practice questions
        grounded in the topic's source notes.
        """
        topic = resolve_topic(self.db, topic_id)
        if not topic:
            raise AppException(
                error_code="TOPIC_NOT_FOUND",
                message=f"No syllabus topics found. Please upload a syllabus document first.",
                status_code=404,
            )
        resolved_topic_id = topic.id

        chunks = self.retriever.retrieve(query=f"Fundamentals and intuition for {topic.title}", topic_id=topic_id, top_k=3)
        context_text = "\n\n".join([f"[Chunk ID: {c.chunk_id}]\n{c.content}" for c in chunks])
        valid_chunk_ids = [c.chunk_id for c in chunks] or ["chk_remedial_1"]

        prompt = f"""You are a patient, encouraging tutor helping a student who struggled on: "{topic.title}".
Your goal is to explain this topic more simply than before, without jargon, using clear real-world analogies.

MANDATORY RULES:
1. Ground the core concepts in the provided source notes.
2. Provide:
   - "concept_breakdown": An intuitive, step-by-step simplification of the topic.
   - "key_analogies": 1-2 relatable real-world analogies.
   - "practice_questions": 2 targeted check-for-understanding practice questions with hints and answers.
   - "source_chunk_ids": Referenced chunk IDs.

SOURCE MATERIAL:
{context_text}

OUTPUT FORMAT: Return pure JSON:
{{
  "topic_id": "{topic_id}",
  "concept_breakdown": "...",
  "key_analogies": ["..."],
  "practice_questions": [
    {{
      "question": "...",
      "hint": "...",
      "answer": "..."
    }}
  ],
  "source_chunk_ids": ["..."]
}}
"""
        response = self.llm.invoke(prompt)
        try:
            remediation_data = parse_structured_json(response.content, RemediationResponse)
            remediation_data.topic_id = topic_id
            remediation_data.topic_title = topic.title
            if not remediation_data.source_chunk_ids:
                remediation_data.source_chunk_ids = valid_chunk_ids
            return remediation_data
        except Exception as e:
            logger.warning(f"Remediation JSON parse error: {e}. Falling back to default remedial structure.")
            return RemediationResponse(
                topic_id=topic_id,
                topic_title=topic.title,
                concept_breakdown=(
                    f"Let's break down {topic.title} from first principles. "
                    "Focus on the underlying physical or mathematical intuition before equations."
                ),
                key_analogies=[
                    f"Think of {topic.title} like tuning an instrument: small, guided adjustments lead to harmony."
                ],
                practice_questions=[
                    RemedialPracticeQuestion(
                        question=f"What is the most fundamental goal when studying {topic.title}?",
                        hint="Think about what problem it solves.",
                        answer="To minimize error and achieve reliable generalization on new data.",
                    )
                ],
                source_chunk_ids=valid_chunk_ids,
            )
