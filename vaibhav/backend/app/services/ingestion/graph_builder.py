import re
import uuid
from typing import List, Dict, Any, Optional, Tuple


class ParsedTopicItem:
    def __init__(
        self,
        title: str,
        level: int,
        unit_label: Optional[str] = None,
        text_content: str = "",
        children: Optional[List["ParsedTopicItem"]] = None,
        order_index: int = 0,
    ):
        self.temp_id = str(uuid.uuid4())
        self.title = title
        self.level = level
        self.unit_label = unit_label
        self.text_content = text_content
        self.children = children or []
        self.order_index = order_index


class KnowledgeGraphBuilder:
    """Parses syllabus text and sections into a hierarchical knowledge graph of Units, Topics, and Subtopics."""

    # Heading detection patterns
    UNIT_PATTERN = re.compile(
        r"^(unit|module|chapter|part)\s*([0-9ivx]+)\s*[:\-–—]?\s*(.*)$",
        re.IGNORECASE,
    )
    NUMBERED_HEADING_PATTERN = re.compile(
        r"^(\d+(\.\d+)*)\s*[:\-–—]?\s*(.+)$"
    )

    @classmethod
    def parse_hierarchy(cls, cleaned_text: str, docx_sections: Optional[List[Dict[str, Any]]] = None) -> List[ParsedTopicItem]:
        """Extracts top-level units and nested subtopics from the syllabus text or docx sections."""
        if docx_sections and len(docx_sections) > 1:
            return cls._build_from_sections(docx_sections)
        return cls._build_from_text(cleaned_text)

    @classmethod
    def _build_from_text(cls, text: str) -> List[ParsedTopicItem]:
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        root_nodes: List[ParsedTopicItem] = []
        current_unit: Optional[ParsedTopicItem] = None
        current_subtopic: Optional[ParsedTopicItem] = None
        current_buffer: List[str] = []
        order_counter = 0

        for line in lines:
            # Check for Unit / Module / Chapter
            unit_match = cls.UNIT_PATTERN.match(line)
            num_match = cls.NUMBERED_HEADING_PATTERN.match(line)

            if unit_match:
                # Flush buffer to previous node
                if current_buffer and current_subtopic:
                    current_subtopic.text_content += "\n".join(current_buffer)
                elif current_buffer and current_unit:
                    current_unit.text_content += "\n".join(current_buffer)
                current_buffer = []

                u_type = unit_match.group(1).title()
                u_num = unit_match.group(2).upper()
                u_title = unit_match.group(3).strip() or f"{u_type} {u_num}"
                label = f"{u_type} {u_num}"

                order_counter += 1
                current_unit = ParsedTopicItem(
                    title=u_title,
                    level=1,
                    unit_label=label,
                    order_index=order_counter,
                )
                root_nodes.append(current_unit)
                current_subtopic = None

            elif num_match and current_unit:
                prefix = num_match.group(1)
                heading_title = num_match.group(3).strip()
                dots = prefix.count(".")

                if current_buffer and current_subtopic:
                    current_subtopic.text_content += "\n".join(current_buffer)
                current_buffer = []

                order_counter += 1
                if dots == 0 or dots == 1:
                    # e.g., 1. or 1.1 -> Subtopic
                    current_subtopic = ParsedTopicItem(
                        title=heading_title,
                        level=2,
                        unit_label=prefix,
                        order_index=order_counter,
                    )
                    current_unit.children.append(current_subtopic)
                else:
                    # e.g. 1.1.1 -> Concept / Sub-subtopic
                    concept = ParsedTopicItem(
                        title=heading_title,
                        level=3,
                        unit_label=prefix,
                        order_index=order_counter,
                    )
                    if current_subtopic:
                        current_subtopic.children.append(concept)
                    else:
                        current_unit.children.append(concept)

            elif line.startswith(("- ", "• ", "* ")) and current_unit:
                bullet_title = line.lstrip("-•* ").strip()
                if len(bullet_title) < 80 and not bullet_title.endswith("."):
                    order_counter += 1
                    sub = ParsedTopicItem(
                        title=bullet_title,
                        level=2 if not current_subtopic else 3,
                        order_index=order_counter,
                    )
                    if current_subtopic:
                        current_subtopic.children.append(sub)
                    else:
                        current_unit.children.append(sub)
                else:
                    current_buffer.append(line)
            else:
                current_buffer.append(line)

        # Flush trailing buffer
        if current_buffer and current_subtopic:
            current_subtopic.text_content += "\n".join(current_buffer)
        elif current_buffer and current_unit:
            current_unit.text_content += "\n".join(current_buffer)

        # If no explicit "Unit" or headings found, synthesize meaningful top-level blocks
        if not root_nodes:
            order_counter += 1
            default_unit = ParsedTopicItem(
                title="General Syllabus & Core Concepts",
                level=1,
                unit_label="Unit 1",
                text_content=text,
                order_index=order_counter,
            )
            root_nodes.append(default_unit)

        return root_nodes

    @classmethod
    def _build_from_sections(cls, sections: List[Dict[str, Any]]) -> List[ParsedTopicItem]:
        root_nodes: List[ParsedTopicItem] = []
        current_unit: Optional[ParsedTopicItem] = None
        order = 0

        for sec in sections:
            level = sec.get("level", 1)
            heading = sec.get("heading", "Topic")
            text = sec.get("text", "")
            order += 1

            if level == 1:
                current_unit = ParsedTopicItem(
                    title=heading,
                    level=1,
                    unit_label=f"Module {order}",
                    text_content=text,
                    order_index=order,
                )
                root_nodes.append(current_unit)
            elif current_unit:
                sub = ParsedTopicItem(
                    title=heading,
                    level=2,
                    text_content=text,
                    order_index=order,
                )
                current_unit.children.append(sub)
            else:
                current_unit = ParsedTopicItem(
                    title=heading,
                    level=1,
                    text_content=text,
                    order_index=order,
                )
                root_nodes.append(current_unit)

        return root_nodes
