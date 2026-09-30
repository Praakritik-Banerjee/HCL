"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLearner } from "@/context/LearnerContext";
import { User as UserIcon, Calendar } from "lucide-react";

export default function Header() {
  const { user, learnerId, setLearnerId, examModeActive } = useLearner();
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(learnerId);

  const handleSave = () => {
    if (inputVal.trim()) {
      setLearnerId(inputVal.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="h-14 border-b border-warm-900/40 bg-[#1e1812]/60 backdrop-blur-xl px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.15em] text-warm-500 font-semibold">
          PadhaiMate
        </span>
        <span className="text-warm-800">/</span>
        <h1 className="text-xs font-medium text-warm-300">
          Personalized Learning Path
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Exam Mode Quick Indicator */}
        <Link
          href="/exam-mode"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            examModeActive
              ? "bg-accent-amber/15 text-accent-amber border border-accent-amber/30 hover:bg-accent-amber/25"
              : "bg-warm-900/40 text-warm-500 border border-warm-800/40 hover:text-warm-300"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Exam: {examModeActive ? "ACTIVE" : "OFF"}</span>
          {examModeActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-ping"></span>
          )}
        </Link>

        {/* Learner Info */}
        <div className="flex items-center gap-2 bg-warm-900/30 border border-warm-800/30 rounded-xl px-3 py-1.5">
          <UserIcon className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs text-warm-500 font-medium">Student:</span>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="bg-warm-950 border border-primary-500/40 rounded px-2 py-0.5 text-xs text-warm-100 focus:outline-none w-28"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="text-xs text-accent-emerald hover:text-accent-emerald/80 font-medium"
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
              className="text-xs font-semibold text-warm-200 hover:text-primary-300 underline decoration-dotted transition-colors"
              title="Click to switch student profile ID"
            >
              {user?.full_name || learnerId || "Student"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
