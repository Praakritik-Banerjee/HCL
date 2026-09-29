from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class TopicChunkResponse(BaseModel):
    id: str
    topic_id: Optional[str]
    chunk_index: int
    vector_id: str
    token_count: int
    heading_path: Optional[str]
    content: str

    model_config = ConfigDict(from_attributes=True)


class TopicBase(BaseModel):
    title: str
    unit_label: Optional[str] = None
    level: int = 1
    order_index: int = 0
    description: Optional[str] = None
    mastery_score: float = 0.0
    metadata_json: Optional[Dict[str, Any]] = None


class TopicCreate(TopicBase):
    document_id: str
    parent_id: Optional[str] = None


class TopicNode(TopicBase):
    id: str
    document_id: str
    parent_id: Optional[str] = None
    chunk_count: int = 0
    children: List["TopicNode"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TopicGraphResponse(BaseModel):
    document_id: str
    document_title: str
    total_nodes: int
    max_depth: int
    topics: List[TopicNode]


# Resolve recursive model reference for children
TopicNode.model_rebuild()
