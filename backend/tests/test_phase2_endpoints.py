from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.models.document import Document
from app.models.knowledge_graph import Topic, TopicChunk

# Dedicated test engine for Phase 2 endpoint tests
_p2_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=_p2_engine)
_P2Session = sessionmaker(autocommit=False, autoflush=False, bind=_p2_engine)

# Seed once at module load
_seed_db = _P2Session()
_seed_db.add(Document(id="doc_p2", filename="test_notes.pdf", file_type="pdf", file_hash="hash_p2", raw_text="Notes"))
_seed_db.add(Topic(id="top_p2_1", document_id="doc_p2", title="Machine Learning Basics", unit_label="Unit 1", level=1, order_index=1))
_seed_db.add(Topic(id="top_p2_2", document_id="doc_p2", title="Deep Learning Models", unit_label="Unit 2", level=1, order_index=2))
_seed_db.add(TopicChunk(
    id="chk_p2_1", topic_id="top_p2_1", document_id="doc_p2",
    chunk_index=0, vector_id="vec_p2_1",
    content="Supervised regression models minimize mean squared error.",
    token_count=80, heading_path="Unit 1 > ML Basics",
))
_seed_db.commit()
_seed_db.close()


def _override_get_db():
    db = _P2Session()
    try:
        yield db
    finally:
        db.close()


# Import app AFTER defining override so we can apply it
from app.main import app
app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)


def test_next_topic_endpoint():
    resp = client.get("/api/v1/progress/next-topic?learner_id=student_1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["topic_id"] == "top_p2_1"


def test_progress_update_and_mastery_dashboard_endpoints():
    # Update progress with quiz attempt
    update_resp = client.post(
        "/api/v1/progress/update",
        json={"learner_id": "student_1", "topic_id": "top_p2_1", "score": 0.85},
    )
    assert update_resp.status_code == 200
    up_data = update_resp.json()
    assert up_data["success"] is True
    assert up_data["data"]["new_mastery_score"] > 0

    # Query mastery dashboard
    dash_resp = client.get("/api/v1/progress/mastery?learner_id=student_1")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["success"] is True
    assert dash_data["data"]["total_topics"] >= 2


def test_study_kit_generate_endpoint():
    # 1. Quiz
    quiz_resp = client.post(
        "/api/v1/study-kit/generate",
        json={"topic_id": "top_p2_1", "kit_type": "quiz", "count": 2},
    )
    assert quiz_resp.status_code == 200
    quiz_data = quiz_resp.json()
    assert quiz_data["success"] is True
    assert len(quiz_data["data"]["questions"]) >= 1

    # 2. Flashcards
    fc_resp = client.post(
        "/api/v1/study-kit/generate",
        json={"topic_id": "top_p2_1", "kit_type": "flashcards", "count": 2},
    )
    assert fc_resp.status_code == 200
    fc_data = fc_resp.json()
    assert fc_data["success"] is True
    assert len(fc_data["data"]["flashcards"]) >= 1


def test_remediation_endpoint():
    remed_resp = client.post(
        "/api/v1/remediation/trigger",
        json={"learner_id": "student_1", "topic_id": "top_p2_1"},
    )
    assert remed_resp.status_code == 200
    remed_data = remed_resp.json()
    assert remed_data["success"] is True
    assert "concept_breakdown" in remed_data["data"]
    assert len(remed_data["data"]["practice_questions"]) >= 1


def test_exam_mode_endpoints():
    exam_date = str(date.today() + timedelta(days=21))

    # 1. Setup Exam
    setup_resp = client.post(
        "/api/v1/exam-mode/setup",
        json={
            "learner_id": "student_exam",
            "subject_name": "CS 480 Final Exam",
            "exam_date": exam_date,
            "units": [
                {"unit_label": "Unit 1: ML Basics", "topic_id": "top_p2_1"},
                {"unit_label": "Unit 2: Deep Learning", "topic_id": "top_p2_2"},
            ],
        },
    )
    assert setup_resp.status_code == 200
    setup_data = setup_resp.json()
    assert setup_data["success"] is True
    assert setup_data["data"]["days_remaining"] == 21
    assert len(setup_data["data"]["schedule"]) > 0

    # 2. Fetch Active Roadmap
    road_resp = client.get("/api/v1/exam-mode/roadmap?learner_id=student_exam")
    assert road_resp.status_code == 200
    road_data = road_resp.json()
    assert road_data["success"] is True
    assert road_data["data"]["subject_name"] == "CS 480 Final Exam"

    # 3. Toggle Exam Mode off
    toggle_resp = client.patch(
        "/api/v1/exam-mode/toggle",
        json={"learner_id": "student_exam", "is_active": False},
    )
    assert toggle_resp.status_code == 200
    toggle_data = toggle_resp.json()
    assert toggle_data["success"] is True
    assert toggle_data["data"]["is_active"] is False
