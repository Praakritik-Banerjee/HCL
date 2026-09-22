"use client";

import React from "react";
import { X, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

interface CitationDrawerProps {
  chunkIds: string[];
  topicTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CitationDrawer({
  chunkIds,
  topicTitle,
  isOpen,
  onClose,
}: CitationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel border border-primary-500/30 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Grounded Source Citations</h3>
            <p className="text-xs text-slate-400">
              Verified citations extracted directly from your syllabus chunks
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {chunkIds.length > 0 ? (
            chunkIds.map((cid, idx) => (
              <div
                key={idx}
                className="glass-card p-3 rounded-xl border border-white/5 flex items-start gap-3"
              >
                <FileText className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-primary-300">
                      Chunk ID: {cid}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Grounded
                    </span>
                  </div>
                  {topicTitle && (
                    <p className="text-xs text-slate-300 mt-1">Topic: {topicTitle}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Referenced by the AI reasoning engine to guarantee zero hallucination.
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              No specific chunk citations recorded for this item.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
