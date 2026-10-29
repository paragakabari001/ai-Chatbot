import React, { useState, useEffect, useRef, useMemo } from 'react';

function getDomain(url, fallbackSource) {
  try {
    if (url && typeof url === 'string') {
      const firstUrl = url.split(" and ")[0].trim();
      const u = new URL(firstUrl);
      return u.hostname.replace(/^www\./, '');
    }
  } catch {}
  return fallbackSource === 'Dar Global' ? 'darglobal.co.uk' : 'wasalt.sa';
}

function CitationPill({ c, index }) {
  if (!c || typeof c !== 'object') return null;

  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef(null);

  const source = c.source || "Grounded Source";
  const isDarGlobal = source === 'Dar Global';
  const rawUrl = c.url || (isDarGlobal ? "https://darglobal.co.uk/" : "https://wasalt.sa/en");
  const firstUrl = typeof rawUrl === 'string' ? rawUrl.split(" and ")[0].trim() : "https://wasalt.sa/en";
  const domain = getDomain(firstUrl, source);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const fallbackFaviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  const title = c.title || "Official Reference";

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovered(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clean original pill layout with small, subtle dot + live favicon */}
      <a
        href={firstUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition animate-appear border ${
          hovered
            ? "bg-[#1E1E1E] text-white border-neutral-500 shadow-md ring-1 ring-white/10"
            : "bg-[#141414] hover:bg-[#1A1A1A] text-neutral-300 hover:text-white border-[#242424]"
        }`}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        {/* Small subtle status dot with low lighting (no heavy neon glare) */}
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            isDarGlobal
              ? 'bg-[#EAB308]'
              : source === 'Wasalt'
              ? 'bg-[#10B981]'
              : 'bg-[#06B6D4]'
          }`}
        />

        {/* Live fetched domain favicon */}
        <img
          src={faviconUrl}
          alt=""
          className="w-3.5 h-3.5 rounded-sm object-contain flex-shrink-0"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackFaviconUrl;
            e.currentTarget.onerror = () => { e.currentTarget.style.display = 'none'; };
          }}
        />

        <span className="font-semibold text-white whitespace-nowrap">{source}:</span>
        <span className="truncate max-w-[150px] sm:max-w-[240px] text-neutral-400">{title}</span>
        <svg
          className="w-3 h-3 text-neutral-500 group-hover:text-white flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Rich Grounding Tooltip Popover with Invisible Hover Bridge */}
      {hovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2.5 z-50 pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="w-72 sm:w-80 p-3 bg-[#161616] border border-[#2E2E2E] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.9)] text-left animate-appear backdrop-blur-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Row: Small Dot + Favicon + Source + Category */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#242424] mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isDarGlobal ? 'bg-[#EAB308]' : source === 'Wasalt' ? 'bg-[#10B981]' : 'bg-[#06B6D4]'
                  }`}
                />
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-[11px] font-bold text-white tracking-wide">{source}</span>
              </div>
              {c.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#202020] text-neutral-400 border border-neutral-800 font-medium">
                  {c.category}
                </span>
              )}
            </div>

            {/* Document Title */}
            <h4 className="text-xs font-semibold text-white leading-snug mb-1.5">
              {title}
            </h4>

            {/* Grounded Excerpt Snippet */}
            {c.snippet && (
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-2.5 line-clamp-3 bg-[#121212] p-2 rounded-lg border border-[#222222]">
                "{c.snippet}"
              </p>
            )}

            {/* Bottom Action Link with Favicon */}
            <a
              href={firstUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[11px] font-semibold text-blue-400 hover:text-blue-300 pt-1.5 border-t border-[#222222] transition"
            >
              <span className="flex items-center gap-1.5">
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span>Visit official portal</span>
              </span>
              <span className="flex items-center gap-1 text-neutral-400 font-normal">
                <span>{domain}</span>
                <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </a>

            {/* Downward triangle pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#2E2E2E]" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CitationsBlock({ citations, loading }) {
  const [revealed, setRevealed] = useState(false);

  const safeCitations = useMemo(() => {
    if (!Array.isArray(citations)) return [];
    return citations.filter(c => c && typeof c === 'object');
  }, [citations]);

  useEffect(() => {
    if (!loading && safeCitations.length > 0) {
      const t = setTimeout(() => setRevealed(true), 150);
      return () => clearTimeout(t);
    }
    setRevealed(false);
  }, [loading, safeCitations]);

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

  if (safeCitations.length === 0 || !revealed) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#1C1C1C] animate-appear">
      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>Sources & Knowledge Grounding</span>
        <span className="text-[10px] text-neutral-600 font-normal">Hover to preview · Click to visit</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {safeCitations.map((c, i) => (
          <CitationPill key={c.id || i} c={c} index={i} />
        ))}
      </div>
    </div>
  );
}
