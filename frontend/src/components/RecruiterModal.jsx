import React from 'react';

export default function RecruiterModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] border border-[#262626] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              📋 AI Full-Stack Assignment Verification
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Candidate: <strong className="text-white">PARAG AKABARI</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xl font-bold w-7 h-7 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-2.5 text-xs text-neutral-300">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <strong className="text-white">1. Ethical Data Collection:</strong> Scraped public Dar Global & Wasalt data, respecting robots.txt & terms.
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <strong className="text-white">2. Grounded AI Chatbot:</strong> BM25 retrieved 59 verified documents; strictly grounded responses.
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <strong className="text-white">3. OpenRouter Models:</strong> GPT-4o, Gemini 2.0 Flash, Llama 3.3 70B with SSE token streaming.
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <strong className="text-white">4. Production Container:</strong> Multi-stage Dockerfile with non-root appuser on port 8000.
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <span className="text-emerald-400 font-bold">✓</span>
            <div>
              <strong className="text-white">5. Public Live URL:</strong> Deployed with Cloudflare public edge tunnel for live review.
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition"
          >
            Close Verification
          </button>
        </div>
      </div>
    </div>
  );
}
