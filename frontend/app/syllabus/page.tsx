"use client";

import React, { useState, useEffect } from "react";
import SyllabusUploader from "@/components/SyllabusUploader";
import TopicTree from "@/components/TopicTree";
import { apiService } from "@/services/api";
import { KnowledgeGraphResponse } from "@/types";
import { BookOpen, Layers, CheckCircle2, AlertCircle } from "lucide-react";

export default function SyllabusPage() {
  const [currentSyllabusId, setCurrentSyllabusId] = useState<string>("");
  const [currentFilename, setCurrentFilename] = useState<string>("");
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUploaded = (syllabusId: string, filename: string) => {
    setCurrentSyllabusId(syllabusId);
    setCurrentFilename(filename);
    loadGraph(syllabusId);
  };

  const loadGraph = async (id: string) => {
    setLoading(true);
    try {
      const data = await apiService.getKnowledgeGraph(id);
      setGraphData(data);
    } catch (err) {
      console.error("Failed to load knowledge graph:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-400">
          Curriculum Ingestion
        </span>
        <h1 className="text-2xl font-extrabold text-white mt-1">
          Syllabus Hub & Knowledge Graph
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
          Upload syllabi in PDF, DOCX, or TXT format. The backend ingests the document, scrubs PII, segments chunks, and builds the hierarchical topic tree.
        </p>
      </div>

      {/* Uploader */}
      <SyllabusUploader onUploaded={handleUploaded} />

      {/* Ingested Curriculum View */}
      {currentSyllabusId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {currentFilename || "Active Syllabus"}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {currentSyllabusId}
                </span>
              </div>
            </div>

            {graphData && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                {graphData.total_topics} Extracted Topics
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading knowledge graph...
            </div>
          ) : graphData ? (
            <TopicTree topics={graphData.topics} />
          ) : null}
        </div>
      )}
    </div>
  );
}
