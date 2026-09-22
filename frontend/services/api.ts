import axios from "axios";
import {
  KnowledgeGraphResponse,
  NextTopicResponse,
  MasteryDashboardResponse,
  ProgressUpdateResponse,
  QuizResponse,
  FlashcardResponse,
  SummaryResponse,
  ProblemGuideResponse,
  RemediationResponse,
  RoadmapResponse,
} from "@/types";

// Use the Next.js same-origin rewrite proxy to avoid CORS issues.
// next.config.mjs maps /api/backend/:path* → http://127.0.0.1:8080/api/:path*
const API_BASE = "/api/backend/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const apiService = {
  // Ingestion & Knowledge Graph
  uploadSyllabus: async (file: File): Promise<{ syllabus_id: string; message: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/syllabus/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = res.data?.data || res.data;
    return {
      syllabus_id: payload.document_id || payload.syllabus_id,
      message: res.data?.message || payload.message || "Syllabus uploaded successfully!",
      filename: file.name,
    };
  },

  getKnowledgeGraph: async (syllabusId: string): Promise<KnowledgeGraphResponse> => {
    const res = await apiClient.get(`/syllabus/${syllabusId}/graph`);
    const graphData = res.data?.data || res.data;

    // Flatten tree nodes into a clean list of topics
    const flatTopics: any[] = [];
    const traverse = (nodes: any[]) => {
      for (const n of nodes) {
        flatTopics.push({
          id: n.id,
          syllabus_id: syllabusId,
          title: n.title,
          description: n.description || "",
          parent_id: n.parent_id,
          prerequisites: n.prerequisites || [],
          order_index: n.order_index || 0,
        });
        if (n.children && n.children.length > 0) {
          traverse(n.children);
        }
      }
    };
    traverse(graphData.topics || []);

    return {
      syllabus_id: graphData.document_id || syllabusId,
      topics: flatTopics,
      total_topics: graphData.total_nodes || flatTopics.length,
    };
  },

  // Progress & Recommendation
  getNextTopic: async (learnerId: string): Promise<NextTopicResponse> => {
    const res = await apiClient.get(`/progress/next-topic?learner_id=${encodeURIComponent(learnerId)}`);
    return res.data;
  },

  updateProgress: async (learnerId: string, topicId: string, score: number): Promise<ProgressUpdateResponse> => {
    const res = await apiClient.post("/progress/update", {
      learner_id: learnerId,
      topic_id: topicId,
      score,
    });
    return res.data;
  },

  getMasteryDashboard: async (learnerId: string): Promise<MasteryDashboardResponse> => {
    const res = await apiClient.get(`/progress/mastery?learner_id=${encodeURIComponent(learnerId)}`);
    return res.data;
  },

  // Study Kit Generation
  generateStudyKit: async (
    topicId: string,
    kitType: "quiz" | "flashcard" | "summary" | "problem_guide",
    count: number = 3
  ): Promise<QuizResponse | FlashcardResponse | SummaryResponse | ProblemGuideResponse> => {
    const res = await apiClient.post("/study-kit/generate", {
      topic_id: topicId,
      kit_type: kitType,
      count,
    });
    return res.data;
  },

  // Remediation
  triggerRemediation: async (learnerId: string, topicId: string): Promise<RemediationResponse> => {
    const res = await apiClient.post("/remediation/trigger", {
      learner_id: learnerId,
      topic_id: topicId,
    });
    return res.data;
  },

  // Exam Mode
  setupExamMode: async (
    learnerId: string,
    subjectName: string,
    examDate: string,
    units?: { unit_label: string; weight?: number }[]
  ): Promise<RoadmapResponse> => {
    const res = await apiClient.post("/exam-mode/setup", {
      learner_id: learnerId,
      subject_name: subjectName,
      exam_date: examDate,
      units: units || [],
    });
    return res.data;
  },

  getExamRoadmap: async (learnerId: string): Promise<RoadmapResponse> => {
    const res = await apiClient.get(`/exam-mode/roadmap?learner_id=${encodeURIComponent(learnerId)}`);
    return res.data;
  },

  toggleExamMode: async (learnerId: string, isActive: boolean): Promise<RoadmapResponse> => {
    const res = await apiClient.patch("/exam-mode/toggle", {
      learner_id: learnerId,
      is_active: isActive,
    });
    return res.data;
  },
};
