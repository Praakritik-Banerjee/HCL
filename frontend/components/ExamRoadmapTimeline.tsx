"use client";

import React from "react";
import { RoadmapResponse } from "@/types";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Flame,
} from "lucide-react";
import Link from "next/link";

interface ExamRoadmapTimelineProps {
  roadmap: RoadmapResponse;
}

export default function ExamRoadmapTimeline({ roadmap }: ExamRoadmapTimelineProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner with Countdown */}
      <div className="glass-card p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-surface to-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Exam Mode Active
              </span>
              {roadmap.is_repaced && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> Re-paced Automatically
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              {roadmap.subject_name}
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Target Exam Date: <span className="text-slate-200 font-medium">{roadmap.exam_date}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-panel px-5 py-3 rounded-2xl border border-amber-500/30 text-center">
              <div className="text-3xl font-black text-amber-400 font-mono">
                {roadmap.days_remaining}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Days Left
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day by Day Roadmap Entries */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-400" />
          Day-by-Day Milestone Schedule ({roadmap.entries.length} Sessions)
        </h3>

        <div className="space-y-3">
          {roadmap.entries.map((entry, idx) => {
            const isCompleted = entry.status === "completed";
            const isOverdue = entry.status === "overdue";

            return (
              <div
                key={idx}
                className={`glass-card p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : isOverdue
                    ? "border-rose-500/30 bg-rose-950/10"
                    : "border-white/5 hover:border-amber-500/30"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 font-mono text-xs font-bold flex flex-col items-center justify-center border border-white/5 flex-shrink-0">
                    <span className="text-[9px] text-slate-500">DAY</span>
                    <span>{entry.day_number}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">
                        {entry.topic_title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {entry.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary-400" />
                      Target Task: <span className="text-slate-200 font-medium">{entry.target_task}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                      isCompleted
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : isOverdue
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700/50"
                    }`}
                  >
                    {entry.status}
                  </span>

                  <Link
                    href={`/study?topic_id=${entry.topic_id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Execute</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
