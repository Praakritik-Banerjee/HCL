import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END

from app.services.agent.state import AgentState
from app.services.agent.tools.progress_tracker import ProgressTrackerTool
from app.services.agent.tools.study_kit import StudyKitGeneratorTool
from app.services.agent.tools.remediation import RemediationTool
from app.services.agent.tools.exam_roadmap import ExamRoadmapGeneratorTool

logger = logging.getLogger(__name__)


class LearningPathAgent:
    """Autonomous LangGraph Agent Router directing learner requests to specialized tools."""

    def __init__(self, db: Session):
        self.db = db
        self.progress_tracker = ProgressTrackerTool(db=db)
        self.study_kit_generator = StudyKitGeneratorTool(db=db)
        self.remediation_tool = RemediationTool(db=db)
        self.exam_tool = ExamRoadmapGeneratorTool(db=db)
        self.workflow = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(AgentState)

        # 1. Add Tool Nodes
        graph.add_node("recommend_topic_node", self._node_recommend_topic)
        graph.add_node("study_kit_node", self._node_study_kit)
        graph.add_node("remediation_node", self._node_remediation)
        graph.add_node("exam_roadmap_node", self._node_exam_roadmap)
        graph.add_node("update_progress_node", self._node_update_progress)

        # 2. Router / Entry Point
        graph.set_conditional_entry_point(
            self._route_intent,
            {
                "next_topic": "recommend_topic_node",
                "study_kit": "study_kit_node",
                "remediation": "remediation_node",
                "exam_roadmap": "exam_roadmap_node",
                "update_progress": "update_progress_node",
            },
        )

        # 3. Add Edges to END
        graph.add_edge("recommend_topic_node", END)
        graph.add_edge("study_kit_node", END)
        graph.add_edge("remediation_node", END)
        graph.add_edge("exam_roadmap_node", END)
        graph.add_edge("update_progress_node", END)

        return graph.compile()

    def _route_intent(self, state: AgentState) -> str:
        intent = state.get("intent", "next_topic")
        logger.info(f"Routing agent intent: '{intent}'")
        return intent

    def _node_recommend_topic(self, state: AgentState) -> Dict[str, Any]:
        learner_id = state.get("learner_id", "default_learner")
        rec = self.progress_tracker.recommend_next_topic(learner_id=learner_id)
        return {"output": rec}

    def _node_study_kit(self, state: AgentState) -> Dict[str, Any]:
        topic_id = state.get("topic_id", "")
        kit_type = state.get("kit_type", "quiz")
        count = state.get("count", 3)

        if kit_type in ("flashcards", "flashcard"):
            result = self.study_kit_generator.generate_flashcards(topic_id=topic_id, count=count)
        elif kit_type == "summary":
            result = self.study_kit_generator.generate_summary(topic_id=topic_id)
        elif kit_type == "problem_guide":
            result = self.study_kit_generator.generate_problem_guide(topic_id=topic_id)
        else:
            result = self.study_kit_generator.generate_quiz(topic_id=topic_id, count=count)

        return {"output": result}

    def _node_remediation(self, state: AgentState) -> Dict[str, Any]:
        topic_id = state.get("topic_id", "")
        learner_id = state.get("learner_id", "default_learner")
        result = self.remediation_tool.generate_remediation(topic_id=topic_id, learner_id=learner_id)
        return {"output": result}

    def _node_exam_roadmap(self, state: AgentState) -> Dict[str, Any]:
        exam_id = state.get("exam_id", "")
        learner_id = state.get("learner_id", "default_learner")
        result = self.exam_tool.generate_roadmap(exam_id=exam_id, learner_id=learner_id)
        return {"output": result}

    def _node_update_progress(self, state: AgentState) -> Dict[str, Any]:
        learner_id = state.get("learner_id", "default_learner")
        topic_id = state.get("topic_id", "")
        score = state.get("score", 0.0)
        result = self.progress_tracker.record_attempt(learner_id=learner_id, topic_id=topic_id, score=score)
        return {"output": result}

    def run(self, state: AgentState) -> AgentState:
        """Executes the compiled LangGraph agent workflow."""
        return self.workflow.invoke(state)
