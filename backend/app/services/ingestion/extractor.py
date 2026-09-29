import io
import logging
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
import docx
from app.core.exceptions import IngestionException

logger = logging.getLogger(__name__)


class SectionItem:
    def __init__(self, text: str, heading: str = "", level: int = 1, page_or_pos: int = 1):
        self.text = text
        self.heading = heading
        self.level = level
        self.page_or_pos = page_or_pos


class DocumentExtractor:
    """Extracts text and structural headings from PDF and DOCX documents."""

    @classmethod
    def extract_from_bytes(cls, content: bytes, file_type: str) -> Tuple[str, List[Dict[str, Any]], int]:
        """Extracts text, structured sections, and total page/section count from binary content.
        Returns:
            Tuple of (full_raw_text, structured_sections, page_count)
        """
        file_type_lower = file_type.lower().strip(".")
        if file_type_lower == "pdf":
            return cls._extract_pdf(content)
        elif file_type_lower in ["docx", "doc"]:
            return cls._extract_docx(content)
        elif file_type_lower == "txt":
            text = content.decode("utf-8", errors="ignore")
            return text, [], 1
        else:
            raise IngestionException(f"Unsupported file format: {file_type}. Supported formats: PDF, DOCX, TXT.")

    @classmethod
    def _extract_pdf(cls, content: bytes) -> Tuple[str, List[Dict[str, Any]], int]:
        try:
            reader = PdfReader(io.BytesIO(content))
            page_count = len(reader.pages)
            full_text_list = []
            sections = []

            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    full_text_list.append(page_text)

            full_text = "\n\n".join(full_text_list)
            return full_text, [], page_count
        except Exception as e:
            logger.error(f"Failed to extract PDF content: {e}")
            raise IngestionException(f"Failed to extract PDF document: {str(e)}")

    @classmethod
    def _extract_docx(cls, content: bytes) -> Tuple[str, List[Dict[str, Any]], int]:
        try:
            doc = docx.Document(io.BytesIO(content))
            paragraphs = doc.paragraphs
            full_text_list = []
            sections = []
            current_heading = "Introduction"
            current_level = 1
            current_buffer = []

            for p in paragraphs:
                text = p.text.strip()
                if not text:
                    continue

                full_text_list.append(text)
                style_name = (p.style.name if p.style else "").lower()

                # Detect heading levels in Word
                if "heading 1" in style_name:
                    if current_buffer:
                        sections.append({
                            "text": "\n".join(current_buffer),
                            "heading": current_heading,
                            "level": current_level,
                            "position": len(sections) + 1,
                        })
                        current_buffer = []
                    current_heading = text
                    current_level = 1
                elif "heading 2" in style_name:
                    if current_buffer:
                        sections.append({
                            "text": "\n".join(current_buffer),
                            "heading": current_heading,
                            "level": current_level,
                            "position": len(sections) + 1,
                        })
                        current_buffer = []
                    current_heading = text
                    current_level = 2
                elif "heading 3" in style_name:
                    if current_buffer:
                        sections.append({
                            "text": "\n".join(current_buffer),
                            "heading": current_heading,
                            "level": current_level,
                            "position": len(sections) + 1,
                        })
                        current_buffer = []
                    current_heading = text
                    current_level = 3
                else:
                    current_buffer.append(text)

            if current_buffer:
                sections.append({
                    "text": "\n".join(current_buffer),
                    "heading": current_heading,
                    "level": current_level,
                    "position": len(sections) + 1,
                })

            full_text = "\n\n".join(full_text_list)
            # Estimate pages roughly (350 words/page) if docx doesn't store explicit page counts
            word_count = len(full_text.split())
            estimated_pages = max(1, word_count // 350)

            return full_text, sections, estimated_pages
        except Exception as e:
            logger.error(f"Failed to extract DOCX content: {e}")
            raise IngestionException(f"Failed to extract DOCX document: {str(e)}")
