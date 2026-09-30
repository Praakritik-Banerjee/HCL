import os
import shutil
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.document import Document
from app.models.knowledge_graph import Topic, TopicChunk
from app.schemas.common import ResponseEnvelope
from app.schemas.document import DocumentUploadResult, DocumentResponse
from app.schemas.knowledge_graph import TopicGraphResponse, TopicNode
from app.services.ingestion.pipeline import IngestionPipeline
from app.core.exceptions import AppException, ResourceNotFoundException

router = APIRouter()


@router.post("/upload", response_model=ResponseEnvelope[DocumentUploadResult], status_code=status.HTTP_201_CREATED)
async def upload_syllabus(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a syllabus (PDF/DOCX) to build a structured topic knowledge graph and vector index."""
    if not file.filename:
        raise AppException(
            error_code="INVALID_FILE",
            message="No file uploaded or filename is empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    ext = os.path.splitext(file.filename)[1].lower().strip(".")
    if ext not in ["pdf", "docx", "txt"]:
        raise AppException(
            error_code="UNSUPPORTED_FILE_TYPE",
            message=f"Only .pdf, .docx, and .txt files are supported. Received: .{ext}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise AppException(
            error_code="EMPTY_FILE",
            message="Uploaded file is empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        pipeline = IngestionPipeline(db=db)
        result = pipeline.process_file(
            file_bytes=file_bytes,
            filename=file.filename,
            file_type=ext,
        )
        return ResponseEnvelope[DocumentUploadResult](
            success=True,
            data=result,
            message=result.message,
        )
    except AppException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise AppException(
            error_code="INGESTION_ERROR",
            message=f"Failed to process syllabus document: {str(e)}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


@router.get("/documents", response_model=ResponseEnvelope[List[Dict[str, Any]]])
def list_documents(db: Session = Depends(get_db)):
    """List all uploaded syllabus PDF documents with topic counts."""
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    result = []
    for doc in docs:
        topic_count = db.query(Topic).filter(Topic.document_id == doc.id).count()
        result.append({
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "total_topics": topic_count,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        })
    return ResponseEnvelope[List[Dict[str, Any]]](success=True, data=result)


@router.get("/{document_id}/graph", response_model=ResponseEnvelope[TopicGraphResponse])
def get_topic_graph(
    document_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve the full hierarchical knowledge graph for a given document (or 'latest')."""
    if document_id.lower() == "latest":
        doc = db.query(Document).order_by(Document.created_at.desc()).first()
    else:
        doc = db.query(Document).filter(Document.id == document_id).first()

    if not doc:
        raise ResourceNotFoundException(resource="Document", identifier=document_id)

    document_id = doc.id


    # Fetch all topics for this document ordered by order_index
    topics = (
        db.query(Topic)
        .filter(Topic.document_id == document_id)
        .order_by(Topic.level, Topic.order_index)
        .all()
    )

    # Pre-count chunks per topic
    chunk_counts = (
        db.query(TopicChunk.topic_id, func.count(TopicChunk.id))
        .filter(TopicChunk.document_id == document_id)
        .group_by(TopicChunk.topic_id)
        .all()
    )
    chunk_count_map = {topic_id: count for topic_id, count in chunk_counts}

    # Build hierarchical tree
    nodes_by_id: Dict[str, TopicNode] = {}
    root_nodes: List[TopicNode] = []
    max_depth = 1

    for t in topics:
        max_depth = max(max_depth, t.level)
        node = TopicNode(
            id=t.id,
            document_id=t.document_id,
            parent_id=t.parent_id,
            title=t.title,
            unit_label=t.unit_label,
            level=t.level,
            order_index=t.order_index,
            description=t.description,
            mastery_score=t.mastery_score,
            chunk_count=chunk_count_map.get(t.id, 0),
            children=[],
        )
        nodes_by_id[t.id] = node

    for t in topics:
        node = nodes_by_id[t.id]
        if t.parent_id and t.parent_id in nodes_by_id:
            nodes_by_id[t.parent_id].children.append(node)
        else:
            root_nodes.append(node)

    graph_response = TopicGraphResponse(
        document_id=doc.id,
        document_title=doc.filename,
        total_nodes=len(topics),
        max_depth=max_depth,
        topics=root_nodes,
    )

    return ResponseEnvelope[TopicGraphResponse](
        success=True,
        data=graph_response,
    )


@router.get("/{document_id}/topics", response_model=ResponseEnvelope[List[TopicNode]])
def list_document_topics(
    document_id: str,
    db: Session = Depends(get_db),
):
    """List topics and subtopics for a syllabus document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise ResourceNotFoundException(resource="Document", identifier=document_id)

    topics = (
        db.query(Topic)
        .filter(Topic.document_id == document_id)
        .order_by(Topic.order_index)
        .all()
    )

    result = [
        TopicNode(
            id=t.id,
            document_id=t.document_id,
            parent_id=t.parent_id,
            title=t.title,
            unit_label=t.unit_label,
            level=t.level,
            order_index=t.order_index,
            description=t.description,
            mastery_score=t.mastery_score,
            children=[],
        )
        for t in topics
    ]

    return ResponseEnvelope[List[TopicNode]](
        success=True,
        data=result,
    )
