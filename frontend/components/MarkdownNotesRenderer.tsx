"use client";

import React from "react";

interface MarkdownNotesRendererProps {
  content: string;
}

export default function MarkdownNotesRenderer({ content }: MarkdownNotesRendererProps) {
  if (!content) return null;

  // Clean raw LaTeX formatting into clean readable math text if present
  const cleanContent = content
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\$\\vec\{E\} = \\frac\{\\vec\{F\}\}\{q_0\}\$/g, "E = F / q₀")
    .replace(/\$\\Phi_E = \\oint \\vec\{E\} \\cdot d\\vec\{A\} = \\frac\{Q_\{\\text\{enc\}\}\}\{\\varepsilon_0\}\$/g, "Φ_E = ∮ E · dA = Q_enclosed / ε₀")
    .replace(/\$F = k \\frac\{\|q_1 q_2\|\}\{r\^2\}\$/g, "F = k · |q₁ · q₂| / r²")
    .replace(/\$V = \\frac\{k q\}\{r\}\$/g, "V = k · q / r")
    .replace(/\$U = \\frac\{k q_1 q_2\}\{r\}\$/g, "U = k · q₁ · q₂ / r")
    .replace(/\$C = \\frac\{Q\}\{V\} = \\frac\{\\varepsilon_0 A\}\{d\}\$/g, "C = Q / V = ε₀ · A / d")
    .replace(/\$\\vec\{p\} = q \\vec\{d\}\$/g, "p = q · d")
    .replace(/\$\\vec\{\\tau\} = \\vec\{p\} \\times \\vec\{E\}\$/g, "τ = p × E")
    .replace(/\$\\vec\{E\} = 0\$/g, "E = 0")
    .replace(/\$C = K C_0\$/g, "C = K · C₀")
    .replace(/\$q = ne\$/g, "q = n · e")
    .replace(/\$([^\$]+)\$/g, "$1"); // Strip remaining single dollar signs for clean display

  // Split into lines
  const lines = cleanContent.split("\n");

  return (
    <div className="space-y-4 text-warm-200 leading-relaxed text-xs sm:text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) return <div key={idx} className="h-1" />;

        // Section Headers (e.g. ### Header)
        if (trimmed.startsWith("###")) {
          const headerText = trimmed.replace(/^###\s*/, "");
          return (
            <div key={idx} className="pt-4 pb-1 border-b border-warm-800/40">
              <h3 className="text-sm sm:text-base font-bold text-amber-400 font-display flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-amber-400" />
                {headerText}
              </h3>
            </div>
          );
        }

        // Subheaders (e.g. ## Header or #### Header)
        if (trimmed.startsWith("##")) {
          const headerText = trimmed.replace(/^##+\s*/, "");
          return (
            <h4 key={idx} className="text-xs sm:text-sm font-bold text-warm-100 font-display pt-2">
              {headerText}
            </h4>
          );
        }

        // Bullet points (e.g. - **Title**: text)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletContent = trimmed.replace(/^[-*]\s*/, "");
          const boldMatch = bulletContent.match(/^\*\*(.*?)\*\*:\s*(.*)/);

          if (boldMatch) {
            const [, title, body] = boldMatch;
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2 py-0.5 group">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 mt-2 group-hover:scale-125 transition-transform" />
                <div>
                  <span className="font-bold text-warm-100 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20 text-xs">
                    {title}
                  </span>
                  <span className="text-warm-300 pl-1.5">{body}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
              <span className="text-warm-300">{bulletContent}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-warm-300 leading-relaxed pl-1">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
