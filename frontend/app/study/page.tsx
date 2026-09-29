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
  CheckCircle2,
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
        // Try getting recommended next topic
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
      setErrorMessage(
        err.response?.data?.detail || "Failed to generate study kit. Check backend connection."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
          Intelligent Learning Kits
        </span>
        <h1 className="text-2xl font-extrabold text-white mt-1">
          Study Kit Studio
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
          Generate grounded quizzes, flashcards, summaries, and problem solving guides verified against syllabus chunks with zero hallucinations.
        </p>
      </div>

      {/* Configuration Bar */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Topic ID & Dropdown */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Select or Enter Topic
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
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
                >
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.id})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  placeholder="Or enter ID..."
                  className="w-44 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500/50"
                />
              </div>
            ) : (
              <input
                type="text"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                placeholder="e.g. top_1, binary_search, topic_chunk_1"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
              />
            )}
          </div>


          {/* Question / Card Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Item Count
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50"
            >
              <option value={3}>3 Items</option>
              <option value={5}>5 Items</option>
              <option value={8}>8 Items</option>
            </select>
          </div>
        </div>

        {/* Kit Type Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
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
                      ? "bg-primary-600/20 border-primary-500/50 shadow-inner"
                      : "bg-slate-900/40 border-white/5 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-primary-400" : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {kit.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{kit.desc}</p>
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
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>RAG Retrieval & Generation in progress...</span>
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
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-300">
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
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-primary-400 uppercase tracking-wider">
                Grounded Markdown Summary
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
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

          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line pt-2 border-t border-white/5">
            {summaryData.summary_markdown || summaryData.summary}
          </div>

        </div>
      )}

      {problemGuideData && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                Problem-Solving Guide
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {problemGuideData.topic_title || "Algorithmic Walkthrough"}
              </h2>
            </div>

            {problemGuideData.source_chunk_ids && problemGuideData.source_chunk_ids.length > 0 && (
              <button
                onClick={() => {
                  setActiveCitations(problemGuideData.source_chunk_ids);
                  setCitationModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs hover:bg-indigo-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{problemGuideData.source_chunk_ids.length} Citations</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/25">
            <span className="text-xs font-bold text-indigo-300 block mb-1">
              Problem Statement
            </span>
            <p className="text-sm text-slate-200">
              {problemGuideData.problem_statement}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step-by-Step Reasoning
            </h4>
            {problemGuideData.steps.map((step, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-2xl border border-white/5 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                    {step.step_number || idx + 1}
                  </span>
                  <h5 className="text-sm font-semibold text-white">
                    {step.title}
                  </h5>
                </div>
                <p className="text-xs text-slate-300 pl-8 leading-relaxed">
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
    <Suspense fallback={<div className="text-slate-400 text-xs">Loading Study Studio...</div>}>
      <StudyStudioContent />
    </Suspense>
  );
}
