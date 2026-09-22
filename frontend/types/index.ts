export interface Topic {
  id: string;
  syllabus_id: string;
  title: string;
  description?: string;
  parent_id?: string | null;
  prerequisites: string[];
  order_index: number;
}

export interface KnowledgeGraphResponse {
  syllabus_id: string;
  topics: Topic[];
  total_topics: number;
}

export interface NextTopicResponse {
  status: string;
  topic_id?: string;
  topic_title?: string;
  description?: string;
  prerequisites_met: boolean;
  current_mastery: number;
  message: string;
}

export interface TopicMastery {
  topic_id: string;
  topic_title: string;
  mastery_score: number;
  status: "mastered" | "in_progress" | "struggling" | "not_started";
  attempts: number;
  last_attempt_at?: string;
}

export interface MasteryDashboardResponse {
  learner_id: string;
  overall_mastery: number;
  topics: TopicMastery[];
  struggling_topics_count: number;
}

export interface ProgressUpdateResponse {
  learner_id: string;
  topic_id: string;
  new_mastery: number;
  struggle_detected: boolean;
  message: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_chunk_ids: string[];
}

export interface QuizResponse {
  topic_id: string;
  topic_title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  front: string;
  back: string;
  source_chunk_ids: string[];
}

export interface FlashcardResponse {
  topic_id: string;
  topic_title: string;
  cards: Flashcard[];
}

export interface SummaryResponse {
  topic_id: string;
  topic_title: string;
  summary: string;
  source_chunk_ids: string[];
}

export interface ProblemGuideStep {
  step_number: number;
  title: string;
  explanation: string;
}

export interface ProblemGuideResponse {
  topic_id: string;
  topic_title: string;
  problem_statement: string;
  steps: ProblemGuideStep[];
  source_chunk_ids: string[];
}

export interface PracticeQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface RemediationResponse {
  topic_id: string;
  topic_title: string;
  breakdown: string;
  analogy: string;
  practice_questions: PracticeQuestion[];
}

export interface RoadmapEntry {
  day_number: number;
  date: string;
  topic_id: string;
  topic_title: string;
  target_task: string;
  status: string;
}

export interface RoadmapResponse {
  learner_id: string;
  subject_name: string;
  exam_date: string;
  days_remaining: number;
  is_active: boolean;
  is_repaced: boolean;
  entries: RoadmapEntry[];
}
