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
  AuthResponse,
} from "@/types";

// Use the Next.js same-origin rewrite proxy to avoid CORS issues.
// next.config.mjs maps /api/backend/:path* → http://127.0.0.1:8080/api/:path*
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

function unwrapData<T>(res: any): T {
  if (res && res.data && typeof res.data === "object") {
    if ("data" in res.data && res.data.data !== null && res.data.data !== undefined) {
      return res.data.data as T;
    }
    return res.data as T;
  }
  return res as T;
}

export const apiService = {
  // User Authentication
  register: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const res = await apiClient.post("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    return unwrapData<AuthResponse>(res);
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return unwrapData<AuthResponse>(res);
  },

  // Ingestion & Knowledge Graph
  uploadSyllabus: async (file: File): Promise<{ syllabus_id: string; message: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/syllabus/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = unwrapData<any>(res);
    return {
      syllabus_id: payload.document_id || payload.syllabus_id || payload.id,
      message: res.data?.message || payload.message || "Syllabus uploaded successfully!",
      filename: file.name,
    };
  },

  getKnowledgeGraph: async (syllabusId: string): Promise<KnowledgeGraphResponse> => {
    const res = await apiClient.get(`/syllabus/${syllabusId}/graph`);
    const graphData = unwrapData<any>(res);

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
    return unwrapData<NextTopicResponse>(res);
  },

  updateProgress: async (learnerId: string, topicId: string, score: number): Promise<ProgressUpdateResponse> => {
    const res = await apiClient.post("/progress/update", {
      learner_id: learnerId,
      topic_id: topicId,
      score,
    });
    return unwrapData<ProgressUpdateResponse>(res);
  },

  getMasteryDashboard: async (learnerId: string): Promise<MasteryDashboardResponse> => {
    const res = await apiClient.get(`/progress/mastery?learner_id=${encodeURIComponent(learnerId)}`);
    return unwrapData<MasteryDashboardResponse>(res);
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
    return unwrapData<any>(res);
  },

  // Remediation
  triggerRemediation: async (learnerId: string, topicId: string): Promise<RemediationResponse> => {
    const res = await apiClient.post("/remediation/trigger", {
      learner_id: learnerId,
      topic_id: topicId,
    });
    return unwrapData<RemediationResponse>(res);
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
    return unwrapData<RoadmapResponse>(res);
  },

  getExamRoadmap: async (learnerId: string): Promise<RoadmapResponse> => {
    const res = await apiClient.get(`/exam-mode/roadmap?learner_id=${encodeURIComponent(learnerId)}`);
    return unwrapData<RoadmapResponse>(res);
  },

  toggleExamMode: async (learnerId: string, isActive: boolean): Promise<any> => {
    const res = await apiClient.patch("/exam-mode/toggle", {
      learner_id: learnerId,
      is_active: isActive,
    });
    return unwrapData<any>(res);
  },
};

