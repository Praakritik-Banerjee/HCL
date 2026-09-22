"use client";

import React, { useState } from "react";
import { FlashcardResponse } from "@/types";
import CitationDrawer from "./CitationDrawer";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  FileText,
  ThumbsUp,
  RotateCcw,
} from "lucide-react";

interface FlashcardViewerProps {
  deck: FlashcardResponse;
  onFinished?: () => void;
}

export default function FlashcardViewer({ deck, onFinished }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<{ [idx: number]: boolean }>({});

  const [selectedCitations, setSelectedCitations] = useState<string[]>([]);
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  const currentCard = deck.cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < deck.cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMark = (isKnown: boolean) => {
    setKnownCards((prev) => ({ ...prev, [currentIndex]: isKnown }));
    if (currentIndex < deck.cards.length - 1) {
      handleNext();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Deck Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-primary-400 uppercase tracking-wider">
            Flashcard Deck
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5">
            {deck.topic_title || "Study Flashcards"}
          </h2>
        </div>

        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/5">
          {currentIndex + 1} of {deck.cards.length}
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="perspective-1000 w-full h-80 cursor-pointer select-none group"
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden glass-card rounded-3xl p-8 flex flex-col justify-between border border-white/10 group-hover:border-primary-500/40">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                Prompt / Concept
              </span>
              <span className="text-[11px] text-slate-500">Click anywhere to flip</span>
            </div>

            <div className="text-center px-4">
              <p className="text-xl font-semibold text-white leading-relaxed">
                {currentCard?.front}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Card {currentIndex + 1}</span>
              <span className="flex items-center gap-1 text-primary-400">
                <RotateCw className="w-3 h-3" /> Flip for Answer
              </span>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card bg-indigo-950/20 rounded-3xl p-8 flex flex-col justify-between border border-indigo-500/30">
            <div className="flex items-center justify-between text-xs text-indigo-300">
              <span className="font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Verified Answer
              </span>

              {currentCard?.source_chunk_ids && currentCard.source_chunk_ids.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCitations(currentCard.source_chunk_ids);
                    setIsCitationOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 text-[11px] hover:bg-indigo-500/30 border border-indigo-500/30"
                >
                  <FileText className="w-3 h-3" />
                  <span>{currentCard.source_chunk_ids.length} Citations</span>
                </button>
              )}
            </div>

            <div className="text-center px-4 overflow-y-auto max-h-48">
              <p className="text-lg font-medium text-slate-100 leading-relaxed">
                {currentCard?.back}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Click to flip back</span>
              <span className="text-emerald-400 font-medium">Grounded in chunks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === deck.cards.length - 1}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Self Rating */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMark(false)}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/5 hover:border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Still Learning
          </button>
          <button
            onClick={() => handleMark(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Got It!
          </button>
        </div>
      </div>

      <CitationDrawer
        chunkIds={selectedCitations}
        topicTitle={deck.topic_title}
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
      />
    </div>
  );
}
