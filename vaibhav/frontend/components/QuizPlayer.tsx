"use client";

import React, { useState } from "react";
import { QuizResponse } from "@/types";
import { apiService } from "@/services/api";
import CitationDrawer from "./CitationDrawer";
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface QuizPlayerProps {
  quiz: QuizResponse;
  learnerId: string;
  onFinished?: () => void;
  onStruggleTriggered?: (topicId: string, topicTitle: string) => void;
}

export default function QuizPlayer({
  quiz,
  learnerId,
  onFinished,
  onStruggleTriggered,
}: QuizPlayerProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    correctCount: number;
    total: number;
    scoreRatio: number;
    struggleDetected: boolean;
    newMastery?: number;
  } | null>(null);

  // Citation Modal state
  const [selectedCitations, setSelectedCitations] = useState<string[]>([]);
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  const handleSelectOption = (qIdx: number, option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < quiz.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const getCorrectText = (q: any) => {
      if (q.correct_answer) return q.correct_answer;
      if (q.correct_answer_index !== undefined && q.options && q.options[q.correct_answer_index]) {
        return q.options[q.correct_answer_index];
      }
      return "";
    };

    setSubmitting(true);
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx]?.trim().toLowerCase() || "";
      const expected = getCorrectText(q).trim().toLowerCase();
      // handle either exact text match or single letter match
      if (
        selected === expected ||
        (expected.length === 1 && selected.startsWith(expected + ".")) ||
        (expected.length === 1 && selected.startsWith(expected + ")"))
      ) {
        correct++;
      }
    });

    const scoreRatio = correct / quiz.questions.length;
    setIsSubmitted(true);

    try {
      const res = await apiService.updateProgress(learnerId, quiz.topic_id, scoreRatio);
      const isStruggling = res.struggle_detected || res.remediation_triggered || false;
      const masteryVal = res.new_mastery !== undefined ? res.new_mastery : res.new_mastery_score;

      setScoreResult({
        correctCount: correct,
        total: quiz.questions.length,
        scoreRatio,
        struggleDetected: isStruggling,
        newMastery: masteryVal,
      });

      if (isStruggling && onStruggleTriggered) {
        onStruggleTriggered(quiz.topic_id, quiz.topic_title);
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
      setScoreResult({
        correctCount: correct,
        total: quiz.questions.length,
        scoreRatio,
        struggleDetected: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScoreResult(null);
  };

  const getCorrectText = (q: any) => {
    if (q.correct_answer) return q.correct_answer;
    if (q.correct_answer_index !== undefined && q.options && q.options[q.correct_answer_index]) {
      return q.options[q.correct_answer_index];
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-primary-400 uppercase">
            Active Quiz Session
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5">
            {quiz.topic_title || "Topic Evaluation"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {quiz.questions.length} Questions • Grounded in syllabus chunks
          </p>
        </div>

        {scoreResult && (
          <div className="text-right">
            <div className="text-2xl font-extrabold text-white">
              {Math.round(scoreResult.scoreRatio * 100)}%
            </div>
            <div className="text-xs text-slate-400">
              {scoreResult.correctCount} / {scoreResult.total} Correct
            </div>
          </div>
        )}
      </div>

      {/* Struggle Alert Banner if triggered */}
      {scoreResult?.struggleDetected && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-300">
              Struggle Signal Detected!
            </h4>
            <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
              Two consecutive scores below 60% detected for this topic. An adaptive remediation package has been queued to break down core concepts with real-world analogies.
            </p>
            {onStruggleTriggered && (
              <button
                onClick={() => onStruggleTriggered(quiz.topic_id, quiz.topic_title)}
                className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Launch Remedial Practice Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {quiz.questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const expectedAns = getCorrectText(q);
          const isCorrect =
            isSubmitted &&
            (selected?.toLowerCase() === expectedAns.toLowerCase() ||
              (expectedAns.length === 1 &&
                selected?.toLowerCase().startsWith(expectedAns.toLowerCase())));

          return (
            <div
              key={qIdx}
              className={`glass-card p-6 rounded-2xl border transition-all ${
                isSubmitted
                  ? isCorrect
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : "border-rose-500/40 bg-rose-950/10"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-primary-400 text-xs font-bold flex items-center justify-center border border-white/10">
                    {qIdx + 1}
                  </span>
                  <h3 className="text-base font-medium text-slate-100 leading-snug">
                    {q.question}
                  </h3>
                </div>

                {/* Grounding Source Badge */}
                {q.source_chunk_ids && q.source_chunk_ids.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedCitations(q.source_chunk_ids);
                      setIsCitationOpen(true);
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-300 border border-primary-500/20 text-[11px] hover:bg-primary-500/20 transition-colors"
                    title="View grounded syllabus chunks"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{q.source_chunk_ids.length} Citation{q.source_chunk_ids.length > 1 ? "s" : ""}</span>
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((opt, oIdx) => {
                  const isThisSelected = selected === opt;
                  const isThisAnswer =
                    isSubmitted &&
                    (opt.toLowerCase() === expectedAns.toLowerCase() ||
                      (expectedAns.length === 1 &&
                        opt.toLowerCase().startsWith(expectedAns.toLowerCase())));


                  let optClass =
                    "p-3.5 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition-all ";

                  if (!isSubmitted) {
                    optClass += isThisSelected
                      ? "bg-primary-600/20 border-primary-500/60 text-white font-medium"
                      : "bg-slate-900/50 border-white/5 text-slate-300 hover:bg-white/[0.04]";
                  } else {
                    if (isThisAnswer) {
                      optClass += "bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold";
                    } else if (isThisSelected && !isThisAnswer) {
                      optClass += "bg-rose-500/20 border-rose-500/60 text-rose-200 line-through";
                    } else {
                      optClass += "bg-slate-900/30 border-white/5 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(qIdx, opt)}
                      className={optClass}
                    >
                      <span>{opt}</span>
                      {isSubmitted && isThisAnswer && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {isSubmitted && isThisSelected && !isThisAnswer && (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation (revealed upon submission) */}
              {isSubmitted && q.explanation && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300">
                  <div className="font-semibold text-primary-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                    Explanation
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {submitting ? "Scoring & Updating Mastery..." : "Submit Answers"}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Quiz
            </button>
            {onFinished && (
              <button
                onClick={onFinished}
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
              >
                Back to Studio
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grounded Citation Modal */}
      <CitationDrawer
        chunkIds={selectedCitations}
        topicTitle={quiz.topic_title}
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
      />
    </div>
  );
}
