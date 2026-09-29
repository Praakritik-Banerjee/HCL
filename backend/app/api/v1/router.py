from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    syllabus,
    progress,
    study_kit,
    remediation,
    exam_mode,
)

api_router = APIRouter()

# Register Phase 1 routes
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(syllabus.router, prefix="/syllabus", tags=["Syllabus Ingestion & Knowledge Graph"])

# Register Phase 2 routes
api_router.include_router(progress.router, prefix="/progress", tags=["Progress & Mastery Tracking"])
api_router.include_router(study_kit.router, prefix="/study-kit", tags=["Study-Kit Generation (RAG)"])
api_router.include_router(remediation.router, prefix="/remediation", tags=["Remediation Workflow"])
api_router.include_router(exam_mode.router, prefix="/exam-mode", tags=["Exam Mode"])
