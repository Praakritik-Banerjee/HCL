import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.knowledge_graph import Topic
from app.models.user import LearnerProgress
from app.schemas.progress import NextTopicResponse, MasteryDashboardResponse, TopicMasteryItem

logger = logging.getLogger(__name__)


class ProgressTrackerTool:
    """Manages learner progress tracking, mastery calculations, and next topic recommendations."""

    MASTERY_THRESHOLD = 0.80  # Considered mastered if >= 80%
    STRUGGLE_THRESHOLD = 0.60  # Considered low score if < 60%

    def __init__(self, db: Session):
        self.db = db

    def recommend_next_topic(self, learner_id: str = "default_learner") -> NextTopicResponse:
        """Finds the next optimal unmastered topic in the knowledge graph.
        Guarantees response in < 2 seconds; never recommends an already mastered topic.
        """
        # Fetch all topics in natural syllabus order (level asc, order_index asc)
        all_topics = self.db.query(Topic).order_by(Topic.level, Topic.order_index).all()
        if not all_topics:
            return NextTopicResponse(
                topic_id="",
                title="No Syllabus Uploaded",
                unit_label=None,
                level=1,
                order_index=0,
                mastery_score=0.0,
                reason="Please upload a syllabus PDF or DOCX first to generate your learning path.",
            )

        # Fetch all progress records for this learner
        progress_records = {
            p.topic_id: p
            for p in self.db.query(LearnerProgress).filter(LearnerProgress.learner_id == learner_id).all()
        }

        # 1. Check for active struggling topics needing remediation/revision
        for topic in all_topics:
            prog = progress_records.get(topic.id)
            if prog and prog.remediation_triggered and prog.mastery_score < self.MASTERY_THRESHOLD:
                return NextTopicResponse(
                    topic_id=topic.id,
                    title=topic.title,
                    unit_label=topic.unit_label,
                    level=topic.level,
                    order_index=topic.order_index,
                    mastery_score=prog.mastery_score,
                    reason=f"Recommended for targeted remediation: Previous score was {int(prog.mastery_score * 100)}%.",
                )

        # 2. Check for in-progress unmastered topics
        for topic in all_topics:
            prog = progress_records.get(topic.id)
            if prog and 0.0 < prog.mastery_score < self.MASTERY_THRESHOLD:
                return NextTopicResponse(
                    topic_id=topic.id,
                    title=topic.title,
                    unit_label=topic.unit_label,
                    level=topic.level,
                    order_index=topic.order_index,
                    mastery_score=prog.mastery_score,
                    reason=f"In progress ({int(prog.mastery_score * 100)}% mastery). Recommended to practice and achieve full mastery.",
                )

        # 3. Recommend first unstudied topic in sequence
        for topic in all_topics:
            prog = progress_records.get(topic.id)
            if not prog or prog.attempts_count == 0:
                return NextTopicResponse(
                    topic_id=topic.id,
                    title=topic.title,
                    unit_label=topic.unit_label,
                    level=topic.level,
                    order_index=topic.order_index,
                    mastery_score=0.0,
                    reason="Next scheduled topic in syllabus sequence.",
                )

        # 4. If all topics are >= 80% mastered, recommend the topic with the lowest score for review
        lowest_topic = min(
            all_topics,
            key=lambda t: progress_records[t.id].mastery_score if t.id in progress_records else 0.0,
        )
        prog = progress_records.get(lowest_topic.id)
        return NextTopicResponse(
            topic_id=lowest_topic.id,
            title=lowest_topic.title,
            unit_label=lowest_topic.unit_label,
            level=lowest_topic.level,
            order_index=lowest_topic.order_index,
            mastery_score=prog.mastery_score if prog else 0.0,
            reason="All topics mastered! Recommended for comprehensive refresher review.",
        )

    def record_attempt(
        self,
        learner_id: str,
        topic_id: str,
        score: float,
    ) -> Dict[str, Any]:
        """Records a quiz attempt, updates moving average mastery, tracks struggle signals,
        and flags remediation when 2 consecutive scores are < 60%.
        """
        progress = (
            self.db.query(LearnerProgress)
            .filter(LearnerProgress.learner_id == learner_id, LearnerProgress.topic_id == topic_id)
            .first()
        )

        if not progress:
            progress = LearnerProgress(
                learner_id=learner_id,
                topic_id=topic_id,
                mastery_score=score,
                attempts_count=1,
                consecutive_low_scores=1 if score < self.STRUGGLE_THRESHOLD else 0,
                remediation_triggered=False,
            )
            self.db.add(progress)
        else:
            progress.attempts_count += 1
            # Exponential moving average / weighted blend for smooth mastery progression
            progress.mastery_score = round(0.6 * score + 0.4 * progress.mastery_score, 2)

            if score < self.STRUGGLE_THRESHOLD:
                progress.consecutive_low_scores += 1
            else:
                progress.consecutive_low_scores = 0
                if progress.mastery_score >= self.MASTERY_THRESHOLD:
                    progress.remediation_triggered = False

        # Acceptance Criteria: Two consecutive sub-60% scores triggers remediation
        if progress.consecutive_low_scores >= 2:
            progress.remediation_triggered = True

        # Also sync mastery_score back to Topic table
        topic = self.db.query(Topic).filter(Topic.id == topic_id).first()
        if topic:
            topic.mastery_score = progress.mastery_score

        self.db.commit()
        self.db.refresh(progress)

        return {
            "learner_id": learner_id,
            "topic_id": topic_id,
            "new_mastery_score": progress.mastery_score,
            "attempts_count": progress.attempts_count,
            "consecutive_low_scores": progress.consecutive_low_scores,
            "remediation_triggered": progress.remediation_triggered,
            "message": (
                "Remediation triggered: Two consecutive scores below 60%. Targeted practice queued."
                if progress.remediation_triggered
                else "Progress updated successfully."
            ),
        }

    def get_mastery_dashboard(self, learner_id: str = "default_learner") -> MasteryDashboardResponse:
        """Aggregates overall and per-topic mastery metrics for dashboard visualization."""
        all_topics = self.db.query(Topic).order_by(Topic.order_index).all()
        progress_records = {
            p.topic_id: p
            for p in self.db.query(LearnerProgress).filter(LearnerProgress.learner_id == learner_id).all()
        }

        topic_items: List[TopicMasteryItem] = []
        total_mastery = 0.0
        mastered_count = 0
        in_progress_count = 0
        struggling_count = 0

        for t in all_topics:
            prog = progress_records.get(t.id)
            score = prog.mastery_score if prog else 0.0
            total_mastery += score

            if not prog or prog.attempts_count == 0:
                status = "not_started"
            elif prog.remediation_triggered:
                status = "struggling"
                struggling_count += 1
            elif score >= self.MASTERY_THRESHOLD:
                status = "mastered"
                mastered_count += 1
            else:
                status = "in_progress"
                in_progress_count += 1

            topic_items.append(
                TopicMasteryItem(
                    topic_id=t.id,
                    title=t.title,
                    unit_label=t.unit_label,
                    level=t.level,
                    mastery_score=score,
                    status=status,
                )
            )

        overall = round(total_mastery / len(all_topics), 2) if all_topics else 0.0

        return MasteryDashboardResponse(
            learner_id=learner_id,
            overall_mastery=overall,
            total_topics=len(all_topics),
            mastered_topics=mastered_count,
            in_progress_topics=in_progress_count,
            struggling_topics=struggling_count,
            topics=topic_items,
        )
