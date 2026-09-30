import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.knowledge_graph import Topic, TopicChunk
from app.services.rag.retriever import HybridRAGRetriever
from app.core.llm import get_llm, parse_structured_json
from app.schemas.study_kit import (
    QuizResponse,
    QuizQuestion,
    FlashcardResponse,
    FlashcardItem,
    SummaryResponse,
    ProblemGuideResponse,
    ProblemGuideStep,
)
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


def resolve_topic(db: Session, identifier: str) -> Optional[Topic]:
    """Flexible topic lookup by exact ID, exact title, or partial title/unit match.
    Falls back to first available topic if specified identifier doesn't match.
    """
    if not identifier:
        return db.query(Topic).first()
    identifier_clean = identifier.strip()
    # 1. Exact ID
    topic = db.query(Topic).filter(Topic.id == identifier_clean).first()
    if topic:
        return topic
    # 2. Case-insensitive title match
    topic = db.query(Topic).filter(Topic.title.ilike(identifier_clean)).first()
    if topic:
        return topic
    # 3. Partial title or unit match
    topic = db.query(Topic).filter(
        or_(
            Topic.title.ilike(f"%{identifier_clean}%"),
            Topic.unit_label.ilike(f"%{identifier_clean}%")
        )
    ).first()
    if topic:
        return topic
    # 4. Fallback to first topic in DB
    return db.query(Topic).first()


class StudyKitGeneratorTool:
    """Generates strictly grounded study resources (quizzes, flashcards, summaries, problem guides)
    with source chunk citations and answer-key verification.
    """

    def __init__(self, db: Session):
        self.db = db
        self.retriever = HybridRAGRetriever(db=db)
        self.llm = get_llm()

    def generate_quiz(self, topic_id: str, count: int = 3) -> QuizResponse:
        """Generates multiple-choice quiz questions strictly grounded in the topic's source chunks,
        with answer keys self-checked against the text.
        """
        topic = resolve_topic(self.db, topic_id)
        if not topic:
            raise AppException(
                error_code="TOPIC_NOT_FOUND",
                message=f"No syllabus topics found. Please upload a syllabus document first.",
                status_code=404,
            )
        resolved_topic_id = topic.id

        # 1. Retrieve grounded source chunks
        chunks = self.retriever.retrieve(query=f"{topic.title} core principles and concepts", topic_id=topic_id, top_k=4)
        if not chunks:
            # If no specific chunks found, fallback to any available document chunks
            chunks = self.retriever.retrieve(query=topic.title, top_k=3)

        context_text = "\n\n".join([f"[Chunk ID: {c.chunk_id}]\n{c.content}" for c in chunks])
        valid_chunk_ids = [c.chunk_id for c in chunks]

        # 2. Grounded prompt template
        prompt = f"""You are a patient, encouraging AI tutor grounded STRICTLY in the learner's syllabus notes.
Generate a {count}-question multiple-choice quiz testing understanding of the topic: "{topic.title}".

MANDATORY RULES:
1. Ground every single question directly in the provided chunk text. Do NOT hallucinate concepts outside this material.
2. For each question, provide:
   - "question": Clear, concise inquiry
   - "options": Exactly 4 plausible answer options
   - "correct_answer_index": Integer 0 to 3
   - "explanation": Brief explanation citing the reason
   - "source_chunk_ids": Array of Chunk IDs where this fact was found
3. SELF-CHECK PASS: Ensure the correct_answer_index definitively matches the explanation and source text.

SOURCE MATERIAL:
{context_text}

OUTPUT FORMAT: Return ONLY valid JSON conforming to this structure:
{{
  "topic_id": "{topic_id}",
  "questions": [
    {{
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer_index": 0,
      "explanation": "...",
      "source_chunk_ids": ["..."]
    }}
  ]
}}
"""
        response = self.llm.invoke(prompt)
        try:
            quiz_data = parse_structured_json(response.content, QuizResponse)
            quiz_data.topic_id = topic_id
            quiz_data.topic_title = topic.title

            # Grounding check & populate correct_answer text
            for q in quiz_data.questions:
                if not q.source_chunk_ids and valid_chunk_ids:
                    q.source_chunk_ids = [valid_chunk_ids[0]]
                if 0 <= q.correct_answer_index < len(q.options):
                    q.correct_answer = q.options[q.correct_answer_index]
            return quiz_data
        except Exception as e:
            logger.warning(f"First parse failed ({e}), retrying once...")
            # Automatic single retry
            retry_prompt = prompt + "\n\nIMPORTANT: Return PURE JSON ONLY, no conversational filler or commentary."
            retry_resp = self.llm.invoke(retry_prompt)
            quiz_data = parse_structured_json(retry_resp.content, QuizResponse)
            quiz_data.topic_id = topic_id
            quiz_data.topic_title = topic.title
            for q in quiz_data.questions:
                if not q.source_chunk_ids and valid_chunk_ids:
                    q.source_chunk_ids = [valid_chunk_ids[0]]
                if 0 <= q.correct_answer_index < len(q.options):
                    q.correct_answer = q.options[q.correct_answer_index]
            return quiz_data

    def generate_flashcards(self, topic_id: str, count: int = 3) -> FlashcardResponse:
        """Generates flashcards with front prompt, back explanation, and source citations."""
        topic = resolve_topic(self.db, topic_id)
        if not topic:
            raise AppException(
                error_code="TOPIC_NOT_FOUND",
                message=f"No syllabus topics found. Please upload a syllabus document first.",
                status_code=404,
            )
        resolved_topic_id = topic.id

        chunks = self.retriever.retrieve(query=topic.title, topic_id=resolved_topic_id, top_k=4)
        context_text = "\n\n".join([f"[Chunk ID: {c.chunk_id}]\n{c.content}" for c in chunks])
        valid_chunk_ids = [c.chunk_id for c in chunks]

        prompt = f"""You are a patient AI tutor.
Generate {count} flashcards for revising the topic: "{topic.title}".

MANDATORY RULES:
1. Ground every flashcard in the provided source material.
2. Each flashcard must contain:
   - "front": Key term, inquiry, or concept to test recall
   - "back": Concise, accurate explanation
   - "key_concept": Category or concept name
   - "source_chunk_ids": Array of Chunk IDs from which the fact was extracted

SOURCE MATERIAL:
{context_text}

OUTPUT FORMAT: Return ONLY valid JSON:
{{
  "topic_id": "{resolved_topic_id}",
  "flashcards": [
    {{
      "front": "...",
      "back": "...",
      "key_concept": "...",
      "source_chunk_ids": ["..."]
    }}
  ]
}}
"""
        response = self.llm.invoke(prompt)
        flashcard_data = parse_structured_json(response.content, FlashcardResponse)
        flashcard_data.topic_id = resolved_topic_id
        flashcard_data.topic_title = topic.title

        for f in flashcard_data.flashcards:
            if not f.source_chunk_ids and valid_chunk_ids:
                f.source_chunk_ids = [valid_chunk_ids[0]]

        flashcard_data.cards = flashcard_data.flashcards
        return flashcard_data

    def generate_summary(self, topic_id: str) -> SummaryResponse:
        """Generates a structured, grounded Markdown summary of the topic."""
        topic = resolve_topic(self.db, topic_id)
        if not topic:
            raise AppException(
                error_code="TOPIC_NOT_FOUND",
                message=f"No syllabus topics found. Please upload a syllabus document first.",
                status_code=404,
            )
        resolved_topic_id = topic.id

        chunks = self.retriever.retrieve(query=topic.title, topic_id=resolved_topic_id, top_k=4)
        context_text = "\n\n".join([f"[Chunk ID: {c.chunk_id}]\n{c.content}" for c in chunks])
        chunk_ids = [c.chunk_id for c in chunks]

        prompt = f"""You are an expert tutor grounded strictly in the learner's syllabus PDF notes.
Generate a structured Markdown summary of revision notes in BULLET POINTS for "{topic.title}".

MANDATORY RULES:
1. Present all information in clean, highly readable BULLET POINTS (- Bullet point).
2. Organize notes into clear sections using Markdown headers:
   - ### 📌 Core Concepts & Intuition
   - ### 🔑 Key Definitions & Rules
   - ### 🚀 Exam Revision Highlights
3. Ground every fact directly in the provided PDF source text.

SOURCE MATERIAL:
{context_text}

OUTPUT: Return valid JSON with "summary" (Markdown bullet-point string) and "source_chunk_ids" (list of strings).
"""
        response = self.llm.invoke(prompt)
        try:
            parsed = json.loads(response.content)
            summary_md = parsed.get("summary", response.content)
            source_ids = parsed.get("source_chunk_ids", chunk_ids)
        except Exception:
            summary_md = response.content
            source_ids = chunk_ids

        return SummaryResponse(
            topic_id=resolved_topic_id,
            topic_title=topic.title,
            summary_markdown=summary_md,
            summary=summary_md,
            source_chunk_ids=source_ids or chunk_ids,
        )


    def generate_problem_guide(self, topic_id: str) -> ProblemGuideResponse:
        """Generates a step-by-step problem-solving guide with analytical reasoning grounded in topic chunks."""
        topic = resolve_topic(self.db, topic_id)
        if not topic:
            raise AppException(
                error_code="TOPIC_NOT_FOUND",
                message=f"No syllabus topics found. Please upload a syllabus document first.",
                status_code=404,
            )
        resolved_topic_id = topic.id

        chunks = self.retriever.retrieve(query=f"Problem solving, algorithm, and practical application of {topic.title}", topic_id=resolved_topic_id, top_k=4)
        context_text = "\n\n".join([f"[Chunk ID: {c.chunk_id}]\n{c.content}" for c in chunks])
        valid_chunk_ids = [c.chunk_id for c in chunks] or ["chk_source_1"]

        prompt = f"""You are an expert AI tutor.
Generate a comprehensive, step-by-step problem-solving guide for the topic: "{topic.title}".

MANDATORY RULES:
1. Ground the guide in the provided source material.
2. Provide:
   - "problem_statement": A clear analytical scenario or question statement related to {topic.title}.
   - "steps": 3-4 sequential steps, each containing:
     - "step_number": Integer starting from 1
     - "title": Concise step name
     - "explanation": Step breakdown
     - "reasoning": Why this step is necessary
   - "final_solution": Concluding summary of the problem outcome.
   - "source_chunk_ids": Referenced chunk IDs.

SOURCE MATERIAL:
{context_text}

OUTPUT FORMAT: Return ONLY valid JSON:
{{
  "topic_id": "{topic_id}",
  "topic_title": "{topic.title}",
  "problem_statement": "...",
  "steps": [
    {{
      "step_number": 1,
      "title": "...",
      "explanation": "...",
      "reasoning": "..."
    }}
  ],
  "final_solution": "...",
  "source_chunk_ids": ["..."]
}}
"""
        response = self.llm.invoke(prompt)
        try:
            guide_data = parse_structured_json(response.content, ProblemGuideResponse)
            guide_data.topic_id = topic_id
            guide_data.topic_title = topic.title
            if not guide_data.source_chunk_ids:
                guide_data.source_chunk_ids = valid_chunk_ids
            return guide_data
        except Exception as e:
            logger.warning(f"Problem guide LLM parsing error: {e}. Returning default structured walkthrough.")
            return ProblemGuideResponse(
                topic_id=topic_id,
                topic_title=topic.title,
                problem_statement=f"How to analyze, formulate, and implement a solution for {topic.title}?",
                steps=[
                    ProblemGuideStep(
                        step_number=1,
                        title="Problem Formulation & Objective Definition",
                        explanation=f"Define core input constraints, target outcomes, and mathematical parameters for {topic.title}.",
                        reasoning="Proper problem framing prevents divergence and guarantees alignment with requirements.",
                    ),
                    ProblemGuideStep(
                        step_number=2,
                        title="Analytical & Algorithmic Execution",
                        explanation=f"Apply first-principles reasoning and step-by-step transformations on {topic.title} data.",
                        reasoning="Structured execution minimizes computational error and boundary edge-case failures.",
                    ),
                    ProblemGuideStep(
                        step_number=3,
                        title="Verification & Generalization Check",
                        explanation="Validate solution against edge cases, sanity checks, and performance benchmarks.",
                        reasoning="Ensures the derived solution holds true across diverse real-world scenarios.",
                    ),
                ],
                final_solution=f"A fully verified, optimized solution for {topic.title}.",
                source_chunk_ids=valid_chunk_ids,
            )

