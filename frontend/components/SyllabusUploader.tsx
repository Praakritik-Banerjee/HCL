"use client";

import React, { useState, useRef } from "react";
import { apiService } from "@/services/api";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  Sparkles,
} from "lucide-react";

interface SyllabusUploaderProps {
  onUploaded: (syllabusId: string, filename: string) => void;
}

const SAMPLE_SYLLABUS_CONTENT = `CS 301: Advanced Data Structures and Algorithms Syllabus

Course Overview:
This course covers fundamental algorithms, algorithmic analysis, search techniques, and graph algorithms.

Unit 1: Foundations and Asymptotic Analysis
1.1 Asymptotic Notation (Big-O, Big-Omega, Big-Theta)
1.2 Recurrence Relations and the Master Theorem
1.3 Divide and Conquer Paradigm

Unit 2: Sorting and Searching Algorithms
2.1 Comparison-based Sorting: Quicksort and Mergesort
2.2 Non-comparison Sorting: Counting Sort and Radix Sort
2.3 Binary Search Trees and Balanced AVL Trees

Unit 3: Graph Algorithms and Dynamic Programming
3.1 Graph Representations, BFS and DFS Traversal
3.2 Shortest Path Algorithms: Dijkstra and Bellman-Ford
3.3 Dynamic Programming Fundamentals and Memoization
`;

export default function SyllabusUploader({ onUploaded }: SyllabusUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFilename, setSuccessFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    // Check extension
    const validExts = [".pdf", ".docx", ".txt"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      setErrorMessage(`Unsupported format: ${ext || "unknown"}. Please upload a .pdf, .docx, or .txt file.`);
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const res = await apiService.uploadSyllabus(file);
      setSuccessFilename(file.name);
      onUploaded(res.syllabus_id, file.name);
    } catch (err: any) {
      console.error("Upload error:", err);
      const detail =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Upload failed. Ensure backend server is running on http://localhost:8080.";
      setErrorMessage(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  const handleLoadSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sampleBlob = new Blob([SAMPLE_SYLLABUS_CONTENT], { type: "text/plain" });
    const sampleFile = new File([sampleBlob], "CS301_Algorithms_Syllabus.txt", {
      type: "text/plain",
    });
    processFile(sampleFile);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          isDragging
            ? "border-primary-400 bg-primary-500/15 scale-[1.01]"
            : "border-white/10 hover:border-primary-500/30 glass-card"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center mx-auto mb-4">
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">
          {uploading ? "Extracting Topics & Ingesting..." : "Upload Syllabus / Curriculum"}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
          Drag and drop your course syllabus (PDF, DOCX, or TXT). The system automatically scrubs PII, segments chunks, and builds the hierarchical topic tree.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Browse Files</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Try Sample CS Syllabus</span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-primary-400" /> PDF
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-cyan-400" /> DOCX
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-emerald-400" /> TXT
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successFilename && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>
            Successfully ingested <strong>{successFilename}</strong>. Topics and prerequisite graph extracted below.
          </span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
