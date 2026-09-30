"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import { apiService } from "@/services/api";
import {
  QuizResponse,
  FlashcardResponse,
  SummaryResponse,
  ProblemGuideResponse,
} from "@/types";
import QuizPlayer from "@/components/QuizPlayer";
import FlashcardViewer from "@/components/FlashcardViewer";
import RemediationModal from "@/components/RemediationModal";
import CitationDrawer from "@/components/CitationDrawer";
import {
  Sparkles,
  HelpCircle,
  Layers,
  FileText,
  ListOrdered,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

function StudyStudioContent() {
  const searchParams = useSearchParams();
  const { learnerId } = useLearner();

  const [topicId, setTopicId] = useState<string>(searchParams.get("topic_id") || "");
  const [kitType, setKitType] = useState<"quiz" | "flashcard" | "summary" | "problem_guide">("quiz");
  const [count, setCount] = useState<number>(3);
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generated outputs
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [flashcardData, setFlashcardData] = useState<FlashcardResponse | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [problemGuideData, setProblemGuideData] = useState<ProblemGuideResponse | null>(null);

  // Remediation trigger
  const [remedialTopic, setRemedialTopic] = useState<{ id: string; title: string } | null>(null);

  // Citations modal
  const [activeCitations, setActiveCitations] = useState<string[]>([]);
  const [citationModalOpen, setCitationModalOpen] = useState<boolean>(false);

  // Available syllabus topics dropdown
  const [availableTopics, setAvailableTopics] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const urlTopic = searchParams.get("topic_id");
    if (urlTopic) {
      setTopicId(urlTopic);
    }
    loadTopics();
  }, [searchParams, learnerId]);

  const loadTopics = async () => {
    try {
      const res = await apiService.getMasteryDashboard(learnerId);
      let mapped: { id: string; title: string }[] = [];
      if (res && res.topics && res.topics.length > 0) {
        mapped = res.topics.map((t) => ({ id: t.topic_id, title: t.topic_title || t.title || t.topic_id }));
        setAvailableTopics(mapped);
      }

      const urlTopic = searchParams.get("topic_id");
      if (!urlTopic && !topicId) {
        try {
          const rec = await apiService.getNextTopic(learnerId);
          if (rec && rec.topic_id) {
            setTopicId(rec.topic_id);
          } else if (mapped.length > 0) {
            setTopicId(mapped[0].id);
          }
        } catch {
          if (mapped.length > 0) {
            setTopicId(mapped[0].id);
          }
        }
      }
    } catch {
      // ignore fallback
    }
  };

  const handleGenerate = async () => {
    if (!topicId.trim()) {
      setErrorMessage("Please enter or select a Topic ID.");
      return;
    }

    setGenerating(true);
    setErrorMessage(null);
    setQuizData(null);
    setFlashcardData(null);
    setSummaryData(null);
    setProblemGuideData(null);

    try {
      const res = await apiService.generateStudyKit(topicId.trim(), kitType, count);

      if (kitType === "quiz") {
        setQuizData(res as QuizResponse);
      } else if (kitType === "flashcard") {
        setFlashcardData(res as FlashcardResponse);
      } else if (kitType === "summary") {
        setSummaryData(res as SummaryResponse);
      } else if (kitType === "problem_guide") {
        setProblemGuideData(res as ProblemGuideResponse);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to generate study kit. Please try selecting a topic.";
      setErrorMessage(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400">
          Intelligent Learning Kits
        </span>
        <h1 className="text-3xl font-extrabold text-warm-100 mt-1 font-display">
          Study Studio
        </h1>
        <p className="text-xs text-warm-400 mt-1 max-w-xl leading-relaxed">
          Generate grounded quizzes, flashcards, summaries, and problem solving guides verified against syllabus chunks with zero hallucinations.
        </p>
      </div>

      {/* Configuration Bar */}
      <div className="glass-card p-6 rounded-3xl border border-warm-800/30 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Topic ID & Dropdown */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-warm-300">
                Select or Search Topic
              </label>
              {availableTopics.length > 0 && (
                <span className="text-[11px] text-primary-400 font-medium">
                  {availableTopics.length} Syllabus Topic(s) Loaded
                </span>
              )}
            </div>
            {availableTopics.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full bg-warm-950 border border-warm-800/40 rounded-xl px-4 py-2.5 text-xs text-warm-100 focus:outline-none focus:border-primary-500/50"
                >
                  {!availableTopics.some((t) => t.id === topicId) && topicId && (
                    <option value={topicId}>Custom: {topicId}</option>
                  )}
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  placeholder="Or search by title..."
                  className="w-48 bg-warm-950 border border-warm-800/40 rounded-xl px-3 py-2.5 text-xs text-warm-100 focus:outline-none focus:border-primary-500/50"
                />
              </div>
            ) : (
              <input
                type="text"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                placeholder="e.g. top_1, binary_search, electrostatic"
                className="w-full bg-warm-950 border border-warm-800/40 rounded-xl px-4 py-2.5 text-xs text-warm-100 focus:outline-none focus:border-primary-500/50"
              />
            )}
          </div>

          {/* Question / Card Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-warm-300">
              Item Count
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-warm-950 border border-warm-800/40 rounded-xl px-4 py-2.5 text-xs text-warm-100 focus:outline-none focus:border-primary-500/50"
            >
              <option value={3}>3 Items</option>
              <option value={5}>5 Items</option>
              <option value={8}>8 Items</option>
            </select>
          </div>
        </div>

        {/* Kit Type Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-warm-300">
            Study Kit Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: "quiz", label: "Quiz Evaluation", icon: HelpCircle, desc: "MCQ with citations" },
              { type: "flashcard", label: "Flashcards", icon: Layers, desc: "3D interactive flip" },
              { type: "summary", label: "Summary Notes", icon: FileText, desc: "Grounded notes" },
              { type: "problem_guide", label: "Problem Guide", icon: ListOrdered, desc: "Step-by-step guide" },
            ].map((kit) => {
              const Icon = kit.icon;
              const isSelected = kitType === kit.type;
              return (
                <div
                  key={kit.type}
                  onClick={() => setKitType(kit.type as any)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary-500/15 border-primary-500/30"
                      : "bg-warm-950/40 border-warm-800/30 hover:bg-warm-900/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-primary-400" : "text-warm-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-warm-100" : "text-warm-300"
                      }`}
                    >
                      {kit.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-warm-500">{kit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 rounded-2xl bg-primary-500 hover:bg-primary-400 text-warm-950 font-semibold text-xs shadow-lg shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>RAG Retrieval & Generation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Grounded {kitType.replace("_", " ")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-accent-rose/10 border border-accent-rose/20 flex items-center gap-3 text-xs text-accent-rose">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Render Outputs */}
      {quizData && (
        <QuizPlayer
          quiz={quizData}
          learnerId={learnerId}
          onStruggleTriggered={(id, title) => setRemedialTopic({ id, title })}
        />
      )}

      {flashcardData && <FlashcardViewer deck={flashcardData} />}

      {summaryData && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-warm-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">
                Grounded Markdown Summary
              </span>
              <h2 className="text-xl font-bold text-warm-100 mt-0.5 font-display">
                {summaryData.topic_title || "Key Concept Summary"}
              </h2>
            </div>

            {summaryData.source_chunk_ids && summaryData.source_chunk_ids.length > 0 && (
              <button
                onClick={() => {
                  setActiveCitations(summaryData.source_chunk_ids);
                  setCitationModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-300 border border-primary-500/20 text-xs hover:bg-primary-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{summaryData.source_chunk_ids.length} Citations</span>
              </button>
            )}
          </div>

          <div className="prose prose-invert max-w-none text-warm-300 text-sm leading-relaxed whitespace-pre-line pt-2 border-t border-warm-800/30">
            {summaryData.summary_markdown || summaryData.summary}
          </div>
        </div>
      )}

      {problemGuideData && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-warm-800/30 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">
                Problem-Solving Guide
              </span>
              <h2 className="text-xl font-bold text-warm-100 mt-0.5 font-display">
                {problemGuideData.topic_title || "Algorithmic Walkthrough"}
              </h2>
            </div>

            {problemGuideData.source_chunk_ids && problemGuideData.source_chunk_ids.length > 0 && (
              <button
                onClick={() => {
                  setActiveCitations(problemGuideData.source_chunk_ids);
                  setCitationModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-300 border border-primary-500/20 text-xs hover:bg-primary-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{problemGuideData.source_chunk_ids.length} Citations</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-warm-950/80 border border-warm-800/40">
            <span className="text-xs font-bold text-primary-400 block mb-1">
              Problem Statement
            </span>
            <p className="text-sm text-warm-200">
              {problemGuideData.problem_statement}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-warm-500">
              Step-by-Step Reasoning
            </h4>
            {problemGuideData.steps.map((step, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-2xl border border-warm-800/30 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary-500/20 text-primary-300 font-mono text-xs font-bold flex items-center justify-center border border-primary-500/30">
                    {step.step_number || idx + 1}
                  </span>
                  <h5 className="text-sm font-semibold text-warm-100">
                    {step.title}
                  </h5>
                </div>
                <p className="text-xs text-warm-300 pl-8 leading-relaxed">
                  {step.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remediation Modal */}
      {remedialTopic && (
        <RemediationModal
          topicId={remedialTopic.id}
          topicTitle={remedialTopic.title}
          learnerId={learnerId}
          isOpen={true}
          onClose={() => setRemedialTopic(null)}
        />
      )}

      {/* Citations Modal */}
      <CitationDrawer
        chunkIds={activeCitations}
        isOpen={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
      />
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="text-warm-500 text-xs">Loading Study Studio...</div>}>
      <StudyStudioContent />
    </Suspense>
  );
}
