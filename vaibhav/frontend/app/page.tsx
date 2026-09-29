"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLearner } from "@/context/LearnerContext";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const FEATURE_CARDS = [
  {
    title: "Syllabus\nGraph",
    subtitle: "Upload & Visualize",
    description: "Transform any syllabus into an interactive knowledge graph with prerequisite pathways.",
    href: "/syllabus",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=750&fit=crop&crop=center&q=80",
    tag: "01",
  },
  {
    title: "Study\nStudio",
    subtitle: "Learn & Practice",
    description: "Generate summaries, flashcards, quizzes, and problem-solving guides grounded in your material.",
    href: "/study",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=750&fit=crop&crop=center&q=80",
    tag: "02",
  },
  {
    title: "Exam\nRoadmap",
    subtitle: "Plan & Conquer",
    description: "Dynamic deadline-driven study schedules that re-pace automatically when you fall behind.",
    href: "/exam-mode",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=750&fit=crop&crop=center&q=80",
    tag: "03",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useLearner();

  useEffect(() => {
    const storedUser = localStorage.getItem("padhaimate_user");
    if (!user && !storedUser) {
      router.push("/login");
    }
  }, [user, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* ─── Hero Section ─── */}
      <section className="flex-1 flex flex-col justify-center pt-4 pb-12">
        {/* Top Line */}
        <div
          className="flex items-center gap-4 mb-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          <div className="w-2 h-2 rounded-full bg-primary-400"></div>
          <span className="hero-subtitle text-xs text-warm-400 tracking-[0.2em]">
            Your Personal Learning Companion
          </span>
        </div>

        {/* Hero Title */}
        <div className="mb-10">
          <h1
            className="hero-title text-[clamp(3.5rem,8vw,7rem)] text-warm-100 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
          >
            Padhai
          </h1>
          <h1
            className="hero-title text-[clamp(3.5rem,8vw,7rem)] text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-warm-300 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
          >
            Mate
          </h1>
        </div>

        {/* Tagline + CTA Row */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <p className="text-warm-400 text-sm md:text-base max-w-md leading-relaxed font-light">
            An adaptive learning platform that converts your syllabus into a personalized
            study journey — complete with knowledge graphs, study kits, mastery tracking,
            and exam roadmaps.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/syllabus"
              className="group flex items-center gap-3 px-6 py-3.5 rounded-full bg-primary-500 hover:bg-primary-400 text-warm-950 font-semibold text-sm transition-all duration-300 shadow-lg shadow-primary-500/20"
            >
              <span>Start Learning</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/mastery"
              className="warm-link text-sm text-warm-300 hover:text-warm-100 font-medium transition-colors"
            >
              View Progress
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-warm-800 to-transparent mb-12"></div>

      {/* ─── Editorial Feature Cards ─── */}
      <section
        className="pb-12 opacity-0 animate-fade-up"
        style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="hero-subtitle text-xs text-warm-500 tracking-[0.2em]">
            Core Features
          </h2>
          <span className="text-xs text-warm-600">
            {user?.full_name ? `Welcome, ${user.full_name}` : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURE_CARDS.map((card, i) => (
            <Link key={card.tag} href={card.href}>
              <div
                className="editorial-card group h-[420px] relative opacity-0 animate-fade-up"
                style={{
                  animationDelay: `${0.8 + i * 0.15}s`,
                  animationFillMode: "forwards",
                }}
              >
                {/* Image */}
                <img
                  src={card.image}
                  alt={card.subtitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="card-overlay"></div>

                {/* Tag Number */}
                <div className="absolute top-5 right-5 text-xs font-mono text-warm-500/60 tracking-widest">
                  {card.tag}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-primary-400 font-semibold mb-2">
                    {card.subtitle}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-warm-100 leading-tight whitespace-pre-line mb-3">
                    {card.title}
                  </h3>
                  <p className="text-xs text-warm-400 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center gap-2 text-primary-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Explore</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Bottom Stats Bar ─── */}
      <section
        className="py-8 border-t border-warm-900/50 opacity-0 animate-fade-up"
        style={{ animationDelay: "1.2s", animationFillMode: "forwards" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-display font-bold text-warm-200">5+</div>
            <div className="text-xs text-warm-500 mt-1">Study Tools</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-warm-200">RAG</div>
            <div className="text-xs text-warm-500 mt-1">Grounded Generation</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-warm-200">Adaptive</div>
            <div className="text-xs text-warm-500 mt-1">Remediation Engine</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-warm-200">Real-time</div>
            <div className="text-xs text-warm-500 mt-1">Progress Tracking</div>
          </div>
        </div>
      </section>
    </div>
  );
}
