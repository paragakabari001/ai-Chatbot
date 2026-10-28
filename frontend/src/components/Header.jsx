import React from 'react';

export default function Header({ onOpenSidebar, onOpenRecruiterModal }) {
  return (
    <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#161616] z-20 flex-shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
          title="History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <a
            href="https://darglobal.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition"
          >
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
            <span className="font-semibold tracking-wide">DAR GLOBAL</span>
            <span className="text-[10px] text-neutral-600 font-normal hidden sm:inline">LSE:DAR</span>
          </a>
          <span className="text-neutral-700">/</span>
          <a
            href="https://wasalt.sa/en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
            <span className="font-semibold tracking-wide">WASALT</span>
            <span className="text-[10px] text-neutral-600 font-normal hidden sm:inline">KSA</span>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          title="Refresh application"
          className="text-neutral-400 hover:text-white transition p-1.5 rounded-lg hover:bg-neutral-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onOpenRecruiterModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#161616] border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Recruiter</span> Tasks
        </button>
      </div>
    </header>
  );
}
