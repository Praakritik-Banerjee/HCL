"use client";

import React, { useState } from "react";
import { RoadmapResponse, RoadmapEntry } from "@/types";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Flame,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Sparkles,
  BarChart3,
  ListFilter,
  Check,
  X,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";

interface ExamRoadmapTimelineProps {
  roadmap: RoadmapResponse;
}

export default function ExamRoadmapTimeline({ roadmap }: ExamRoadmapTimelineProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "timeline" | "analytics">("calendar");
  const [selectedDayItem, setSelectedDayItem] = useState<RoadmapEntry | null>(null);

  const items: RoadmapEntry[] = roadmap.entries || roadmap.schedule || [];

  // Calculate totals
  const totalHours = items.reduce((acc, item) => acc + (item.allocated_hours || 2), 0);
  const avgHoursPerDay = items.length > 0 ? (totalHours / items.length).toFixed(1) : "0.0";
  const completedCount = items.filter((i) => i.status === "completed").length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // Calendar logic: determine date range
  const today = new Date();
  const examDateObj = new Date(roadmap.exam_date);

  // We set initial calendar view month based on today or exam date
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(today);

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // First day of current month & total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Month labels
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Map entries by date string YYYY-MM-DD
  const scheduleByDate: Record<string, RoadmapEntry[]> = {};
  items.forEach((item) => {
    if (item.date) {
      if (!scheduleByDate[item.date]) {
        scheduleByDate[item.date] = [];
      }
      scheduleByDate[item.date].push(item);
    }
  });

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  // Helper to format date string YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Countdown & Metrics */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-surface to-amber-950/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-amber-400" /> Exam Mode Active
              </span>

              {roadmap.is_repaced && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Auto Re-Paced for Weak Topics
                </span>
              )}
            </div>

            <h2 className="text-3xl font-black text-warm-100 font-display tracking-tight">
              {roadmap.subject_name}
            </h2>

            <p className="text-xs text-warm-400 mt-1 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              Target Exam Date:{" "}
              <span className="text-warm-100 font-semibold">{roadmap.exam_date}</span>
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/30 text-center min-w-[90px]">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {roadmap.days_remaining}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-warm-400 font-bold">
                Days Remaining
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-warm-800/40 text-center min-w-[90px]">
              <div className="text-2xl font-black text-primary-400 font-mono">
                {totalHours}h
              </div>
              <div className="text-[9px] uppercase tracking-wider text-warm-400 font-bold">
                Total Study Time
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-warm-800/40 text-center min-w-[90px]">
              <div className="text-2xl font-black text-warm-200 font-mono">
                ~{avgHoursPerDay}h
              </div>
              <div className="text-[9px] uppercase tracking-wider text-warm-400 font-bold">
                Hours / Day
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 text-center min-w-[90px]">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {progressPercent}%
              </div>
              <div className="text-[9px] uppercase tracking-wider text-warm-400 font-bold">
                Roadmap Done
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-warm-800/30">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-warm-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Syllabus Coverage Progress
            </span>
            <span className="text-amber-400 font-bold">{completedCount} of {items.length} Sessions Complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-warm-950 overflow-hidden border border-warm-800/40">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-primary-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode View Switcher Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-warm-800/40 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: "calendar", label: "Interactive Calendar", icon: CalendarIcon },
            { id: "timeline", label: "Milestone Schedule List", icon: ListFilter },
            { id: "analytics", label: "Pace Analytics", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-amber-500 text-warm-950 shadow-lg shadow-amber-500/20"
                    : "bg-warm-950/60 text-warm-400 hover:text-warm-100 hover:bg-warm-900/40 border border-warm-800/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: INTERACTIVE CALENDAR VIEW */}
      {activeTab === "calendar" && (
        <div className="glass-card p-6 rounded-3xl border border-warm-800/30 space-y-6">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-warm-100 font-display">
                  {monthNames[month]} {year}
                </h3>
                <p className="text-xs text-warm-400">
                  Click on any day cell to view session details or launch Study Studio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-warm-950 border border-warm-800/40 text-warm-300 hover:text-warm-100 hover:bg-warm-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentCalendarDate(today)}
                className="px-3 py-1.5 rounded-xl bg-warm-950 border border-warm-800/40 text-xs text-amber-400 font-semibold hover:bg-warm-900 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-warm-950 border border-warm-800/40 text-warm-300 hover:text-warm-100 hover:bg-warm-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Header (Days of week) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-warm-500 pb-2 border-b border-warm-800/30">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset cells for start of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[100px] rounded-2xl bg-warm-950/20 border border-warm-900/30 opacity-30 pointer-events-none"
              />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
              const dayNum = dayIdx + 1;
              const dateStr = formatDateString(year, month, dayNum);
              const dayEntries = scheduleByDate[dateStr] || [];

              // Check if date is today or exam date
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === dayNum;

              const isExamDay = dateStr === roadmap.exam_date;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (dayEntries.length > 0) {
                      setSelectedDayItem(dayEntries[0]);
                    }
                  }}
                  className={`min-h-[105px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                    isExamDay
                      ? "bg-gradient-to-b from-amber-500/25 to-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40"
                      : isToday
                      ? "bg-primary-500/10 border-primary-500/50 ring-1 ring-primary-500/30"
                      : dayEntries.length > 0
                      ? "bg-warm-950/60 border-warm-800/40 hover:border-amber-500/40 hover:bg-warm-900/40"
                      : "bg-warm-950/30 border-warm-900/40 hover:bg-warm-900/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                        isToday
                          ? "bg-primary-500 text-warm-950"
                          : isExamDay
                          ? "bg-amber-500 text-warm-950"
                          : "text-warm-300"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {isExamDay && (
                      <span className="text-[10px] font-black text-amber-300 flex items-center gap-1 uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                        <Trophy className="w-3 h-3 text-amber-400" /> EXAM
                      </span>
                    )}

                    {isToday && !isExamDay && (
                      <span className="text-[9px] font-bold text-primary-300 uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Scheduled Items Preview */}
                  <div className="space-y-1.5 my-1">
                    {dayEntries.length > 0 ? (
                      dayEntries.map((entry, idx) => {
                        const isDone = entry.status === "completed";
                        const isOver = entry.status === "overdue";

                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                              isDone
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                                : isOver
                                ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-200 group-hover:bg-amber-500/20"
                            }`}
                          >
                            <div className="truncate font-medium">
                              {entry.unit_label || entry.topic_title}
                            </div>
                            <div className="text-[9px] opacity-80 flex items-center justify-between mt-0.5 font-mono">
                              <span>⚡ {entry.allocated_hours || 2}h</span>
                              <span>{isDone ? "✓ Done" : "Pending"}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-warm-600 block italic">Rest / Buffer</span>
                    )}
                  </div>

                  {dayEntries.length > 0 && (
                    <div className="text-[9px] text-amber-400 font-semibold text-right group-hover:underline">
                      View Session $\rightarrow$
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONE LIST TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-warm-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-400" />
            Milestone Study Sessions ({items.length} Total Sessions)
          </h3>

          <div className="space-y-3">
            {items.map((entry, idx) => {
              const isCompleted = entry.status === "completed";
              const isOverdue = entry.status === "overdue";
              const taskName =
                entry.target_task ||
                (entry.unit_label ? `Study ${entry.unit_label}` : entry.topic_title);

              return (
                <div
                  key={idx}
                  className={`glass-card p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : isOverdue
                      ? "border-rose-500/30 bg-rose-950/10"
                      : "border-warm-800/30 hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-warm-950 text-amber-400 font-mono text-xs font-bold flex flex-col items-center justify-center border border-warm-800/40 flex-shrink-0">
                      <span className="text-[9px] text-warm-500 uppercase">DAY</span>
                      <span className="text-sm font-black">{entry.day_number}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-warm-100">
                          {entry.topic_title || entry.unit_label}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-warm-900 text-warm-300 font-mono border border-warm-800/40">
                          📅 {entry.date}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                          ⚡ {entry.allocated_hours || 2} Hours
                        </span>
                      </div>

                      <p className="text-xs text-warm-300 mt-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary-400" />
                        Task Goal: <span className="text-warm-100 font-semibold">{taskName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : isOverdue
                          ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                          : "bg-warm-900 text-warm-400 border-warm-800/50"
                      }`}
                    >
                      {entry.status}
                    </span>

                    <Link
                      href={`/study?topic_id=${entry.topic_id || ""}`}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-warm-950 text-xs font-bold shadow-lg shadow-amber-500/10 flex items-center gap-1.5 transition-all"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Execute Session</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PACE ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="glass-card p-6 rounded-3xl border border-warm-800/30 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-warm-100 font-display">
              Workload & Topic Weight Distribution
            </h3>
            <p className="text-xs text-warm-400 mt-0.5">
              PadhaiMate allocates extra study hours to weaker topics while keeping you strictly on track for exam day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-warm-950/60 border border-warm-800/40 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-bold text-warm-100">
                      {item.unit_label || item.topic_title}
                    </h5>
                    <span className="text-[10px] text-warm-400 font-mono">Scheduled: {item.date}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {item.allocated_hours || 2.0} Hours
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-warm-900 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, ((item.allocated_hours || 2) / 4) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SESSION DETAILS MODAL */}
      {selectedDayItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="glass-card p-6 rounded-3xl border border-amber-500/40 max-w-md w-full space-y-5 bg-surface">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Day {selectedDayItem.day_number} Session Details
                </span>
                <h3 className="text-xl font-extrabold text-warm-100 mt-0.5">
                  {selectedDayItem.unit_label || selectedDayItem.topic_title}
                </h3>
                <span className="text-xs text-warm-400 font-mono">📅 Scheduled for {selectedDayItem.date}</span>
              </div>
              <button
                onClick={() => setSelectedDayItem(null)}
                className="p-1.5 rounded-xl bg-warm-900 text-warm-400 hover:text-warm-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-warm-950 border border-warm-800/40 space-y-2">
              <div className="text-xs font-semibold text-warm-300">Target Learning Goal:</div>
              <p className="text-xs text-warm-200 leading-relaxed">
                {selectedDayItem.target_task || `Study core concepts for ${selectedDayItem.unit_label}`}
              </p>

              <div className="pt-2 flex justify-between text-xs font-mono text-warm-400 border-t border-warm-800/30">
                <span>Allocated Study Time:</span>
                <span className="text-amber-400 font-bold">{selectedDayItem.allocated_hours || 2} Hours</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDayItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-warm-400 hover:text-warm-100"
              >
                Close
              </button>
              <Link
                href={`/study?topic_id=${selectedDayItem.topic_id || ""}`}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-warm-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Launch in Study Studio</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
