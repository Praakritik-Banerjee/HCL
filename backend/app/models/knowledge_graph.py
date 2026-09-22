import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped
from app.db.base import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    unit_label = Column(String(100), nullable=True)  # e.g., "Unit 1", "Module 3"
    level = Column(Integer, nullable=False, default=1)  # 1: Unit/Top-level, 2: Chapter/Subtopic, 3: Concept
    order_index = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    mastery_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="topics")
    parent = relationship("Topic", remote_side=[id], back_populates="children")
    children = relationship("Topic", back_populates="parent", cascade="all, delete-orphan", order_by="Topic.order_index")
    chunks = relationship("TopicChunk", back_populates="topic", cascade="all, delete-orphan")


class TopicChunk(Base):
    __tablename__ = "topic_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False, default=0)
    vector_id = Column(String(128), nullable=False, unique=True, index=True)  # ID in ChromaDB
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False, default=0)
    heading_path = Column(String(512), nullable=True)  # e.g., "Unit 1 > Chapter 2 > Concept A"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
    topic = relationship("Topic", back_populates="chunks")
