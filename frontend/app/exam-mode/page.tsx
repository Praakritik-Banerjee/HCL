"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import { apiService } from "@/services/api";
import { RoadmapResponse } from "@/types";
import ExamRoadmapTimeline from "@/components/ExamRoadmapTimeline";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
  FileText,
  Check,
  ChevronRight,
  Sparkles,
  BookOpen,
  ListCheck,
  RotateCcw,
} from "lucide-react";

export default function ExamModePage() {
  const router = useRouter();
  const { user, learnerId, examModeActive, setExamModeActive } = useLearner();
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  // Wizard Step State (1: Exam Details & Date, 2: Syllabus PDF, 3: Unit Selection)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [subjectName, setSubjectName] = useState("CS Finals");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  // Syllabus documents state
  const [documents, setDocuments] = useState<Array<{ id: string; filename: string; total_topics: number }>>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  // Units parsed from syllabus
  const [docUnits, setDocUnits] = useState<Array<{ id: string; title: string; unit_label?: string }>>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(true);

  // Manual fallback units
  const [manualUnits, setManualUnits] = useState("Unit 1: Core Principles, Unit 2: Advanced Topics, Unit 3: Exam Review");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("padhaimate_user");
    if (!user && !storedUser) {
      router.push("/login");
      return;
    }
    if (learnerId) {
      loadRoadmapAndDocs();
    }
  }, [user, learnerId]);

  const loadRoadmapAndDocs = async () => {
    setLoading(true);
    try {
      const [roadmapData, docList] = await Promise.all([
        apiService.getExamRoadmap(learnerId).catch(() => null),
        apiService.getDocuments().catch(() => []),
      ]);

      setRoadmap(roadmapData);
      setDocuments(docList);
      if (docList.length > 0) {
        setSelectedDocId(docList[0].id);
        loadUnitsForDocument(docList[0].id);
      }
      if (roadmapData) {
        setExamModeActive(roadmapData.is_active ?? true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadUnitsForDocument = async (docId: string) => {
    try {
      const tree = await apiService.getKnowledgeGraphTree(docId);
      const units = tree?.topics || [];
      const mapped = units.map((u: any) => ({
        id: u.id,
        title: u.title,
        unit_label: u.unit_label || u.title,
      }));
      setDocUnits(mapped);
      setSelectedUnitIds(mapped.map((m: any) => m.id));
      setSelectAll(true);
    } catch {
      setDocUnits([]);
    }
  };

  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId);
    if (docId && docId !== "manual") {
      loadUnitsForDocument(docId);
    } else {
      setDocUnits([]);
    }
  };

  const handleToggleUnit = (unitId: string) => {
    if (selectedUnitIds.includes(unitId)) {
      const next = selectedUnitIds.filter((id) => id !== unitId);
      setSelectedUnitIds(next);
      setSelectAll(next.length === docUnits.length);
    } else {
      const next = [...selectedUnitIds, unitId];
      setSelectedUnitIds(next);
      setSelectAll(next.length === docUnits.length);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedUnitIds([]);
      setSelectAll(false);
    } else {
      setSelectedUnitIds(docUnits.map((u) => u.id));
      setSelectAll(true);
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
      let unitsPayload: { unit_label: string; topic_id?: string }[] = [];

      if (selectedDocId && selectedDocId !== "manual" && docUnits.length > 0) {
        // Selected units from uploaded syllabus document
        const chosen = docUnits.filter((u) => selectedUnitIds.includes(u.id));
        unitsPayload = (chosen.length > 0 ? chosen : docUnits).map((u) => ({
          unit_label: u.unit_label || u.title,
          topic_id: u.id,
        }));
      } else {
        // Manual units fallback
        unitsPayload = manualUnits
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
          .map((unit_label) => ({ unit_label }));
      }

      if (unitsPayload.length === 0) {
        throw new Error("Please select or enter at least one unit to study.");
      }

      const res = await apiService.setupExamMode(
        learnerId,
        subjectName,
        examDate,
        unitsPayload
      );
      setRoadmap(res);
      setExamModeActive(true);
      setShowSetup(false);
      setStep(1);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to setup exam roadmap."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Days left calculation preview
  const daysLeftPreview = Math.max(
    1,
    Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
  );

  return (
    <div className="space-y-8">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Intelligent Deadline Pacing Engine
          </span>
          <h1 className="text-3xl font-extrabold text-warm-100 mt-1 font-display">
            Exam Mode & Dynamic Calendar
          </h1>
          <p className="text-xs text-warm-400 mt-1 max-w-xl leading-relaxed">
            Set your upcoming exam target date. PadhaiMate analyzes your syllabus, calculates daily required study hours, and auto-repaces as you study.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowSetup(true);
              setStep(1);
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-warm-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{roadmap ? "Configure New Exam Date" : "Setup Exam Date"}</span>
          </button>

          <button
            onClick={handleToggleMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
              examModeActive
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-warm-950 text-warm-400 border-warm-800/40"
            }`}
          >
            {examModeActive ? (
              <ToggleRight className="w-5 h-5 text-amber-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-warm-500" />
            )}
            <span>Exam Mode: {examModeActive ? "ACTIVE" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* STEP-BY-STEP EXAM SETUP WIZARD MODAL / CARD */}
      {showSetup && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-surface space-y-6 shadow-2xl relative animate-fadeIn">
          {/* Wizard Header Progress */}
          <div className="flex items-center justify-between border-b border-warm-800/40 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Step {step} of 3
              </span>
              <h2 className="text-xl font-extrabold text-warm-100 font-display">
                {step === 1 && "1. Target Subject & Exam Date"}
                {step === 2 && "2. Select Uploaded Syllabus PDF"}
                {step === 3 && "3. Choose Units to Study (Optional)"}
              </h2>
            </div>

            <button
              onClick={() => setShowSetup(false)}
              className="px-3 py-1 rounded-xl text-xs font-semibold text-warm-400 hover:text-warm-100 hover:bg-warm-900"
            >
              Cancel
            </button>
          </div>

          {/* Stepper Indicator Pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, label: "Exam Date" },
              { num: 2, label: "Syllabus PDF" },
              { num: 3, label: "Select Units" },
            ].map((s) => (
              <div
                key={s.num}
                className={`p-2 rounded-xl text-center border transition-all ${
                  step === s.num
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold"
                    : step > s.num
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
                    : "bg-warm-950/40 border-warm-800/30 text-warm-500"
                }`}
              >
                <span className="text-[10px] block uppercase font-mono">Step {s.num}</span>
                <span className="text-xs">{s.label}</span>
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateExam} className="space-y-6">
            {/* STEP 1: EXAM NAME & DATE */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-warm-300">
                      Subject / Exam Name
                    </label>
                    <input
                      type="text"
                      required
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="e.g., Computer Science Finals"
                      className="w-full bg-warm-950 border border-warm-800/40 rounded-xl px-3.5 py-2.5 text-xs text-warm-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-warm-300">
                      Target Exam Date
                    </label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-warm-950 border border-warm-800/40 rounded-xl px-3.5 py-2.5 text-xs text-warm-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-warm-950/80 border border-warm-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-warm-100">Calculated Study Window</div>
                      <div className="text-[11px] text-warm-400">
                        {daysLeftPreview} days available from Today to Exam Date ({examDate})
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                    {daysLeftPreview} Days Left
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-warm-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Next: Select Syllabus PDF</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT SYLLABUS PDF */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-warm-300">
                    Select Uploaded Syllabus Document
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleDocChange(doc.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          selectedDocId === doc.id
                            ? "bg-amber-500/15 border-amber-500/50 text-warm-100"
                            : "bg-warm-950/40 border-warm-800/30 hover:bg-warm-900/40 text-warm-400"
                        }`}
                      >
                        <FileText className="w-6 h-6 text-amber-400 flex-shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-warm-100 truncate">
                            {doc.filename}
                          </div>
                          <div className="text-[10px] text-warm-400 font-mono">
                            {doc.total_topics} topics parsed
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      onClick={() => handleDocChange("manual")}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        selectedDocId === "manual"
                          ? "bg-amber-500/15 border-amber-500/50 text-warm-100"
                          : "bg-warm-950/40 border-warm-800/30 hover:bg-warm-900/40 text-warm-400"
                      }`}
                    >
                      <BookOpen className="w-6 h-6 text-primary-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-warm-100">
                          Manual / Custom Syllabus
                        </div>
                        <div className="text-[10px] text-warm-400">
                          Type custom unit list manually
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-warm-400 hover:text-warm-100"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-warm-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Next: Choose Units to Study</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHOOSE UNITS TO STUDY */}
            {step === 3 && (
              <div className="space-y-5">
                {selectedDocId && selectedDocId !== "manual" && docUnits.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-warm-300">
                        Choose Units to Include in Roadmap
                      </label>

                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <ListCheck className="w-3.5 h-3.5" />
                        <span>{selectAll ? "Deselect All" : "Select All Units (Recommended)"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {docUnits.map((u) => {
                        const isChecked = selectedUnitIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => handleToggleUnit(u.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                              isChecked
                                ? "bg-amber-500/15 border-amber-500/40 text-warm-100 font-semibold"
                                : "bg-warm-950/40 border-warm-800/30 text-warm-400 opacity-60"
                            }`}
                          >
                            <span className="truncate pr-2">{u.unit_label}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isChecked
                                  ? "bg-amber-500 border-amber-400 text-warm-950"
                                  : "border-warm-700"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-warm-300">
                      Enter Custom Units / Topics (Comma Separated)
                    </label>
                    <textarea
                      rows={3}
                      value={manualUnits}
                      onChange={(e) => setManualUnits(e.target.value)}
                      placeholder="Unit 1: Data Structures, Unit 2: Algorithms, Unit 3: Operating Systems"
                      className="w-full bg-warm-950 border border-warm-800/40 rounded-xl p-3 text-xs text-warm-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-warm-400 hover:text-warm-100"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-warm-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing & Pacing Roadmap...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Eye-Catching Study Calendar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Main Roadmap Display */}
      {loading ? (
        <div className="glass-card p-8 rounded-3xl border border-warm-800/30 animate-pulse space-y-4">
          <div className="h-6 bg-warm-900 rounded w-1/3"></div>
          <div className="h-4 bg-warm-900 rounded w-1/2"></div>
          <div className="h-48 bg-warm-900 rounded w-full"></div>
        </div>
      ) : roadmap ? (
        <ExamRoadmapTimeline roadmap={roadmap} />
      ) : (
        <div className="glass-card p-12 rounded-3xl text-center space-y-4 border border-warm-800/30">
          <Clock className="w-14 h-14 text-amber-500/50 mx-auto" />
          <h2 className="text-xl font-bold text-warm-100 font-display">
            No Exam Schedule Configured
          </h2>
          <p className="text-xs text-warm-400 max-w-md mx-auto leading-relaxed">
            Click "Setup Exam Date" above to select your target exam date and syllabus document. PadhaiMate will generate an interactive deadline study calendar!
          </p>
          <button
            onClick={() => {
              setShowSetup(true);
              setStep(1);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-warm-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Exam Target Date Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
