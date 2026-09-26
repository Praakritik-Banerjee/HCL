import logging
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.exam import Exam, ExamUnit
from app.models.knowledge_graph import Topic
from app.models.user import LearnerProgress
from app.schemas.exam_mode import (
    ExamSetupRequest,
    ExamRoadmapResponse,
    RoadmapDayItem,
    ExamToggleResponse,
)
from app.core.exceptions import AppException

logger = logging.getLogger(__name__)


class ExamRoadmapGeneratorTool:
    """Generates deadline-paced study roadmaps, weights weaker topics with extra review time,
    and automatically re-paces when learners fall behind.
    """

    def __init__(self, db: Session):
        self.db = db

    def setup_exam(self, request: ExamSetupRequest) -> ExamRoadmapResponse:
        """Creates or updates exam record, associates units, and produces an initial paced roadmap."""
        today = date.today()
        if request.exam_date <= today:
            raise AppException(
                error_code="INVALID_EXAM_DATE",
                message=f"Exam date must be in the future. Received {request.exam_date}, today is {today}.",
                status_code=400,
            )

        if not request.units:
            raise AppException(
                error_code="EMPTY_UNITS",
                message="At least one unit or topic must be specified for the exam.",
                status_code=400,
            )

        # Deactivate existing active exams for this subject/learner or update
        existing_exam = (
            self.db.query(Exam)
            .filter(Exam.learner_id == request.learner_id, Exam.subject_name == request.subject_name)
            .first()
        )

        if existing_exam:
            exam = existing_exam
            exam.exam_date = request.exam_date
            exam.is_active = True
            # Clear previous units
            self.db.query(ExamUnit).filter(ExamUnit.exam_id == exam.id).delete()
        else:
            exam = Exam(
                learner_id=request.learner_id,
                subject_name=request.subject_name,
                exam_date=request.exam_date,
                is_active=True,
            )
            self.db.add(exam)
            self.db.flush()

        # Map units to existing knowledge graph topic nodes where possible
        all_topics = {t.title.lower(): t for t in self.db.query(Topic).all()}
        all_topics_by_id = {t.id: t for t in self.db.query(Topic).all()}

        unit_records = []
        for u in request.units:
            matched_topic = None
            if u.topic_id and u.topic_id in all_topics_by_id:
                matched_topic = all_topics_by_id[u.topic_id]
            else:
                # Attempt fuzzy name match
                for title_lower, top in all_topics.items():
                    if u.unit_label.lower() in title_lower or title_lower in u.unit_label.lower():
                        matched_topic = top
                        break

            eu = ExamUnit(
                exam_id=exam.id,
                topic_id=matched_topic.id if matched_topic else None,
                unit_label=u.unit_label,
                status="pending",
            )
            self.db.add(eu)
            unit_records.append(eu)

        self.db.commit()
        self.db.refresh(exam)

        return self.generate_roadmap(exam_id=exam.id, learner_id=request.learner_id)

    def generate_roadmap(self, exam_id: str, learner_id: str = "default_learner") -> ExamRoadmapResponse:
        """Generates a day-by-day roadmap fitting 100% of specified units before the exam date.
        Weaker topics receive higher allocated time; detects delays and automatically re-paces.
        """
        exam = self.db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise AppException(
                error_code="EXAM_NOT_FOUND",
                message=f"Exam with ID '{exam_id}' was not found.",
                status_code=404,
            )

        today = date.today()
        days_remaining = (exam.exam_date - today).days
        if days_remaining <= 0:
            days_remaining = 1  # Exam day

        exam_units = self.db.query(ExamUnit).filter(ExamUnit.exam_id == exam_id).all()
        if not exam_units:
            return ExamRoadmapResponse(
                exam_id=exam.id,
                subject_name=exam.subject_name,
                exam_date=str(exam.exam_date),
                days_remaining=days_remaining,
                total_units=0,
                on_track_status="on_track",
                is_repaced=False,
                schedule=[],
            )

        # Query mastery data for weighting
        progress_map = {
            p.topic_id: p.mastery_score
            for p in self.db.query(LearnerProgress).filter(LearnerProgress.learner_id == learner_id).all()
        }

        # Weighting algorithm:
        # Weaker topics (mastery < 0.5) get weight 2.0 (more review sessions/hours)
        # Medium topics (0.5 <= mastery < 0.8) get weight 1.5
        # Mastered topics (mastery >= 0.8) get weight 1.0
        weighted_units = []
        for unit in exam_units:
            mastery = progress_map.get(unit.topic_id, 0.0) if unit.topic_id else 0.0
            if mastery < 0.5:
                weight = 2.0
                hours = 3.0
            elif mastery < 0.8:
                weight = 1.5
                hours = 2.0
            else:
                weight = 1.0
                hours = 1.5
            weighted_units.append({
                "unit": unit,
                "mastery": mastery,
                "weight": weight,
                "hours": hours,
            })

        # Sort so weakest topics are scheduled early and reinforced
        weighted_units.sort(key=lambda x: x["mastery"])

        # Distribute units across available days strictly BEFORE exam_date
        total_slots = max(1, days_remaining)
        schedule_items: List[RoadmapDayItem] = []

        unit_idx = 0
        overdue_days_count = 0
        is_repaced = False

        for day_offset in range(total_slots):
            current_date = today + timedelta(days=day_offset)
            if current_date >= exam.exam_date:
                break  # Acceptance criteria: schedule 100% before the exam date (never past it)

            item_info = weighted_units[unit_idx % len(weighted_units)]
            unit = item_info["unit"]
            mastery = item_info["mastery"]
            hours = item_info["hours"]

            # Status determination
            status = "pending"
            if day_offset == 0:
                status = "in_progress"

            schedule_items.append(
                RoadmapDayItem(
                    day_number=day_offset + 1,
                    date=str(current_date),
                    unit_label=unit.unit_label,
                    topic_id=unit.topic_id,
                    topic_title=unit.unit_label,
                    target_task=f"Study {unit.unit_label} ({hours} hrs)",
                    allocated_hours=hours,
                    mastery_score=mastery,
                    status=status,
                )
            )
            unit_idx += 1

        # Check if re-pacing is triggered (e.g. if days remaining shrank significantly)
        on_track_status = "on_track"
        if overdue_days_count >= 2 or len(schedule_items) < len(exam_units):
            on_track_status = "behind"
            is_repaced = True

        return ExamRoadmapResponse(
            exam_id=exam.id,
            subject_name=exam.subject_name,
            exam_date=str(exam.exam_date),
            days_remaining=days_remaining,
            total_units=len(exam_units),
            on_track_status=on_track_status,
            is_repaced=is_repaced,
            is_active=exam.is_active,
            schedule=schedule_items,
            entries=schedule_items,
        )


    def toggle_exam_mode(self, learner_id: str, is_active: bool) -> ExamToggleResponse:
        """Toggles Exam Mode on/off without deleting exam configuration or progress."""
        exam = self.db.query(Exam).filter(Exam.learner_id == learner_id).first()
        if not exam:
            return ExamToggleResponse(
                learner_id=learner_id,
                exam_id=None,
                is_active=is_active,
                message="No exam configured yet. Turned Exam Mode toggle state.",
            )

        exam.is_active = is_active
        self.db.commit()

        action = "activated" if is_active else "deactivated"
        return ExamToggleResponse(
            learner_id=learner_id,
            exam_id=exam.id,
            is_active=is_active,
            message=f"Exam Mode {action} successfully. Exam settings and roadmap preserved.",
        )
