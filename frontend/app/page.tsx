"use client";

import React, { useState, useEffect } from "react";
import { useLearner } from "@/context/LearnerContext";
import { apiService } from "@/services/api";
import { NextTopicResponse, MasteryDashboardResponse, RoadmapResponse } from "@/types";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import RemediationModal from "@/components/RemediationModal";

export default function HomePage() {
  const { learnerId, examModeActive } = useLearner();
  const [nextTopic, setNextTopic] = useState<NextTopicResponse | null>(null);
  const [masteryData, setMasteryData] = useState<MasteryDashboardResponse | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Remediation modal state
  const [remedialTopicId, setRemedialTopicId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [learnerId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [nextRes, masteryRes] = await Promise.allSettled([
        apiService.getNextTopic(learnerId),
        apiService.getMasteryDashboard(learnerId),
      ]);

      if (nextRes.status === "fulfilled") setNextTopic(nextRes.value);
      if (masteryRes.status === "fulfilled") setMasteryData(masteryRes.value);

      if (examModeActive) {
        try {
          const rData = await apiService.getExamRoadmap(learnerId);
          setRoadmapData(rData);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/25 text-primary-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span>AI Learning Co-Pilot Active</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-300">{learnerId}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
              Your personalized study journey is continuously synchronized with your prerequisite mastery and syllabus goals.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold border border-white/5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Recommendations
          </button>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="glass-panel p-4 rounded-2xl">
            <div className="text-xs font-semibold text-slate-400">Overall Mastery</div>
            {loading ? (
              <div className="h-7 bg-slate-800 rounded w-20 mt-1.5 animate-pulse" />
            ) : (
              <div className="text-2xl font-black text-white mt-1">
                {masteryData ? `${Math.round(masteryData.overall_mastery * 100)}%` : "0%"}
              </div>
            )}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-primary-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(masteryData?.overall_mastery || 0) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl">
            <div className="text-xs font-semibold text-slate-400">Mastery Status</div>
            {loading ? (
              <div className="h-7 bg-slate-800 rounded w-24 mt-1.5 animate-pulse" />
            ) : (
              <div className="text-2xl font-black text-white mt-1">
                {masteryData?.topics?.filter((t) => t.status === "mastered").length || 0} /{" "}
                {masteryData?.topics?.length || 0}
              </div>
            )}
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              Topics Mastered (≥ 80%)
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl">
            <div className="text-xs font-semibold text-slate-400">Exam Mode</div>
            {loading ? (
              <div className="h-7 bg-slate-800 rounded w-28 mt-1.5 animate-pulse" />
            ) : (
              <div className="text-2xl font-black text-white mt-1">
                {examModeActive ? `${roadmapData?.days_remaining || "—"} Days Left` : "Standard Pace"}
              </div>
            )}
            <div className="text-[11px] text-amber-400 font-medium mt-1">
              {examModeActive ? `${roadmapData?.subject_name || "Active Plan"}` : "Non-urgent study flow"}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Step Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary-400" />
            AI Recommended Next Topic
          </h2>
          <span className="text-xs text-slate-400">Evaluated in &lt; 500ms</span>
        </div>

        {loading ? (
          <div className="glass-card p-6 rounded-3xl border border-white/5 animate-pulse space-y-4">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-7 bg-slate-800 rounded w-1/2"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
        ) : nextTopic?.topic_id ? (
          <div className="glass-card p-6 rounded-3xl border border-primary-500/30 bg-gradient-to-r from-primary-950/20 via-surface to-surface flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  Target Topic
                </span>
                <span className="text-xs text-slate-400">
                  Prerequisites Met: <span className="text-emerald-400 font-semibold">Yes</span>
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white">
                {nextTopic.topic_title || nextTopic.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {nextTopic.description || nextTopic.reason || nextTopic.message}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>
                  Current Mastery:{" "}
                  <strong className="text-white">
                    {Math.round((nextTopic.current_mastery ?? nextTopic.mastery_score ?? 0) * 100)}%
                  </strong>
                </span>
                <span>•</span>
                <span>Target: 80% to achieve mastery</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href={`/study?topic_id=${nextTopic.topic_id}`}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all group"
              >
                <span>Launch Study Kit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 rounded-3xl text-center space-y-3 border border-white/5">
            <GraduationCap className="w-10 h-10 text-primary-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">
              {nextTopic?.message || "No Active Curriculum Uploaded"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Upload your course syllabus to generate the prerequisite graph and receive real-time AI recommendations.
            </p>
            <Link
              href="/syllabus"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
            >
              Upload Syllabus Now
            </Link>
          </div>
        )}
      </div>


      {/* Struggling Topics Callout if any */}
      {masteryData && masteryData.struggling_topics_count > 0 && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-bold text-amber-300">
                Struggle Signals Detected on {masteryData.struggling_topics_count} Topic(s)
              </h4>
              <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
                The agent identified repeated quiz scores under 60%. Adaptive analogies and simplified concept breakdowns are ready for you.
              </p>
            </div>
          </div>

          <Link
            href="/mastery"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors self-start md:self-auto"
          >
            Review Struggling Topics
          </Link>
        </div>
      )}

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/syllabus"
          className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary-500/40 group transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-primary-300 transition-colors">
            Syllabus & Graph Hub
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Upload new syllabi, view topic hierarchies, and inspect prerequisite pathways.
          </p>
        </Link>

        <Link
          href="/study"
          className="glass-card p-6 rounded-3xl border border-white/5 hover:border-indigo-500/40 group transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            Study Kit Studio
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Generate grounded quizzes, 3D flashcards, summaries, and problem solving guides.
          </p>
        </Link>

        <Link
          href="/exam-mode"
          className="glass-card p-6 rounded-3xl border border-white/5 hover:border-amber-500/40 group transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
            Exam Mode Roadmaps
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Pace your study schedule for upcoming exams with dynamic re-pacing when delayed.
          </p>
        </Link>
      </div>

      {remedialTopicId && (
        <RemediationModal
          topicId={remedialTopicId}
          learnerId={learnerId}
          isOpen={true}
          onClose={() => setRemedialTopicId(null)}
        />
      )}
    </div>
  );
}
