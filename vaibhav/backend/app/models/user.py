import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class LearnerProgress(Base):
    __tablename__ = "learner_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String(64), nullable=False, default="default_learner", index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    attempts_count = Column(Integer, nullable=False, default=0)
    consecutive_low_scores = Column(Integer, nullable=False, default=0)
    remediation_triggered = Column(Boolean, nullable=False, default=False)
    last_studied_at = Column(DateTime, default=datetime.utcnow, nullable=False)
