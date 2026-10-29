import React, { useState, useEffect } from 'react';

function CitationPill({ c, index }) {
  const [hovered, setHovered] = useState(false);
  const isDarGlobal = c.source === 'Dar Global';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition animate-appear border ${
          hovered
            ? "bg-[#1E1E1E] text-white border-neutral-500 shadow-md ring-1 ring-white/10"
            : "bg-[#141414] hover:bg-[#1A1A1A] text-neutral-300 hover:text-white border-[#242424]"
        }`}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isDarGlobal ? 'bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]' : 'bg-[#10B981] shadow-[0_0_6px_#10B981]'
          }`}
        />
        <span className="font-semibold text-white whitespace-nowrap">{c.source}:</span>
        <span className="truncate max-w-[150px] sm:max-w-[240px] text-neutral-400">{c.title}</span>
        <svg
          className="w-3 h-3 text-neutral-500 group-hover:text-white flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Rich Grounding Tooltip Popover on Hover */}
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3 bg-[#161616] border border-[#2E2E2E] rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] z-50 text-left pointer-events-auto animate-appear backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Row: Source + Category */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#242424] mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDarGlobal ? 'bg-[#D4AF37]' : 'bg-[#10B981]'}`} />
              <span className="text-[11px] font-bold text-white tracking-wide">{c.source}</span>
            </div>
            {c.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#202020] text-neutral-400 border border-neutral-800 font-medium">
                {c.category}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-xs font-semibold text-white leading-snug mb-1.5">
            {c.title}
          </h4>

          {/* Snippet / Grounded Excerpt */}
          {c.snippet && (
            <p className="text-[11px] text-neutral-400 leading-relaxed mb-2.5 line-clamp-3">
              "{c.snippet}"
            </p>
          )}

          {/* Bottom Action Link */}
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] font-semibold text-blue-400 hover:text-blue-300 pt-1.5 border-t border-[#222222] transition"
          >
            <span>Visit official portal</span>
            <span className="flex items-center gap-1">
              <span>{isDarGlobal ? "darglobal.co.uk" : "wasalt.sa"}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </a>

          {/* Downward triangle pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#2E2E2E]" />
        </div>
      )}
    </div>
  );
}

export default function CitationsBlock({ citations, loading }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!loading && citations && citations.length > 0) {
      const t = setTimeout(() => setRevealed(true), 200);
      return () => clearTimeout(t);
    }
    setRevealed(false);
  }, [loading, citations]);

  if (loading) {
    return (
      <div className="mt-4 pt-3 border-t border-[#1C1C1C]">
        <div className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">
          Sources & Knowledge Grounding
        </div>
        <div className="flex flex-wrap gap-2">
          {[90, 130, 100, 80].map((w, i) => (
            <div
              key={i}
              className="skeleton-line h-6 rounded-full"
              style={{ width: w, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!citations || citations.length === 0) return null;
  if (!revealed) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#1C1C1C] animate-appear">
      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Sources & Knowledge Grounding</span>
        <span className="text-[10px] text-neutral-600 font-normal">Hover to preview · Click to visit</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <CitationPill key={c.id || i} c={c} index={i} />
        ))}
      </div>
    </div>
  );
}
