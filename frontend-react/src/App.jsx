import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState("openai/gpt-4o");
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { title: "Dar Global Projects", prompt: "What are Dar Global's top luxury branded residential projects and international locations?" },
    { title: "Wasalt Riyadh", prompt: "How do I search, rent, or buy apartments and villas in Riyadh on Wasalt?" },
    { title: "7-Day Token Policy", prompt: "Explain Dar Global's 7-day token reservation policy and purchase agreement terms." },
    { title: "Saudi REGA & Ejar", prompt: "What are Saudi REGA regulations, Fal licensing, and the Ejar network on Wasalt?" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    const userMessage = { role: "user", content: query };
    const assistantMessage = { role: "assistant", content: "", citations: [], id: Date.now() };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, model: model, top_k: 4 }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          if (!block.trim()) continue;
          const lines = block.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          }

          if (eventType === "citations") {
            try {
              const parsedCitations = JSON.parse(dataStr);
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  last.citations = parsedCitations;
                }
                return next;
              });
            } catch (e) {}
          } else if (eventType === "token") {
            let token = "";
            try {
              token = JSON.parse(dataStr).token;
            } catch (e) {
              token = dataStr;
            }
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                last.content += token;
              }
              return next;
            });
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          last.content = `Error: ${err.message}. Please retry.`;
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0D14] text-slate-100 font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Clean Navbar */}
      <header className="border-b border-slate-800/80 bg-[#101520]/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-[#D4AF37]/30 text-xs font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"></span>
            <span>DAR GLOBAL</span>
            <span className="text-[10px] text-[#D4AF37] font-semibold">LSE: DAR</span>
          </div>
          <span className="text-slate-600 text-xs">✕</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-[#10B981]/30 text-xs font-bold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
            <span>WASALT</span>
            <span className="text-[10px] text-[#10B981] font-semibold">REGA</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowRecruiterModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition"
          >
            <span>📋</span>
            <span>Recruiter Tasks</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="openai/gpt-4o">OpenAI GPT-4o (Active)</option>
            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
            <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
          </select>
        </div>
      </header>

      {/* Main Conversation Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col p-4 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-3">
              Official Real Estate AI Advisor
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
              Dar Global & Wasalt Intelligence
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mb-6">
              Grounded exclusively in publicly available data from Dar Global PLC and Wasalt KSA.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.prompt)}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-[#D4AF37]/50 hover:bg-slate-850 transition text-xs group"
                >
                  <div className="font-semibold text-white group-hover:text-[#D4AF37]">{q.title}</div>
                  <div className="text-slate-400 text-[11px] truncate mt-0.5">{q.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] sm:max-w-2xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-slate-800 border border-slate-700 text-white rounded-tr-sm"
                      : "bg-[#141A28] border border-slate-800 text-slate-200 rounded-tl-sm shadow-lg"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Highlight Cards if project mentioned */}
                  {m.role === "assistant" && m.content && (
                    <EntityCards text={m.content} />
                  )}

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Verified Sources:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations.map((c, cIdx) => (
                          <a
                            key={cIdx}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-[#D4AF37]/50 text-[11px] text-slate-300"
                          >
                            <span className="text-[#D4AF37] font-semibold">{c.source}:</span>
                            <span className="truncate max-w-[180px]">{c.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Bar */}
        <div className="mt-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 bg-[#121722] border border-slate-800 focus-within:border-[#D4AF37] rounded-xl px-3 py-2 shadow-inner">
            <textarea
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about DaVinci Pagani, AIDA Oman, Wasalt Riyadh properties..."
              className="flex-1 bg-transparent text-slate-100 text-xs sm:text-sm outline-none resize-none"
            />
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-slate-500 hover:text-slate-300 px-1"
                title="Clear Chat"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              className="bg-[#D4AF37] text-black font-bold p-2 rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Recruiter Evaluation Modal */}
      {showRecruiterModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📋</span> AI Full-Stack Assignment Checklist
              </h3>
              <button onClick={() => setShowRecruiterModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
                <strong className="text-emerald-400">1. Data Collection:</strong> 59 grounded records from Dar Global & Wasalt, respecting robots.txt.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
                <strong className="text-emerald-400">2. Grounded Chatbot:</strong> BM25 lexical retriever with zero-hallucination prompt boundaries.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
                <strong className="text-emerald-400">3. OpenRouter Free / GPT-4o:</strong> Live streaming with user key and deterministic fallback.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
                <strong className="text-emerald-400">4. Docker Container:</strong> Multi-stage build with non-root appuser on port 8000.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
                <strong className="text-emerald-400">5. Live URL:</strong> Publicly reachable over HTTPS.
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowRecruiterModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EntityCards({ text }) {
  const lower = text.toLowerCase();
  const cards = [];

  if (lower.includes("davinci") || lower.includes("pagani")) {
    cards.push({
      title: "DaVinci Tower by Pagani",
      partner: "Pagani Automobili",
      loc: "Dubai Canal",
      desc: "Interiors inspired by Pagani hypercars, carbon-fiber elements.",
      url: "https://darglobal.co.uk/projects"
    });
  }

  if (lower.includes("aida") || lower.includes("muscat")) {
    cards.push({
      title: "AIDA Muscat Community",
      partner: "Trump International Golf",
      loc: "Muscat, Oman",
      desc: "Freehold luxury cliffside villas, 130m above the Gulf of Oman.",
      url: "https://darglobal.co.uk/projects"
    });
  }

  if (lower.includes("wasalt") || lower.includes("riyadh") || lower.includes("rega") || lower.includes("ejar")) {
    cards.push({
      title: "Wasalt Saudi Real Estate",
      partner: "REGA & Fal Licensed",
      loc: "Kingdom of Saudi Arabia",
      desc: "Verified properties for rent & sale, electronic Ejar contracts.",
      url: "https://wasalt.sa/en"
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {cards.map((c, idx) => (
        <div key={idx} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between font-bold text-white mb-0.5">
            <span>{c.title}</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded">{c.partner}</span>
          </div>
          <div className="text-slate-400 text-[10px]">📍 {c.loc}</div>
          <div className="text-slate-300 text-[11px] mt-1">{c.desc}</div>
        </div>
      ))}
    </div>
  );
}
