import uuid
from typing import List, Dict, Any, Optional
from app.core.config import settings

try:
    import tiktoken
    tokenizer = tiktoken.get_encoding("cl100k_base")
except Exception:
    tokenizer = None


def count_tokens(text: str) -> int:
    """Accurately count tokens using tiktoken, falling back to word/character heuristic."""
    if tokenizer:
        return len(tokenizer.encode(text))
    # Heuristic fallback: ~1 token per 4 characters or 0.75 words
    return max(1, int(len(text) / 4))


class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        content: str,
        token_count: int,
        heading_path: str,
        topic_title: str,
        chunk_index: int,
        level: int = 1,
    ):
        self.chunk_id = chunk_id
        self.content = content
        self.token_count = token_count
        self.heading_path = heading_path
        self.topic_title = topic_title
        self.chunk_index = chunk_index
        self.level = level

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "content": self.content,
            "token_count": self.token_count,
            "heading_path": self.heading_path,
            "topic_title": self.topic_title,
            "chunk_index": self.chunk_index,
            "level": self.level,
        }


class HierarchicalChunker:
    """Splits document text into topic-aware and subtopic-aware chunks within ~300-500 tokens,
    preserving heading ancestry and structural tags for RAG grounding.
    """

    def __init__(
        self,
        max_tokens: int = settings.MAX_CHUNK_TOKENS,
        min_tokens: int = settings.MIN_CHUNK_TOKENS,
        overlap_tokens: int = settings.CHUNK_OVERLAP_TOKENS,
    ):
        self.max_tokens = max_tokens
        self.min_tokens = min_tokens
        self.overlap_tokens = overlap_tokens

    def chunk_section(
        self,
        text: str,
        heading_path: str,
        topic_title: str,
        level: int = 1,
        start_index: int = 0,
    ) -> List[DocumentChunk]:
        """Chunks a single structural section of text into chunks between min_tokens and max_tokens."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        if not paragraphs:
            return []

        chunks: List[DocumentChunk] = []
        current_chunk_paragraphs: List[str] = []
        current_tokens = 0
        current_index = start_index

        for para in paragraphs:
            para_tokens = count_tokens(para)

            # If a single paragraph exceeds max_tokens, split it by sentences or word windows
            if para_tokens > self.max_tokens:
                # Flush pending buffer first
                if current_chunk_paragraphs:
                    chunk_text = "\n\n".join(current_chunk_paragraphs)
                    chunks.append(
                        DocumentChunk(
                            chunk_id=f"chk_{uuid.uuid4().hex[:12]}",
                            content=chunk_text,
                            token_count=count_tokens(chunk_text),
                            heading_path=heading_path,
                            topic_title=topic_title,
                            chunk_index=current_index,
                            level=level,
                        )
                    )
                    current_index += 1
                    current_chunk_paragraphs = []
                    current_tokens = 0

                # Split large paragraph by sentences
                sentences = para.replace(". ", ".\n").split("\n")
                sub_buffer: List[str] = []
                sub_tokens = 0

                for sent in sentences:
                    sent = sent.strip()
                    if not sent:
                        continue
                    st_tokens = count_tokens(sent)
                    if sub_tokens + st_tokens > self.max_tokens and sub_buffer:
                        st_text = " ".join(sub_buffer)
                        chunks.append(
                            DocumentChunk(
                                chunk_id=f"chk_{uuid.uuid4().hex[:12]}",
                                content=st_text,
                                token_count=count_tokens(st_text),
                                heading_path=heading_path,
                                topic_title=topic_title,
                                chunk_index=current_index,
                                level=level,
                            )
                        )
                        current_index += 1
                        sub_buffer = [sent]
                        sub_tokens = st_tokens
                    else:
                        sub_buffer.append(sent)
                        sub_tokens += st_tokens

                if sub_buffer:
                    st_text = " ".join(sub_buffer)
                    chunks.append(
                        DocumentChunk(
                            chunk_id=f"chk_{uuid.uuid4().hex[:12]}",
                            content=st_text,
                            token_count=count_tokens(st_text),
                            heading_path=heading_path,
                            topic_title=topic_title,
                            chunk_index=current_index,
                            level=level,
                        )
                    )
                    current_index += 1

            elif current_tokens + para_tokens > self.max_tokens:
                # Max limit reached, flush current buffer
                chunk_text = "\n\n".join(current_chunk_paragraphs)
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"chk_{uuid.uuid4().hex[:12]}",
                        content=chunk_text,
                        token_count=count_tokens(chunk_text),
                        heading_path=heading_path,
                        topic_title=topic_title,
                        chunk_index=current_index,
                        level=level,
                    )
                )
                current_index += 1

                # Start new buffer with current paragraph
                current_chunk_paragraphs = [para]
                current_tokens = para_tokens
            else:
                current_chunk_paragraphs.append(para)
                current_tokens += para_tokens

        # Flush any remaining text in buffer
        if current_chunk_paragraphs:
            chunk_text = "\n\n".join(current_chunk_paragraphs)
            chunks.append(
                DocumentChunk(
                    chunk_id=f"chk_{uuid.uuid4().hex[:12]}",
                    content=chunk_text,
                    token_count=count_tokens(chunk_text),
                    heading_path=heading_path,
                    topic_title=topic_title,
                    chunk_index=current_index,
                    level=level,
                )
            )

        return chunks
