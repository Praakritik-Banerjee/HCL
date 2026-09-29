import re
from typing import Tuple


class TextCleaner:
    """Cleans raw document text, removes formatting noise, and scrubs PII patterns
    (emails, phone numbers, ID numbers) as required by Section 6 of the specification.
    """

    # PII Regex Patterns
    EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    PHONE_PATTERN = re.compile(
        r"(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b"
    )
    STUDENT_ID_PATTERN = re.compile(r"\b(ID|Student ID|Roll No|Enrollment No)[\s:#]+[A-Za-z0-9-]{5,15}\b", re.IGNORECASE)
    SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")

    # Document Noise Patterns
    PAGE_NUMBER_PATTERNS = [
        re.compile(r"^\s*page\s+\d+(\s+of\s+\d+)?\s*$", re.IGNORECASE | re.MULTILINE),
        re.compile(r"^\s*-\s*\d+\s*-\s*$", re.MULTILINE),
        re.compile(r"^\s*\[\s*\d+\s*\]\s*$", re.MULTILINE),
    ]

    @classmethod
    def scrub_pii(cls, text: str) -> Tuple[str, int]:
        """Scrub PII (email, phone, student IDs, SSN) and return cleaned text along with scrub count."""
        count = 0

        # Replace emails first
        text, n = cls.EMAIL_PATTERN.subn("[REDACTED_EMAIL]", text)
        count += n

        # Replace student/enrollment IDs before generic number patterns
        text, n = cls.STUDENT_ID_PATTERN.subn("[REDACTED_ID]", text)
        count += n

        # Replace SSN
        text, n = cls.SSN_PATTERN.subn("[REDACTED_SSN]", text)
        count += n

        # Replace phone numbers
        text, n = cls.PHONE_PATTERN.subn("[REDACTED_PHONE]", text)
        count += n

        return text, count

    @classmethod
    def clean_document_noise(cls, text: str) -> str:
        """Strip page numbers, excessive whitespace, and normalize line breaks."""
        cleaned = text

        # Strip page numbers
        for pat in cls.PAGE_NUMBER_PATTERNS:
            cleaned = pat.sub("", cleaned)

        # Normalize special unicode symbols (arrows, dashes, quotes, bullets)
        cleaned = (
            cleaned.replace("→", "->")
            .replace("←", "<-")
            .replace("⇒", "=>")
            .replace("•", "- ")
            .replace("–", "-")
            .replace("—", "-")
            .replace("“", '"')
            .replace("”", '"')
            .replace("‘", "'")
            .replace("’", "'")
        )

        # Normalize line endings
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")

        # Collapse 3+ consecutive newlines into 2
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        # Normalize multi-space tabs and spaces on lines
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in cleaned.split("\n")]
        cleaned = "\n".join(lines).strip()

        return cleaned

    @classmethod
    def clean(cls, text: str) -> str:
        """Full cleaning pipeline: clean noise then scrub PII."""
        noise_cleaned = cls.clean_document_noise(text)
        pii_scrubbed, _ = cls.scrub_pii(noise_cleaned)
        return pii_scrubbed
