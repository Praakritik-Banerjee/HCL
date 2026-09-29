"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import SyllabusUploader from "@/components/SyllabusUploader";
import TopicTree from "@/components/TopicTree";
import { apiService } from "@/services/api";
import { KnowledgeGraphResponse } from "@/types";
import { Layers } from "lucide-react";

export default function SyllabusPage() {
  const router = useRouter();
  const { user } = useLearner();

  const [currentSyllabusId, setCurrentSyllabusId] = useState<string>("");
  const [currentFilename, setCurrentFilename] = useState<string>("");
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("padhaimate_user");
    if (!user && !storedUser) {
      router.push("/login");
      return;
    }
    loadGraph("latest");
  }, [user]);

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
      if (data && data.syllabus_id) {
        setCurrentSyllabusId(data.syllabus_id);
      }
    } catch (err) {
      // ignore if no syllabus exists yet
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400">
          Curriculum Ingestion
        </span>
        <h1 className="text-3xl font-extrabold text-warm-100 mt-1 font-display">
          Syllabus Hub & Knowledge Graph
        </h1>
        <p className="text-xs text-warm-400 mt-1 max-w-xl leading-relaxed">
          Upload syllabi in PDF, DOCX, or TXT format. The system ingests the document, scrubs PII, segments chunks, and builds the hierarchical topic tree.
        </p>
      </div>

      {/* Uploader */}
      <SyllabusUploader onUploaded={handleUploaded} />

      {/* Ingested Curriculum View */}
      {graphData && graphData.topics && graphData.topics.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-warm-100 flex items-center gap-2 font-display">
              <Layers className="w-5 h-5 text-primary-400" />
              Ingested Curriculum Hierarchy ({graphData.total_topics} Topics)
            </h2>
            {currentFilename && (
              <span className="text-xs text-warm-400 bg-warm-900/50 border border-warm-800/40 px-3 py-1 rounded-full">
                Source: <strong className="text-warm-200">{currentFilename}</strong>
              </span>
            )}
          </div>

          <TopicTree topics={graphData.topics} />
        </div>
      )}
    </div>
  );
}
