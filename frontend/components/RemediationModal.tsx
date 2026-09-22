"use client";

import React, { useState, useEffect } from "react";
import { RemediationResponse } from "@/types";
import { apiService } from "@/services/api";
import {
  X,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";

interface RemediationModalProps {
  topicId: string;
  topicTitle?: string;
  learnerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RemediationModal({
  topicId,
  topicTitle,
  learnerId,
  isOpen,
  onClose,
}: RemediationModalProps) {
  const [data, setData] = useState<RemediationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Practice question checks
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: string }>({});
  const [revealed, setRevealed] = useState<{ [qIdx: number]: boolean }>({});

  useEffect(() => {
    if (isOpen && topicId) {
      loadRemediation();
    }
  }, [isOpen, topicId]);

  const loadRemediation = async () => {
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setRevealed({});
    try {
      const res = await apiService.triggerRemediation(learnerId, topicId);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate remediation package.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="glass-panel border border-amber-500/30 max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Adaptive Remediation
            </span>
            <h2 className="text-xl font-bold text-white">
              {topicTitle || data?.topic_title || "Struggle Breakdown"}
            </h2>
          </div>
        </div>

        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">
              Generating simplified concept breakdown & targeted checks...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Real-World Analogy */}
            {data.analogy && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Intuitive Real-World Analogy
                </div>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  "{data.analogy}"
                </p>
              </div>
            )}

            {/* Concept Breakdown */}
            <div className="glass-card p-5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-300 mb-2.5">
                <BookOpen className="w-4 h-4 text-primary-400" />
                Step-by-Step Concept Breakdown
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {data.breakdown}
              </p>
            </div>

            {/* Targeted Practice Checks */}
            {data.practice_questions && data.practice_questions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Confidence Checks ({data.practice_questions.length})
                </h4>
                <div className="space-y-4">
                  {data.practice_questions.map((pq, pIdx) => {
                    const chosen = selectedAnswers[pIdx];
                    const isCheckRevealed = revealed[pIdx];
                    const isCorrect =
                      isCheckRevealed &&
                      (chosen?.toLowerCase() === pq.correct_answer.toLowerCase() ||
                        (pq.correct_answer.length === 1 &&
                          chosen?.toLowerCase().startsWith(pq.correct_answer.toLowerCase())));

                    return (
                      <div
                        key={pIdx}
                        className="glass-card p-4 rounded-2xl border border-white/5 space-y-3"
                      >
                        <p className="text-sm font-medium text-slate-200">
                          {pIdx + 1}. {pq.question}
                        </p>

                        <div className="space-y-1.5">
                          {pq.options.map((opt, oIdx) => {
                            const isSelected = chosen === opt;
                            const isAnswer =
                              isCheckRevealed &&
                              (opt.toLowerCase() === pq.correct_answer.toLowerCase() ||
                                (pq.correct_answer.length === 1 &&
                                  opt.toLowerCase().startsWith(pq.correct_answer.toLowerCase())));

                            let cName =
                              "p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ";

                            if (!isCheckRevealed) {
                              cName += isSelected
                                ? "bg-amber-500/20 border-amber-500/50 text-white font-medium"
                                : "bg-slate-900/40 border-white/5 text-slate-300 hover:bg-white/[0.03]";
                            } else {
                              if (isAnswer) {
                                cName +=
                                  "bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold";
                              } else if (isSelected && !isAnswer) {
                                cName +=
                                  "bg-rose-500/20 border-rose-500/60 text-rose-200 line-through";
                              } else {
                                cName += "bg-slate-900/30 border-white/5 text-slate-500 opacity-60";
                              }
                            }

                            return (
                              <div
                                key={oIdx}
                                onClick={() => {
                                  if (!isCheckRevealed) {
                                    setSelectedAnswers((prev) => ({ ...prev, [pIdx]: opt }));
                                  }
                                }}
                                className={cName}
                              >
                                <span>{opt}</span>
                                {isCheckRevealed && isAnswer && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                {isCheckRevealed && isSelected && !isAnswer && (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!isCheckRevealed ? (
                          <button
                            onClick={() =>
                              setRevealed((prev) => ({ ...prev, [pIdx]: true }))
                            }
                            disabled={!chosen}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold disabled:opacity-40 transition-colors"
                          >
                            Check Answer
                          </button>
                        ) : (
                          pq.explanation && (
                            <div className="p-3 rounded-xl bg-slate-900/60 text-xs text-slate-400 border border-white/5 leading-relaxed">
                              <span className="font-semibold text-slate-300">Explanation: </span>
                              {pq.explanation}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
