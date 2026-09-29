"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import { apiService } from "@/services/api";
import { RoadmapResponse } from "@/types";
import ExamRoadmapTimeline from "@/components/ExamRoadmapTimeline";
import {
  Calendar,
  Clock,
  Plus,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ExamModePage() {
  const router = useRouter();
  const { user, learnerId, examModeActive, setExamModeActive } = useLearner();
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // Form State
  const [subjectName, setSubjectName] = useState("CS Finals");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [unitLabels, setUnitLabels] = useState("Unit 1, Unit 2, Unit 3");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("padhaimate_user");
    if (!user && !storedUser) {
      router.push("/login");
      return;
    }
    if (learnerId) {
      loadRoadmap();
    }
  }, [user, learnerId]);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const data = await apiService.getExamRoadmap(learnerId);
      setRoadmap(data);
      setExamModeActive(data.is_active ?? true);
    } catch {
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = async () => {
    const nextState = !examModeActive;
    setExamModeActive(nextState);
    try {
      await apiService.toggleExamMode(learnerId, nextState);
    } catch (e) {
      setExamModeActive(!nextState);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const units = unitLabels
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
        .map((unit_label) => ({ unit_label }));

      const res = await apiService.setupExamMode(
        learnerId,
        subjectName,
        examDate,
        units
      );
      setRoadmap(res);
      setExamModeActive(true);
      setShowSetup(false);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to setup exam roadmap."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Deadline Pacing Engine
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Exam Mode & Dynamic Roadmaps
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Configure upcoming exam deadlines. PadhaiMate weights weaker topics with additional review time and automatically re-paces if you fall behind.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{roadmap ? "Configure New Exam" : "Setup Exam"}</span>
          </button>

          <button
            onClick={handleToggleMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              examModeActive
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-slate-900 text-slate-400 border-white/5"
            }`}
          >
            {examModeActive ? (
              <ToggleRight className="w-5 h-5 text-amber-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-500" />
            )}
            <span>Exam Mode: {examModeActive ? "ACTIVE" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Setup Form Modal / Drawer if toggled */}
      {showSetup && (
        <div className="glass-card p-6 rounded-3xl border border-amber-500/30 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Configure Upcoming Exam Schedule
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject / Exam Name
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g., Computer Science Finals"
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exam Date (Target Deadline)
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Units / Topics to Cover (Comma Separated)
              </label>
              <input
                type="text"
                required
                value={unitLabels}
                onChange={(e) => setUnitLabels(e.target.value)}
                placeholder="Unit 1: Data Structures, Unit 2: Algorithms, Unit 3: OS"
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Paced Roadmap...</span>
                  </>
                ) : (
                  <span>Generate Paced Roadmap</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Roadmap Timeline Display */}
      {loading ? (
        <div className="glass-card p-8 rounded-3xl border border-white/5 animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-32 bg-slate-800 rounded w-full"></div>
        </div>
      ) : roadmap ? (
        <ExamRoadmapTimeline roadmap={roadmap} />
      ) : (
        <div className="glass-card p-10 rounded-3xl text-center space-y-4 border border-white/5">
          <Clock className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">No Exam Schedule Configured</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Click "Setup Exam" above to input your exam date and units. PadhaiMate will generate a deadline-based roadmap that auto-repaces as you study.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Exam Schedule Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
