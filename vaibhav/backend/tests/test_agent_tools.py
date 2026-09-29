import time
from datetime import date, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.document import Document
from app.models.knowledge_graph import Topic, TopicChunk
from app.models.user import LearnerProgress
from app.services.agent.tools.progress_tracker import ProgressTrackerTool
from app.services.agent.tools.study_kit import StudyKitGeneratorTool
from app.services.agent.tools.remediation import RemediationTool
from app.services.agent.tools.exam_roadmap import ExamRoadmapGeneratorTool
from app.schemas.exam_mode import ExamSetupRequest, ExamUnitSetupItem


@pytest.fixture
def db_session():
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()

    # Pre-seed a document, topics, and chunks for tool testing
    doc = Document(
        id="doc_test_1",
        filename="ai_syllabus.pdf",
        file_type="pdf",
        file_hash="hash123",
        raw_text="AI and ML Syllabus Content",
    )
    session.add(doc)

    t1 = Topic(id="top_1", document_id="doc_test_1", title="Supervised Learning", unit_label="Unit 1", level=1, order_index=1)
    t2 = Topic(id="top_2", document_id="doc_test_1", title="Neural Networks", unit_label="Unit 2", level=1, order_index=2)
    t3 = Topic(id="top_3", document_id="doc_test_1", title="Reinforcement Learning", unit_label="Unit 3", level=1, order_index=3)
    session.add_all([t1, t2, t3])

    c1 = TopicChunk(
        id="chk_rec_1",
        topic_id="top_1",
        document_id="doc_test_1",
        chunk_index=0,
        vector_id="chk_chunk_1",
        content="Supervised learning uses labeled training pairs to optimize loss functions via gradient descent.",
        token_count=120,
        heading_path="Unit 1 > Supervised Learning",
    )
    session.add(c1)
    session.commit()

    yield session
    session.close()


def test_progress_tracker_next_topic_latency_and_mastery(db_session):
    tool = ProgressTrackerTool(db=db_session)

    # Acceptance Criteria: Returned in under 2 seconds
    start_time = time.time()
    rec = tool.recommend_next_topic(learner_id="test_student")
    elapsed = time.time() - start_time

    assert elapsed < 2.0
    assert rec.topic_id == "top_1"
    assert rec.title == "Supervised Learning"

    # Mark top_1 as fully mastered (score = 0.95)
    tool.record_attempt(learner_id="test_student", topic_id="top_1", score=0.95)

    # Acceptance Criteria: Never recommends an already-mastered topic
    rec2 = tool.recommend_next_topic(learner_id="test_student")
    assert rec2.topic_id != "top_1"
    assert rec2.topic_id == "top_2"


def test_remediation_trigger_on_two_consecutive_low_scores(db_session):
    tool = ProgressTrackerTool(db=db_session)

    # Attempt 1: 50% (< 60%) -> first low score
    res1 = tool.record_attempt(learner_id="struggling_learner", topic_id="top_2", score=0.50)
    assert res1["consecutive_low_scores"] == 1
    assert res1["remediation_triggered"] is False

    # Attempt 2: 45% (< 60%) -> two consecutive low scores
    res2 = tool.record_attempt(learner_id="struggling_learner", topic_id="top_2", score=0.45)
    assert res2["consecutive_low_scores"] == 2
    # Acceptance Criteria: Two consecutive sub-60% scores must trigger remediation
    assert res2["remediation_triggered"] is True

    # Progress tracker should now prioritize recommending this struggling topic for remediation
    rec = tool.recommend_next_topic(learner_id="struggling_learner")
    assert rec.topic_id == "top_2"
    assert "remediation" in rec.reason.lower()


def test_study_kit_grounding_and_citations(db_session):
    kit_tool = StudyKitGeneratorTool(db=db_session)

    # Acceptance Criteria: Every question grounded in ingested content and traceable to a source chunk
    quiz = kit_tool.generate_quiz(topic_id="top_1", count=2)
    assert quiz.topic_id == "top_1"
    assert len(quiz.questions) >= 1

    for q in quiz.questions:
        assert len(q.options) == 4
        assert 0 <= q.correct_answer_index < 4
        assert len(q.source_chunk_ids) > 0

    # Test flashcards citations
    fc = kit_tool.generate_flashcards(topic_id="top_1", count=2)
    assert len(fc.flashcards) >= 1
    for card in fc.flashcards:
        assert len(card.front) > 0
        assert len(card.back) > 0
        assert len(card.source_chunk_ids) > 0


def test_exam_roadmap_deadlines_weighting_and_repacing(db_session):
    exam_tool = ExamRoadmapGeneratorTool(db=db_session)
    today = date.today()
    target_exam_date = today + timedelta(days=14)

    # Mark top_1 as mastered (0.90) and top_3 as weak (0.30)
    db_session.add(LearnerProgress(learner_id="exam_student", topic_id="top_1", mastery_score=0.90, attempts_count=3))
    db_session.add(LearnerProgress(learner_id="exam_student", topic_id="top_3", mastery_score=0.30, attempts_count=2))
    db_session.commit()

    request = ExamSetupRequest(
        learner_id="exam_student",
        subject_name="Artificial Intelligence Midterm",
        exam_date=target_exam_date,
        units=[
            ExamUnitSetupItem(unit_label="Unit 1: Supervised Learning", topic_id="top_1"),
            ExamUnitSetupItem(unit_label="Unit 3: Reinforcement Learning", topic_id="top_3"),
        ],
    )

    roadmap = exam_tool.setup_exam(request=request)

    # Acceptance Criteria: 100% scheduled before the exam date (never past it)
    assert roadmap.days_remaining == 14
    assert len(roadmap.schedule) > 0
    for entry in roadmap.schedule:
        entry_date = date.fromisoformat(entry.date)
        assert entry_date < target_exam_date

    # Acceptance Criteria: Weaker topic receives more allocated study hours
    weak_entries = [e for e in roadmap.schedule if e.topic_id == "top_3"]
    strong_entries = [e for e in roadmap.schedule if e.topic_id == "top_1"]
    assert len(weak_entries) > 0 and len(strong_entries) > 0
    assert weak_entries[0].allocated_hours > strong_entries[0].allocated_hours

    # Test Exam Mode Toggle
    toggle_resp = exam_tool.toggle_exam_mode(learner_id="exam_student", is_active=False)
    assert toggle_resp.is_active is False
    # Re-enable
    toggle_resp_2 = exam_tool.toggle_exam_mode(learner_id="exam_student", is_active=True)
    assert toggle_resp_2.is_active is True
