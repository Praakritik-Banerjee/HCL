"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import {
  Compass,
  BookOpen,
  Sparkles,
  BarChart3,
  Calendar,
  LogOut,
  UserCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Compass },
  { name: "Syllabus Hub", href: "/syllabus", icon: BookOpen },
  { name: "Study Studio", href: "/study", icon: Sparkles },
  { name: "Mastery", href: "/mastery", icon: BarChart3 },
  { name: "Exam Mode", href: "/exam-mode", icon: Calendar, badge: "Timed" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logoutUser } = useLearner();

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <aside className="w-60 flex-shrink-0 min-h-screen bg-[#1e1812]/80 backdrop-blur-xl border-r border-warm-900/40 flex flex-col justify-between p-4 z-20">
      <div>
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <span className="text-warm-950 font-extrabold text-sm font-display">P</span>
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-warm-100 font-display">
              Padhai<span className="text-primary-400">Mate</span>
            </div>
            <div className="text-[10px] text-warm-500 font-medium tracking-wide">
              Learning Platform
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-500/15 text-primary-300 border border-primary-500/20"
                    : "text-warm-400 hover:text-warm-200 hover:bg-warm-900/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-primary-400" : "text-warm-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      isActive
                        ? "bg-primary-500/15 text-primary-300 border border-primary-500/25"
                        : "bg-warm-900/50 text-warm-500 border border-warm-800/50"
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

      {/* User Session & Logout */}
      <div className="pt-4 border-t border-warm-900/40 space-y-3">
        {user ? (
          <div className="glass-card p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                {user.full_name?.charAt(0).toUpperCase() || "S"}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-warm-200 truncate">{user.full_name}</div>
                <div className="text-[10px] text-warm-500 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-warm-500 hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-500 hover:bg-primary-400 text-warm-950 rounded-xl text-xs font-semibold shadow transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign In / Register</span>
          </Link>
        )}

        <div className="glass-card p-2.5 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-warm-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
              Tutor Engine
            </span>
            <span className="text-[9px] bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 px-1.5 py-0.5 rounded">
              Ready
            </span>
          </div>
          <p className="text-[10px] text-warm-500 leading-relaxed">
            Personalized topic tracking & grounded RAG active.
          </p>
        </div>
      </div>
    </aside>
  );
}
