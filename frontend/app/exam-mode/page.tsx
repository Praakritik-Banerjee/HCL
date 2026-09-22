"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
} from "lucide-react";

export default function ExamModePage() {
  const { learnerId, examModeActive, setExamModeActive } = useLearner();
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
    loadRoadmap();
  }, [learnerId]);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const data = await apiService.getExamRoadmap(learnerId);
      setRoadmap(data);
      setExamModeActive(data.is_active);
    } catch {
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!roadmap) {
      setShowSetup(true);
      return;
    }

    try {
      const nextActive = !roadmap.is_active;
      const updated = await apiService.toggleExamMode(learnerId, nextActive);
      setRoadmap(updated);
      setExamModeActive(updated.is_active);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to toggle Exam Mode.");
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !examDate) {
      setErrorMsg("Subject name and exam date are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const units = unitLabels
      .split(",")
      .map((u) => ({ unit_label: u.trim() }))
      .filter((u) => u.unit_label.length > 0);

    try {
      const res = await apiService.setupExamMode(learnerId, subjectName, examDate, units);
      setRoadmap(res);
      setExamModeActive(res.is_active);
      setShowSetup(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to configure Exam Mode.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Deadline Pacing Engine
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Exam Mode & Dynamic Roadmap
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Configure target deadlines. Weak topics are automatically weighted with double study allocations, and schedules dynamically re-pace if overdue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSetup(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Exam</span>
          </button>

          {roadmap && (
            <button
              onClick={handleToggle}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                roadmap.is_active
                  ? "bg-amber-500 text-black border-amber-400 font-bold"
                  : "bg-slate-800 text-slate-400 border-white/5 hover:text-slate-200"
              }`}
            >
              {roadmap.is_active ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Exam Mode: ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>Exam Mode: OFF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Setup Form Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel border border-amber-500/30 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              Configure Target Exam
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Enter target exam dates to calculate schedule bounds and pacing.
            </p>

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Subject / Exam Name
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Data Structures Final Exam"
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Units / Modules (comma-separated)
                </label>
                <input
                  type="text"
                  value={unitLabels}
                  onChange={(e) => setUnitLabels(e.target.value)}
                  placeholder="Unit 1, Unit 2, Unit 3"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Pacing Roadmap..." : "Create Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Roadmap Display */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading roadmap details...
        </div>
      ) : roadmap ? (
        <ExamRoadmapTimeline roadmap={roadmap} />
      ) : (
        <div className="glass-card p-10 rounded-3xl text-center space-y-3 border border-white/5">
          <Calendar className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Exam Configured Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Set up an upcoming exam date to generate an intelligent, deadline-constrained study roadmap weighted by your prerequisite mastery.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Set Up Exam Roadmap</span>
          </button>
        </div>
      )}
    </div>
  );
}
