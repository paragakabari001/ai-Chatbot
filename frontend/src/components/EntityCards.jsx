import React from 'react';

export default function EntityCards({ text }) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const cards = [];

  if (lower.includes("davinci") || lower.includes("pagani")) {
    cards.push({
      title: "DaVinci Tower by Pagani",
      source: "Dar Global",
      partner: "Pagani Automobili",
      loc: "Downtown Dubai Canal, UAE",
      desc: "Ultra-luxury residential landmark featuring carbon-fiber aerodynamic architecture, bespoke Pagani interiors & direct Burj Khalifa canal views.",
      image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80",
      url: "https://darglobal.co.uk/projects",
      icon: "🏎️"
    });
  }

  if (lower.includes("aida") || lower.includes("muscat")) {
    cards.push({
      title: "AIDA Muscat Community",
      source: "Dar Global",
      partner: "Trump International Golf",
      loc: "Muscat, Oman (130m Cliffside)",
      desc: "Perched 130m above sea level with premium ocean-cliff villas, championship Trump Golf Course, luxury hotels and 100% freehold residency.",
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80",
      url: "https://darglobal.co.uk/projects",
      icon: "⛳"
    });
  }

  if (lower.includes("urban oasis") || lower.includes("missoni")) {
    cards.push({
      title: "Urban Oasis by Missoni",
      source: "Dar Global",
      partner: "Missoni Italian Fashion",
      loc: "Dubai Canal, Business Bay, UAE",
      desc: "Signature Missoni zig-zag geometries, waterfront luxury apartments, infinity pool on Dubai Canal & state-of-the-art aquatic gym.",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
      url: "https://darglobal.co.uk/projects",
      icon: "🌊"
    });
  }

  if (lower.includes("tierra viva") || lower.includes("lamborghini")) {
    cards.push({
      title: "Tierra Viva by Lamborghini",
      source: "Dar Global",
      partner: "Automobili Lamborghini",
      loc: "Benahavís, Costa del Sol, Spain",
      desc: "Super-luxury complex of 53 autonomous villas inspired by Lamborghini supercar design with panoramic views of the Mediterranean Sea.",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
      url: "https://darglobal.co.uk/projects",
      icon: "🐂"
    });
  }

  if (lower.includes("les vagues") || lower.includes("elie saab")) {
    cards.push({
      title: "Les Vagues by Elie Saab",
      source: "Dar Global",
      partner: "Elie Saab Maison",
      loc: "Qetaifan Island North, Qatar",
      desc: "Sophisticated sea-front residences crafted with haute couture precision, private beach access and sweeping views of the Arabian Gulf.",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
      url: "https://darglobal.co.uk/projects",
      icon: "✨"
    });
  }

  if (lower.includes("wasalt") || lower.includes("riyadh") || lower.includes("rega") || lower.includes("ejar") || lower.includes("saudi")) {
    cards.push({
      title: "Wasalt Saudi Real Estate",
      source: "Wasalt",
      partner: "REGA & Fal Certified",
      loc: "Riyadh & Across KSA",
      desc: "Kingdom of Saudi Arabia's premier verified property marketplace. 360° virtual tours, interactive master plans & seamless Ejar digital contracts.",
      image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80",
      url: "https://wasalt.sa/en",
      icon: "🇸🇦"
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="mt-3.5 mb-2">
      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span>📸</span>
        <span>Featured Portals & Real Estate Previews</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-appear">
        {cards.slice(0, 2).map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl overflow-hidden bg-[#141414] border border-[#262626] hover:border-neutral-500 shadow-md hover:shadow-xl transition-all duration-200"
          >
            {/* Top Image Preview with fallback */}
            <div className="relative h-32 w-full overflow-hidden bg-neutral-900 flex items-center justify-center">
              {/* Fallback Icon in case image is loading or fails */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 select-none">
                <span className="text-3xl mb-1">{c.icon || "🏢"}</span>
                <span className="text-[10px] uppercase tracking-wider">{c.source}</span>
              </div>

              {/* Verified High-Res Architectural Photo */}
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="relative z-10 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Gradient scrim overlay */}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#141414] via-transparent to-black/30 pointer-events-none" />

              {/* Overlay Badges */}
              <div className="absolute top-2 left-2 z-30">
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-black/75 backdrop-blur-md text-emerald-400 rounded-md border border-emerald-500/30">
                  {c.source}
                </span>
              </div>
              <div className="absolute top-2 right-2 z-30">
                <span className="text-[10px] font-medium px-2 py-0.5 bg-black/75 backdrop-blur-md text-neutral-200 rounded-md border border-white/10">
                  {c.partner}
                </span>
              </div>
            </div>

            {/* Bottom Details Content */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
              <div>
                <h4 className="font-semibold text-white text-xs group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>{c.title}</span>
                  <span className="text-neutral-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5">
                    ↗
                  </span>
                </h4>
                <div className="text-neutral-400 text-[11px] mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span>{c.loc}</span>
                </div>
                <p className="text-neutral-400 text-[11.5px] mt-2 line-clamp-2 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#262626] flex items-center justify-between text-[11px] text-emerald-400/90 font-medium">
                <span>View Official Portal</span>
                <span className="text-neutral-500 group-hover:text-emerald-400 text-xs">Explore →</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
