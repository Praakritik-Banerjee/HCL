import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.core.exceptions import VectorStoreException

logger = logging.getLogger(__name__)


class VectorStoreAdapter(ABC):
    """Abstract Vector Store Adapter to allow seamless switching between ChromaDB and Pinecone."""

    @abstractmethod
    def add_chunks(
        self,
        chunk_ids: List[str],
        documents: List[str],
        metadatas: List[Dict[str, Any]],
    ) -> None:
        """Add text chunks with their IDs and metadata into the vector database."""
        pass

    @abstractmethod
    def similarity_search(
        self,
        query: str,
        k: int = 4,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Perform semantic search and return top-k matching documents with scores and metadata."""
        pass

    @abstractmethod
    def delete_by_document(self, document_id: str) -> None:
        """Delete all vectors associated with a specific document ID."""
        pass

    @abstractmethod
    def heartbeat(self) -> bool:
        """Health check for vector store connection."""
        pass


class ChromaVectorStoreAdapter(VectorStoreAdapter):
    """ChromaDB implementation of the VectorStoreAdapter.
    Supports both remote HTTP client (Docker) and embedded PersistentClient for local execution.
    """

    def __init__(self, collection_name: Optional[str] = None):
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME
        self.client = self._initialize_client()
        self.collection = self._get_or_create_collection()

    def _initialize_client(self):
        import socket
        # Fast socket check to prevent blocking if Chroma service is not listening
        port_open = False
        try:
            with socket.create_connection((settings.CHROMA_HOST, settings.CHROMA_PORT), timeout=0.5):
                port_open = True
        except Exception:
            port_open = False

        if port_open:
            try:
                logger.info(f"Connecting to ChromaDB HTTP service at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
                client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT,
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
                client.heartbeat()
                logger.info("Successfully connected to ChromaDB HTTP service.")
                return client
            except Exception as e:
                logger.warning(f"Could not connect to ChromaDB HTTP service: {e}. Falling back to PersistentClient.")

        logger.info(f"Using local PersistentClient at {settings.CHROMA_PERSIST_DIR}")
        return chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

    def _get_or_create_collection(self):
        try:
            return self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.error(f"Failed to initialize Chroma collection {self.collection_name}: {e}")
            raise VectorStoreException(f"Vector store collection error: {str(e)}")

    def add_chunks(
        self,
        chunk_ids: List[str],
        documents: List[str],
        metadatas: List[Dict[str, Any]],
    ) -> None:
        if not chunk_ids:
            return
        try:
            self.collection.upsert(
                ids=chunk_ids,
                documents=documents,
                metadatas=metadatas,
            )
            logger.info(f"Upserted {len(chunk_ids)} chunks into ChromaDB collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Error adding chunks to ChromaDB: {e}")
            raise VectorStoreException(f"Failed to upsert chunks: {str(e)}")

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        where: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        try:
            query_kwargs: Dict[str, Any] = {
                "query_texts": [query],
                "n_results": k,
            }
            if where:
                query_kwargs["where"] = where

            results = self.collection.query(**query_kwargs)
            formatted = []
            if results and results.get("ids") and len(results["ids"]) > 0:
                ids = results["ids"][0]
                docs = results.get("documents", [[]])[0]
                metas = results.get("metadatas", [[]])[0]
                distances = results.get("distances", [[]])[0] if results.get("distances") else [0.0] * len(ids)

                for i in range(len(ids)):
                    formatted.append({
                        "id": ids[i],
                        "content": docs[i] if i < len(docs) else "",
                        "metadata": metas[i] if i < len(metas) else {},
                        "distance": distances[i] if i < len(distances) else 0.0,
                    })
            return formatted
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            raise VectorStoreException(f"Semantic search failed: {str(e)}")

    def delete_by_document(self, document_id: str) -> None:
        try:
            self.collection.delete(where={"document_id": document_id})
        except Exception as e:
            logger.warning(f"Failed to delete chunks for document {document_id}: {e}")

    def heartbeat(self) -> bool:
        try:
            self.client.heartbeat()
            return True
        except Exception:
            return False


# Singleton helper
_vector_store: Optional[VectorStoreAdapter] = None


def get_vector_store() -> VectorStoreAdapter:
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaVectorStoreAdapter()
    return _vector_store
