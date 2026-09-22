import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    learner_id = Column(String(64), nullable=False, default="default_learner", index=True)
    subject_name = Column(String(255), nullable=False)
    exam_date = Column(Date, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    units = relationship("ExamUnit", back_populates="exam", cascade="all, delete-orphan", order_by="ExamUnit.target_completion_date")


class ExamUnit(Base):
    __tablename__ = "exam_units"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    unit_label = Column(String(255), nullable=False)
    target_completion_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="units")
    topic = relationship("Topic")
