"use client";

import React from "react";
import { Topic } from "@/types";
import {
  Layers,
  Sparkles,
  GitFork,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface TopicTreeProps {
  topics: Topic[];
  onSelectTopic?: (topic: Topic) => void;
}

export default function TopicTree({ topics, onSelectTopic }: TopicTreeProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-xs">
        No topics found in this syllabus yet.
      </div>
    );
  }

  // Sort topics by order index
  const sorted = [...topics].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-3">
      {sorted.map((topic, idx) => (
        <div
          key={topic.id}
          className="glass-card p-4 rounded-2xl border border-white/5 hover:border-primary-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-primary-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/5">
              {idx + 1}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">
                  {topic.title}
                </h4>
                {topic.parent_id && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                    Sub-topic
                  </span>
                )}
              </div>

              {topic.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {topic.description}
                </p>
              )}

              {/* Prerequisites pills */}
              {topic.prerequisites && topic.prerequisites.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <GitFork className="w-2.5 h-2.5" /> Prerequisites:
                  </span>
                  {topic.prerequisites.map((prereqId, pIdx) => {
                    const prereqObj = topics.find((t) => t.id === prereqId);
                    return (
                      <span
                        key={pIdx}
                        className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-white/5"
                      >
                        {prereqObj?.title || prereqId}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onSelectTopic ? (
              <button
                onClick={() => onSelectTopic(topic)}
                className="px-3.5 py-1.5 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Study Topic
              </button>
            ) : (
              <Link
                href={`/study?topic_id=${topic.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Study
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
