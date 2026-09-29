from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class DocumentBase(BaseModel):
    filename: str
    file_type: str
    page_count: int = 1


class DocumentCreate(DocumentBase):
    file_hash: str
    file_size_bytes: int
    raw_text: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: str
    file_hash: str
    file_size_bytes: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResult(BaseModel):
    document_id: str
    filename: str
    file_type: str
    page_count: int
    total_topics: int
    total_subtopics: int
    total_chunks: int
    status: str
    message: str
