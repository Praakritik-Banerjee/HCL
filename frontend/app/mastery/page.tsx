"use client";

import React, { useState, useEffect } from "react";
import { useLearner } from "@/context/LearnerContext";
import { apiService } from "@/services/api";
import { MasteryDashboardResponse } from "@/types";
import RemediationModal from "@/components/RemediationModal";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function MasteryPage() {
  const { learnerId } = useLearner();
  const [data, setData] = useState<MasteryDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Remediation modal state
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadMastery();
  }, [learnerId]);

  const loadMastery = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMasteryDashboard(learnerId);
      setData(res);
    } catch (err) {
      console.error("Failed to load mastery data:", err);
    } finally {
      setLoading(false);
    }
  };

  const masteredCount = data?.topics?.filter((t) => t.status === "mastered").length || 0;
  const inProgressCount = data?.topics?.filter((t) => t.status === "in_progress").length || 0;
  const strugglingCount = data?.topics?.filter((t) => t.status === "struggling").length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Knowledge Analytics
        </span>
        <h1 className="text-2xl font-extrabold text-white mt-1">
          Mastery Dashboard & Progress Tracking
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
          Real-time mastery status evaluated through exponential moving averages of quiz performance and prerequisite checks.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/5">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Overall Mastery</span>
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {data ? `${Math.round(data.overall_mastery * 100)}%` : "0%"}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(data?.overall_mastery || 0) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
            <span>Mastered Topics</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 mt-2">
            {masteredCount}
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2">Score ≥ 80%</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-primary-500/20 bg-primary-950/10">
          <div className="text-xs font-semibold text-primary-300 flex items-center justify-between">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-3xl font-black text-primary-300 mt-2">
            {inProgressCount}
          </div>
          <p className="text-[11px] text-primary-400/80 mt-2">Active syllabus units</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
            <span>Struggling Topics</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300 mt-2">
            {strugglingCount}
          </div>
          <p className="text-[11px] text-amber-400/80 mt-2">&lt; 60% consecutively</p>
        </div>
      </div>

      {/* Topics Breakdown Table / Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Topic-by-Topic Mastery Breakdown ({data?.topics?.length || 0})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading mastery statistics...
          </div>
        ) : data && data.topics && data.topics.length > 0 ? (
          <div className="space-y-3">
            {data.topics.map((t) => {
              const pct = Math.round(t.mastery_score * 100);
              const isStruggling = t.status === "struggling";
              const isMastered = t.status === "mastered";

              return (
                <div
                  key={t.topic_id}
                  className={`glass-card p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isStruggling
                      ? "border-amber-500/30 bg-amber-950/10"
                      : isMastered
                      ? "border-emerald-500/20"
                      : "border-white/5"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-semibold text-white">
                        {t.topic_title}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          isMastered
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : isStruggling
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700/50"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <div className="flex items-center gap-2 w-48">
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isMastered
                                ? "bg-emerald-400"
                                : isStruggling
                                ? "bg-amber-400"
                                : "bg-primary-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-white text-xs">{pct}%</span>
                      </div>
                      <span>•</span>
                      <span>{t.attempts} Attempt{t.attempts !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isStruggling && (
                      <button
                        onClick={() =>
                          setSelectedTopic({ id: t.topic_id, title: t.topic_title })
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Remediate
                      </button>
                    )}

                    <Link
                      href={`/study?topic_id=${t.topic_id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Study
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-2xl text-center text-xs text-slate-400">
            No quiz attempts recorded yet. Head over to the Study Studio to take quizzes and track your mastery.
          </div>
        )}
      </div>

      {selectedTopic && (
        <RemediationModal
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.title}
          learnerId={learnerId}
          isOpen={true}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}
