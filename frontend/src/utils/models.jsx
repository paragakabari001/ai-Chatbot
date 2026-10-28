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
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

// ── Supported AI Models with Real Icons ────────────────────────────────────────

export const SUPPORTED_MODELS = [
  {
    id: "openai/gpt-4o",
    label: "OpenAI GPT-4o",
    shortLabel: "GPT-4o",
    badge: "⭐ Recommended",
    badgeColor: "bg-blue-600/30 text-blue-300 border border-blue-500/40",
    icon: OpenAIIcon,
    iconColor: "text-emerald-400"
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash",
    shortLabel: "Gemini Flash",
    badge: "Free",
    badgeColor: "bg-neutral-800 text-neutral-400 border border-neutral-700",
    icon: GeminiIcon,
    iconColor: "text-blue-400"
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B",
    shortLabel: "Llama 3.3",
    badge: "Free",
    badgeColor: "bg-neutral-800 text-neutral-400 border border-neutral-700",
    icon: MetaLlamaIcon,
    iconColor: "text-blue-500"
  }
];
