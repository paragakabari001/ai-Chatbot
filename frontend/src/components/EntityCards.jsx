import React from 'react';

export default function EntityCards({ text }) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const cards = [];

  if (lower.includes("davinci") || lower.includes("pagani")) {
    cards.push({
      title: "DaVinci Tower by Pagani",
      partner: "Pagani Automobili",
      loc: "Downtown Dubai Canal",
      desc: "Ultra-luxury residential landmark with carbon-fiber architecture and Burj Khalifa views.",
      url: "https://darglobal.co.uk/projects"
    });
  }

  if (lower.includes("aida") || lower.includes("muscat")) {
    cards.push({
      title: "AIDA Muscat Community",
      partner: "Trump International Golf",
      loc: "Muscat, Oman (130m Cliffside)",
      desc: "Freehold luxury cliffside villas, Trump Golf Club & permanent residency in Oman.",
      url: "https://darglobal.co.uk/projects"
    });
  }

  if (lower.includes("urban oasis") || lower.includes("missoni")) {
    cards.push({
      title: "Urban Oasis by Missoni",
      partner: "Missoni Italian Fashion",
      loc: "Dubai Canal, Business Bay",
      desc: "Signature Missoni zig-zag geometries, waterfront infinity pool & aquatic gym.",
      url: "https://darglobal.co.uk/projects"
    });
  }

  if (lower.includes("wasalt") || lower.includes("riyadh") || lower.includes("rega") || lower.includes("ejar")) {
    cards.push({
      title: "Wasalt Saudi Real Estate",
      partner: "REGA & Fal Licensed",
      loc: "Kingdom of Saudi Arabia",
      desc: "Verified properties for rent & sale, 360-degree tours & electronic Ejar contracts.",
      url: "https://wasalt.sa/en"
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-appear">
      {cards.slice(0, 2).map((c, i) => (
        <a
          key={i}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 text-xs transition"
        >
          <div className="flex items-center justify-between font-bold text-white mb-1">
            <span>🔗 {c.title}</span>
            <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded font-medium">
              {c.partner}
            </span>
          </div>
          <div className="text-neutral-500 text-[11px]">📍 {c.loc}</div>
          <div className="text-neutral-400 text-xs mt-1.5 leading-snug">{c.desc}</div>
        </a>
      ))}
    </div>
  );
}
