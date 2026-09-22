"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLearner } from "@/context/LearnerContext";
import { User, Flame, Calendar, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Header() {
  const { learnerId, setLearnerId, examModeActive } = useLearner();
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(learnerId);

  const handleSave = () => {
    if (inputVal.trim()) {
      setLearnerId(inputVal.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="h-16 border-b border-white/5 glass-panel px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Workspace
        </span>
        <span className="text-slate-600">/</span>
        <h1 className="text-sm font-semibold text-slate-200">
          Personalized Learning Path
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Exam Mode Quick Indicator */}
        <Link
          href="/exam-mode"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            examModeActive
              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
              : "bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Exam Mode: {examModeActive ? "ACTIVE" : "OFF"}</span>
          {examModeActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </Link>

        {/* Learner ID Selector */}
        <div className="flex items-center gap-2 bg-slate-800/70 border border-white/10 rounded-xl px-3 py-1.5">
          <User className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs text-slate-400 font-medium">Learner:</span>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="bg-slate-900 border border-primary-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-28"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setInputVal(learnerId);
                setIsEditing(true);
              }}
              className="text-xs font-semibold text-slate-200 hover:text-primary-300 underline decoration-dotted transition-colors"
              title="Click to switch learner"
            >
              {learnerId}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
