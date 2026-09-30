from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # General
    PROJECT_NAME: str = "Personalized Learning Path Generator"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8080",
    ]

    # Database (PostgreSQL 15)
    DATABASE_URL: str = "postgresql://learner:learner@localhost:5432/learning_path"

    # Cache & State (Redis 7)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Vector DB (ChromaDB)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    CHROMA_COLLECTION_NAME: str = "syllabus_knowledge_base"

    # LLM Settings
    LLM_PROVIDER: str = "openai"  # "openai" or "ollama"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production-must-be-32-chars-min"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Ingestion & Chunking
    MAX_CHUNK_TOKENS: int = 500
    MIN_CHUNK_TOKENS: int = 150
    CHUNK_OVERLAP_TOKENS: int = 50
    UPLOAD_DIR: str = "./storage/uploads"


settings = Settings()
