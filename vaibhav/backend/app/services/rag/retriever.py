import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.knowledge_graph import TopicChunk, Topic
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


class RetrievedChunk:
    def __init__(
        self,
        chunk_id: str,
        content: str,
        heading_path: str,
        topic_id: Optional[str] = None,
        score: float = 1.0,
        source: str = "vector",
    ):
        self.chunk_id = chunk_id
        self.content = content
        self.heading_path = heading_path
        self.topic_id = topic_id
        self.score = score
        self.source = source

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "content": self.content,
            "heading_path": self.heading_path,
            "topic_id": self.topic_id,
            "score": self.score,
            "source": self.source,
        }


class HybridRAGRetriever:
    """Hybrid Retriever executing semantic vector search with relational keyword fallback."""

    def __init__(self, db: Session):
        self.db = db
        self.vector_store = get_vector_store()

    def retrieve(
        self,
        query: str,
        topic_id: Optional[str] = None,
        top_k: int = 4,
    ) -> List[RetrievedChunk]:
        """Retrieves most relevant source chunks using semantic search with automatic keyword fallback."""
        results: List[RetrievedChunk] = []

        # 1. Primary: Semantic Vector Search
        try:
            where_filter = {}
            if topic_id:
                where_filter["topic_id"] = topic_id

            vector_matches = self.vector_store.similarity_search(
                query=query,
                k=top_k,
                where=where_filter if where_filter else None,
            )

            for match in vector_matches:
                meta = match.get("metadata", {})
                results.append(
                    RetrievedChunk(
                        chunk_id=match.get("id", ""),
                        content=match.get("content", ""),
                        heading_path=meta.get("heading_path", "General Syllabus"),
                        topic_id=meta.get("topic_id"),
                        score=1.0 - match.get("distance", 0.0),
                        source="semantic_vector",
                    )
                )
        except Exception as e:
            logger.warning(f"Semantic search encountered issue: {e}. Executing keyword fallback.")

        # 2. Fallback: Keyword Search if semantic search yielded fewer than desired results
        if len(results) < top_k:
            needed = top_k - len(results)
            existing_ids = {r.chunk_id for r in results}
            keyword_chunks = self._keyword_fallback(query=query, topic_id=topic_id, limit=needed, exclude_ids=existing_ids)
            results.extend(keyword_chunks)

        return results

    def _keyword_fallback(
        self,
        query: str,
        topic_id: Optional[str] = None,
        limit: int = 4,
        exclude_ids: Optional[set] = None,
    ) -> List[RetrievedChunk]:
        """Fallback to database keyword matching over topic_chunks table."""
        exclude_ids = exclude_ids or set()
        words = [w.strip() for w in query.split() if len(w.strip()) > 3][:5]

        query_filter = self.db.query(TopicChunk)
        if topic_id:
            query_filter = query_filter.filter(TopicChunk.topic_id == topic_id)

        if words:
            word_conditions = [TopicChunk.content.ilike(f"%{w}%") for w in words]
            query_filter = query_filter.filter(or_(*word_conditions))

        db_chunks = query_filter.limit(limit * 2).all()
        fallback_results: List[RetrievedChunk] = []

        for chunk in db_chunks:
            if chunk.vector_id not in exclude_ids:
                fallback_results.append(
                    RetrievedChunk(
                        chunk_id=chunk.vector_id,
                        content=chunk.content,
                        heading_path=chunk.heading_path or "",
                        topic_id=chunk.topic_id,
                        score=0.75,
                        source="keyword_fallback",
                    )
                )
                if len(fallback_results) >= limit:
                    break

        # If still empty, fetch any chunks for the topic
        if not fallback_results and topic_id:
            default_chunks = self.db.query(TopicChunk).filter(TopicChunk.topic_id == topic_id).limit(limit).all()
            for chunk in default_chunks:
                if chunk.vector_id not in exclude_ids:
                    fallback_results.append(
                        RetrievedChunk(
                            chunk_id=chunk.vector_id,
                            content=chunk.content,
                            heading_path=chunk.heading_path or "",
                            topic_id=chunk.topic_id,
                            score=0.6,
                            source="topic_default",
                        )
                    )

        return fallback_results
