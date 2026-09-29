import hashlib
import logging
import uuid
from typing import Tuple, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.knowledge_graph import Topic, TopicChunk
from app.schemas.document import DocumentUploadResult
from app.services.ingestion.extractor import DocumentExtractor
from app.services.ingestion.cleaner import TextCleaner
from app.services.ingestion.graph_builder import KnowledgeGraphBuilder, ParsedTopicItem
from app.services.ingestion.chunker import HierarchicalChunker
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """End-to-end ingestion pipeline:
    Extraction -> Cleaning & PII Scrubbing -> Knowledge Graph Generation -> Chunking -> Vectorization -> PostgreSQL Persistence.
    """

    def __init__(self, db: Session):
        self.db = db
        self.vector_store = get_vector_store()
        self.chunker = HierarchicalChunker()

    def process_file(
        self,
        file_bytes: bytes,
        filename: str,
        file_type: str,
    ) -> DocumentUploadResult:
        """Executes the complete ingestion pipeline for an uploaded syllabus or notes document."""
        # 1. Calculate file hash
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)

        logger.info(f"Starting ingestion for '{filename}' ({file_size} bytes, type={file_type})")

        # 2. Extract text and structural sections
        raw_text, sections, page_count = DocumentExtractor.extract_from_bytes(file_bytes, file_type)

        # 3. Clean document noise and scrub PII
        cleaned_text = TextCleaner.clean(raw_text)

        # 4. Create Document record in PostgreSQL
        doc_id = str(uuid.uuid4())
        doc_record = Document(
            id=doc_id,
            filename=filename,
            file_type=file_type.lower().strip("."),
            file_hash=file_hash,
            file_size_bytes=file_size,
            page_count=page_count,
            raw_text=cleaned_text,
            status="processing",
        )
        self.db.add(doc_record)
        self.db.flush()

        # 5. Build Knowledge Graph Hierarchy
        parsed_roots: List[ParsedTopicItem] = KnowledgeGraphBuilder.parse_hierarchy(cleaned_text, sections)

        total_topics = 0
        total_subtopics = 0
        total_chunks = 0

        vector_chunk_ids: List[str] = []
        vector_chunk_texts: List[str] = []
        vector_chunk_metas: List[Dict[str, Any]] = []

        # 6. Relational Persistence & Chunking
        for unit_item in parsed_roots:
            total_topics += 1
            unit_topic = Topic(
                id=str(uuid.uuid4()),
                document_id=doc_id,
                parent_id=None,
                title=unit_item.title,
                unit_label=unit_item.unit_label,
                level=1,
                order_index=unit_item.order_index,
                description=unit_item.title,
                mastery_score=0.0,
            )
            self.db.add(unit_topic)
            self.db.flush()

            # Chunk Unit-level text if present
            if unit_item.text_content:
                unit_chunks = self.chunker.chunk_section(
                    text=unit_item.text_content,
                    heading_path=f"{unit_item.unit_label or 'Unit'}: {unit_item.title}",
                    topic_title=unit_item.title,
                    level=1,
                    start_index=total_chunks,
                )
                for chk in unit_chunks:
                    total_chunks += 1
                    tc = TopicChunk(
                        id=str(uuid.uuid4()),
                        topic_id=unit_topic.id,
                        document_id=doc_id,
                        chunk_index=chk.chunk_index,
                        vector_id=chk.chunk_id,
                        content=chk.content,
                        token_count=chk.token_count,
                        heading_path=chk.heading_path,
                    )
                    self.db.add(tc)
                    vector_chunk_ids.append(chk.chunk_id)
                    vector_chunk_texts.append(chk.content)
                    vector_chunk_metas.append({
                        "document_id": doc_id,
                        "topic_id": unit_topic.id,
                        "heading_path": chk.heading_path,
                        "level": 1,
                        "chunk_index": chk.chunk_index,
                    })

            # Process Child Subtopics
            for sub_item in unit_item.children:
                total_subtopics += 1
                sub_topic = Topic(
                    id=str(uuid.uuid4()),
                    document_id=doc_id,
                    parent_id=unit_topic.id,
                    title=sub_item.title,
                    unit_label=sub_item.unit_label,
                    level=sub_item.level,
                    order_index=sub_item.order_index,
                    description=sub_item.title,
                    mastery_score=0.0,
                )
                self.db.add(sub_topic)
                self.db.flush()

                # Chunk Subtopic text
                sub_text = sub_item.text_content or f"{sub_item.title} under {unit_item.title}"
                sub_chunks = self.chunker.chunk_section(
                    text=sub_text,
                    heading_path=f"{unit_item.title} > {sub_item.title}",
                    topic_title=sub_item.title,
                    level=sub_item.level,
                    start_index=total_chunks,
                )
                for chk in sub_chunks:
                    total_chunks += 1
                    tc = TopicChunk(
                        id=str(uuid.uuid4()),
                        topic_id=sub_topic.id,
                        document_id=doc_id,
                        chunk_index=chk.chunk_index,
                        vector_id=chk.chunk_id,
                        content=chk.content,
                        token_count=chk.token_count,
                        heading_path=chk.heading_path,
                    )
                    self.db.add(tc)
                    vector_chunk_ids.append(chk.chunk_id)
                    vector_chunk_texts.append(chk.content)
                    vector_chunk_metas.append({
                        "document_id": doc_id,
                        "topic_id": sub_topic.id,
                        "heading_path": chk.heading_path,
                        "level": sub_item.level,
                        "chunk_index": chk.chunk_index,
                    })

        # 7. Write vectors into ChromaDB
        if vector_chunk_ids:
            try:
                self.vector_store.add_chunks(
                    chunk_ids=vector_chunk_ids,
                    documents=vector_chunk_texts,
                    metadatas=vector_chunk_metas,
                )
            except Exception as e:
                logger.warning(f"Vector store upsert warning: {e}")

        # 8. Mark document completed and commit transaction
        doc_record.status = "completed"
        self.db.commit()

        logger.info(
            f"Ingestion complete: {filename} -> {total_topics} topics, {total_subtopics} subtopics, {total_chunks} chunks stored."
        )

        return DocumentUploadResult(
            document_id=doc_id,
            filename=filename,
            file_type=file_type,
            page_count=page_count,
            total_topics=total_topics,
            total_subtopics=total_subtopics,
            total_chunks=total_chunks,
            status="completed",
            message=f"Successfully ingested {filename}. Generated knowledge graph with {total_topics} units and {total_subtopics} subtopics.",
        )
