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
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileText,
  ChevronDown,
  Filter,
} from "lucide-react";

interface DocumentInfo {
  id: string;
  filename: string;
  file_type: string;
  total_topics: number;
}

export default function MasteryPage() {
  const router = useRouter();
  const { user, learnerId } = useLearner();
  const [data, setData] = useState<MasteryDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<{ id: string; title: string } | null>(null);

  // Document selector state
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [docsLoading, setDocsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("padhaimate_user");
    if (!user && !storedUser) {
      router.push("/login");
      return;
    }
    loadDocuments();
  }, [user, learnerId]);

  // Re-fetch mastery when selectedDocId changes
  useEffect(() => {
    if (learnerId) {
      loadMastery();
    }
  }, [learnerId, selectedDocId]);

  const loadDocuments = async () => {
    setDocsLoading(true);
    try {
      const docs = await apiService.getDocuments();
      setDocuments(docs);
      // Auto-select the first document if available
      if (docs.length > 0 && !selectedDocId) {
        setSelectedDocId(docs[0].id);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setDocsLoading(false);
    }
  };

  const loadMastery = async () => {
    setLoading(true);
    try {
      const docFilter = selectedDocId || undefined;
      const res = await apiService.getMasteryDashboard(learnerId, docFilter);
      setData(res);
    } catch (err) {
      console.error("Failed to load mastery data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDocName = documents.find((d) => d.id === selectedDocId)?.filename || "All Documents";

  const masteredCount = data?.topics?.filter((t) => t.status === "mastered").length || 0;
  const inProgressCount = data?.topics?.filter((t) => t.status === "in_progress").length || 0;
  const strugglingCount = data?.topics?.filter((t) => t.status === "struggling").length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
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

        {/* Document Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-primary-500/40 transition-all min-w-[280px] group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 flex items-center justify-center border border-white/5">
              <FileText className="w-4 h-4 text-primary-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Filter by PDF
              </div>
              <div className="text-sm font-bold text-white truncate max-w-[180px]">
                {docsLoading ? "Loading..." : selectedDocName}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-full min-w-[300px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-2">
                  <Filter className="w-3 h-3" />
                  Select Document
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {/* All Documents Option */}
                <button
                  onClick={() => { setSelectedDocId(""); setDropdownOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    selectedDocId === ""
                      ? "bg-primary-500/10 border border-primary-500/20 text-primary-300"
                      : "hover:bg-white/5 text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">All Documents</div>
                    <div className="text-[10px] text-slate-500">View topics from all PDFs</div>
                  </div>
                  {selectedDocId === "" && (
                    <CheckCircle2 className="w-4 h-4 text-primary-400 ml-auto" />
                  )}
                </button>

                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      selectedDocId === doc.id
                        ? "bg-primary-500/10 border border-primary-500/20 text-primary-300"
                        : "hover:bg-white/5 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{doc.filename}</div>
                      <div className="text-[10px] text-slate-500">
                        {doc.total_topics} topics
                      </div>
                    </div>
                    {selectedDocId === doc.id && (
                      <CheckCircle2 className="w-4 h-4 text-primary-400 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}

                {documents.length === 0 && !docsLoading && (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Pill */}
      {selectedDocId && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs text-primary-300 font-medium">
            <FileText className="w-3 h-3" />
            Filtered: {selectedDocName}
            <button
              onClick={() => setSelectedDocId("")}
              className="ml-1 hover:text-white transition-colors text-primary-400"
            >
              x
            </button>
          </span>
        </div>
      )}

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
            Score &ge; 80%
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
          {selectedDocId && (
            <span className="text-xs font-normal text-slate-500 ml-2">
              Showing topics from: {selectedDocName}
            </span>
          )}
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
                      <span>&bull;</span>
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
            <h3 className="text-base font-semibold text-white">
              {selectedDocId ? "No Topics Found for This Document" : "No Topics Found"}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {selectedDocId
                ? "This document has no extracted topics yet. Try selecting a different document or upload a new syllabus."
                : "Upload a syllabus first to build your knowledge graph and track mastery."}
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

      {/* Click-away overlay for dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
