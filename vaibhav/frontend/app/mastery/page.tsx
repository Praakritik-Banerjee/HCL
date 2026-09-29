"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, learnerId } = useLearner();
  const [data, setData] = useState<MasteryDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("padhaimate_user");
    if (!user && !storedUser) {
      router.push("/login");
      return;
    }
    if (learnerId) {
      loadMastery();
    }
  }, [user, learnerId]);

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
          Knowledge Gap Analytics
        </span>
        <h1 className="text-2xl font-extrabold text-white mt-1">
          Mastery Dashboard & Gap Analysis
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
          Track real-time topic mastery scores, identify struggle patterns, and launch targeted remediation workflows.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Overall Mastery</span>
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {data ? `${Math.round(data.overall_mastery * 100)}%` : "0%"}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(data?.overall_mastery || 0) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Mastered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{masteredCount}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            Score ≥ 80%
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">{inProgressCount}</div>
          <div className="text-[11px] text-cyan-400 font-medium mt-1">
            Active Study Pathways
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Struggling</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{strugglingCount}</div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            2 Consecutive Scores &lt; 60%
          </div>
        </div>
      </div>

      {/* Topic Breakdown List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          Topic Mastery Breakdown
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 rounded-2xl animate-pulse h-20 bg-slate-900/50" />
            ))}
          </div>
        ) : data && data.topics && data.topics.length > 0 ? (
          <div className="space-y-3">
            {data.topics.map((t) => {
              const scorePct = Math.round(t.mastery_score * 100);
              let statusBadge = (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Not Started
                </span>
              );
              if (t.status === "mastered") {
                statusBadge = (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Mastered ({scorePct}%)
                  </span>
                );
              } else if (t.status === "struggling") {
                statusBadge = (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    Remediation Queued
                  </span>
                );
              } else if (t.status === "in_progress") {
                statusBadge = (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    In Progress ({scorePct}%)
                  </span>
                );
              }

              return (
                <div
                  key={t.topic_id}
                  className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-all"
                >
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-slate-400 font-medium">
                        ID: {t.topic_id.substring(0, 8)}
                      </span>
                      {statusBadge}
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {t.topic_title || t.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Quiz Attempts: {t.attempts}</span>
                      <span>•</span>
                      <span>Mastery Level: {scorePct}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {t.status === "struggling" && (
                      <button
                        onClick={() => setSelectedTopic({ id: t.topic_id, title: t.topic_title || t.title || t.topic_id })}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-all shadow"
                      >
                        Trigger Remediation
                      </button>
                    )}

                    <Link
                      href={`/study?topic_id=${t.topic_id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/5 flex items-center gap-1.5 transition-all"
                    >
                      <span>Study Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-3xl text-center space-y-3 border border-white/5">
            <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Topics Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Upload a syllabus first to build your knowledge graph and track mastery.
            </p>
            <Link
              href="/syllabus"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
            >
              Upload Syllabus
            </Link>
          </div>
        )}
      </div>

      {selectedTopic && (
        <RemediationModal
          topicId={selectedTopic.id}
          learnerId={learnerId}
          isOpen={true}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}
