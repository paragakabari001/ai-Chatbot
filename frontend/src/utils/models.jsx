import React from 'react';

// ── Official Brand SVG Icons ──────────────────────────────────────────────────

export const OpenAIIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0405l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3428 7.897a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3428 7.897zm16.5976 3.8242l-5.819-3.3638 2.02-1.1635a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4258-.691zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.4074 9.204V6.8717a.0662.0662 0 0 1 .0284-.0615l4.9937-2.886a4.504 4.504 0 0 1 6.5208 4.9084zm-9.637 5.9373l-2.4842-1.4338 2.4842-1.4338 2.4842 1.4338z" />
  </svg>
);

export const GeminiIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
      fill="url(#gemini-grad)"
    />
    <defs>
      <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4E82EE" />
        <stop offset="0.5" stopColor="#9B72CF" />
        <stop offset="1" stopColor="#F46675" />
      </linearGradient>
    </defs>
  </svg>
);

export const MetaLlamaIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.96 5.86c-1.89 0-3.32.96-4.96 2.94-1.64-1.98-3.07-2.94-4.96-2.94C3.12 5.86 0 8.87 0 13.06c0 4.67 3.65 8.08 7.35 8.08 2.03 0 3.52-.96 4.65-2.52 1.13 1.56 2.62 2.52 4.65 2.52 3.7 0 7.35-3.41 7.35-8.08 0-4.19-3.12-7.2-7.04-7.2zm0 13.56c-1.63 0-2.85-.92-3.83-2.45l.83-1.07c.8 1.25 1.74 1.84 3 1.84 2.5 0 4.88-2.39 4.88-5.68 0-2.83-1.95-4.88-4.88-4.88-1.57 0-2.73.84-3.69 2.27l-1.31 1.95-1.31-1.95c-.96-1.43-2.12-2.27-3.69-2.27-2.93 0-4.88 2.05-4.88 4.88 0 3.29 2.38 5.68 4.88 5.68 1.26 0 2.2-.59 3-1.84l.83 1.07c-.98 1.53-2.2 2.45-3.83 2.45-3.6 0-6.72-2.96-6.72-7.36 0-3.79 2.76-6.48 6.72-6.48 1.98 0 3.48.97 4.96 2.9 1.48-1.93 2.98-2.9 4.96-2.9 3.96 0 6.72 2.69 6.72 6.48 0 4.4-3.12 7.36-6.72 7.36z" />
  </svg>
);

// ── Supported AI Models with Real Icons ────────────────────────────────────────

export const SUPPORTED_MODELS = [
  {
    id: "openai/gpt-4o",
    label: "OpenAI GPT-4o",
    shortLabel: "GPT-4o",
    desc: "Flagship intelligence & precision grounding",
    badge: "Recommended",
    badgeColor: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    icon: OpenAIIcon,
    iconColor: "text-emerald-400"
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    shortLabel: "Gemini Flash",
    desc: "High-speed conversational reasoning",
    badge: "Fast",
    badgeColor: "bg-neutral-800 text-neutral-300 border border-neutral-700/60",
    icon: GeminiIcon,
    iconColor: "text-blue-400"
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    shortLabel: "Llama 3.3",
    desc: "Open-weights deep instruction following",
    badge: "Balanced",
    badgeColor: "bg-neutral-800 text-neutral-300 border border-neutral-700/60",
    icon: MetaLlamaIcon,
    iconColor: "text-blue-500"
  }
];
