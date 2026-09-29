"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  BookOpen,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  GraduationCap,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Journey", href: "/", icon: Compass, badge: "AI Core" },
  { name: "Syllabus Hub", href: "/syllabus", icon: BookOpen },
  { name: "Study Studio", href: "/study", icon: Sparkles },
  { name: "Mastery Analytics", href: "/mastery", icon: BarChart3 },
  { name: "Exam Mode", href: "/exam-mode", icon: Calendar, badge: "Timed" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 min-h-screen glass-panel border-r border-white/5 flex flex-col justify-between p-4 z-20">
      <div>
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-primary-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              PathGen<span className="text-primary-400">AI</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Adaptive Learning System
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-600/20 text-primary-300 border border-primary-500/30 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-primary-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      isActive
                        ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700/50"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/5 px-2">
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Agent State
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            LangGraph reasoning graph active & grounded.
          </p>
        </div>
      </div>
    </aside>
  );
}
