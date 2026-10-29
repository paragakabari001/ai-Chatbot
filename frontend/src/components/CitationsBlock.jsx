import React, { useState, useEffect } from 'react';

export default function CitationsBlock({ citations, loading }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!loading && citations && citations.length > 0) {
      const t = setTimeout(() => setRevealed(true), 250);
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
      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
        Sources & Knowledge Grounding
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] border border-[#222222] hover:border-neutral-600 text-xs text-neutral-300 hover:text-white transition animate-appear"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${c.source === 'Dar Global' ? 'bg-[#D4AF37]' : 'bg-[#10B981]'}`} />
            <span className="font-semibold text-white">{c.source}:</span>
            <span className="truncate max-w-[160px] sm:max-w-[260px] text-neutral-400">{c.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
