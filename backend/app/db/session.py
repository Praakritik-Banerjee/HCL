from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

import logging

logger = logging.getLogger("learning_path.db")

# Configure engine arguments
connect_args = {}
database_url = settings.DATABASE_URL
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=False
    )
    if not database_url.startswith("sqlite"):
        with engine.connect():
            pass
except Exception as e:
    logger.warning("Primary database connection (%s) unavailable: %s. Falling back to SQLite.", database_url, e)
    database_url = "sqlite:///./learning_path.db"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency to provide a SQLAlchemy database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
