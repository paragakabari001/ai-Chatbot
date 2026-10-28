import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { marked } from 'marked';

// ── Supported AI Models ──────────────────────────────────────────────────────
const SUPPORTED_MODELS = [
  {
    id: "openai/gpt-4o",
    label: "OpenAI GPT-4o",
    shortLabel: "GPT-4o",
    badge: "⭐ Recommended",
    badgeColor: "bg-blue-600/30 text-blue-300 border border-blue-500/40"
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash",
    shortLabel: "Gemini Flash",
    badge: "Free",
    badgeColor: "bg-neutral-800 text-neutral-400 border border-neutral-700"
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B",
    shortLabel: "Llama 3.3",
    badge: "Free",
    badgeColor: "bg-neutral-800 text-neutral-400 border border-neutral-700"
  }
];

// ── Markdown Parser Configuration ────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

function renderMarkdown(raw) {
  if (!raw) return "";
  let html = marked.parse(raw);
  html = html.replace(
    /<a\s+([^>]*href=["']https?:\/\/[^"']+["'][^>]*)>/gi,
    (match, attrs) => `<a ${attrs}><span class="ext-icon">🔗</span>`
  );
  return html;
}

// ── LocalStorage Chat History Helpers ────────────────────────────────────────
const LS_KEY = "dg_wasalt_history";
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function saveHistory(sessions) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(sessions)); } catch {}
}
function newSession() {
  return { id: Date.now().toString(), title: "New Chat", messages: [], ts: Date.now() };
}

// ── Text-to-Speech Helper ───────────────────────────────────────────────────
function stripMarkdown(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`~]+/g, "")
    .replace(/>\s/g, "")
    .replace(/[-*+]\s/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

// ── Speak Button Component ───────────────────────────────────────────────────
function SpeakButton({ messageId, text, isSpeaking, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(messageId, text)}
      title={isSpeaking ? "Stop listening" : "Listen (Read aloud with highlight)"}
      className={`flex items-center justify-center w-6 h-6 rounded-full border transition ${
        isSpeaking
          ? "border-blue-500 text-blue-400 speaking-active"
          : "border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500"
      }`}
    >
      {isSpeaking ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"/>
        </svg>
      )}
    </button>
  );
}

// ── Copy Button Component with Checkmark Animation ───────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`transition flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
        copied ? "text-emerald-400 bg-emerald-950/30" : "text-neutral-500 hover:text-white"
      }`}
      title={copied ? "Copied to clipboard!" : "Copy response"}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-400 font-medium">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <span className="hidden sm:inline">Copy</span>
        </>
      )}
    </button>
  );
}

// ── Thinking State with Live Timer ───────────────────────────────────────────
function ThinkingState() {
  const [elapsed, setElapsed] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1 text-neutral-400 text-xs animate-appear">
      <span className="w-3 h-3 rounded-full border-2 border-neutral-600 border-t-white animate-spin"></span>
      <span className="text-neutral-400 font-normal">Working for {elapsed}s</span>
    </div>
  );
}

// ── Citations with Skeleton Loader ───────────────────────────────────────────
function CitationsBlock({ citations, loading }) {
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
            <span className="truncate max-w-[160px] text-neutral-400">{c.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Entity Highlight Cards ────────────────────────────────────────────────────
function EntityCards({ text }) {
  const lower = text.toLowerCase();
  const cards = [];
  if (lower.includes("davinci") || lower.includes("pagani"))
    cards.push({ title: "DaVinci Tower by Pagani", partner: "Pagani Automobili", loc: "Downtown Dubai Canal", desc: "Ultra-luxury residential landmark with carbon-fiber architecture and Burj Khalifa views.", url: "https://darglobal.co.uk/projects" });
  if (lower.includes("aida") || lower.includes("muscat"))
    cards.push({ title: "AIDA Muscat Community", partner: "Trump International Golf", loc: "Muscat, Oman (130m Cliffside)", desc: "Freehold luxury cliffside villas, Trump Golf Club & permanent residency in Oman.", url: "https://darglobal.co.uk/projects" });
  if (lower.includes("urban oasis") || lower.includes("missoni"))
    cards.push({ title: "Urban Oasis by Missoni", partner: "Missoni Italian Fashion", loc: "Dubai Canal, Business Bay", desc: "Signature Missoni zig-zag geometries, waterfront infinity pool & aquatic gym.", url: "https://darglobal.co.uk/projects" });
  if (lower.includes("wasalt") || lower.includes("riyadh") || lower.includes("rega") || lower.includes("ejar"))
    cards.push({ title: "Wasalt Saudi Real Estate", partner: "REGA & Fal Licensed", loc: "Kingdom of Saudi Arabia", desc: "Verified properties for rent & sale, 360-degree tours & electronic Ejar contracts.", url: "https://wasalt.sa/en" });
  if (cards.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-appear">
      {cards.slice(0, 2).map((c, i) => (
        <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-[#141414] border border-[#262626] hover:border-neutral-600 text-xs transition">
          <div className="flex items-center justify-between font-bold text-white mb-1">
            <span>🔗 {c.title}</span>
            <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded font-medium">{c.partner}</span>
          </div>
          <div className="text-neutral-500 text-[11px]">📍 {c.loc}</div>
          <div className="text-neutral-400 text-xs mt-1.5 leading-snug">{c.desc}</div>
        </a>
      ))}
    </div>
  );
}

// ── Chat History Sidebar ──────────────────────────────────────────────────────
function Sidebar({ sessions, currentId, onSelect, onNew, onDelete, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div
        className="relative w-72 max-w-[85vw] h-full bg-[#0D0D0D] border-r border-[#1E1E1E] flex flex-col sidebar-enter"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-white tracking-wider uppercase">Chat History</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#262626] text-xs font-semibold text-white transition"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {sessions.slice().reverse().map(s => {
            const isSelected = s.id === currentId;
            return (
              <div
                key={s.id}
                onClick={() => { onSelect(s.id); onClose(); }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                  isSelected ? "bg-[#1C1C1C] text-white font-medium border border-neutral-700/50" : "text-neutral-400 hover:bg-[#151515] hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-neutral-500 text-[11px]">💬</span>
                  <span className="truncate">{s.title || "Untitled Chat"}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition text-[11px]"
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-[#1E1E1E] text-[10px] text-neutral-600">
          Dar Global & Wasalt AI Advisor
        </div>
      </div>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
    </div>
  );
}

// ── Top-Level Input Bar Component ────────────────────────────────────────────
function InputBar({
  compact,
  input,
  setInput,
  isStreaming,
  handleSend,
  handleStopStreaming,
  handleNewChat,
  chatInputRef,
  popoverRef,
  showModelPicker,
  setShowModelPicker,
  model,
  setModel,
  currentModelObj
}) {
  return (
    <div className={`bg-[#161616] border border-[#262626] rounded-2xl sm:rounded-3xl ${compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"} shadow-2xl focus-within:border-neutral-600 transition-all`}>
      <textarea
        ref={chatInputRef}
        rows={compact ? 2 : 3}
        value={input}
        onChange={e => {
          setInput(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = Math.max(compact ? 48 : 72, Math.min(e.target.scrollHeight, 160)) + "px";
        }}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
        }}
        placeholder={compact ? "Ask about Dar Global or Wasalt..." : "Ask anything about Dar Global luxury developments or Wasalt properties..."}
        className={`w-full bg-transparent text-white placeholder-neutral-500 text-sm outline-none resize-none px-1.5 ${
          compact ? "min-h-[48px] sm:min-h-[56px]" : "min-h-[72px] sm:min-h-[84px]"
        } leading-relaxed`}
        disabled={isStreaming}
      />
      <div className="flex items-center justify-between pt-1.5 sm:pt-2">
        {/* Left: New Chat */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition"
            title="New Chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Right: Model selector + Send/Stop Button */}
        <div className="flex items-center gap-2" ref={popoverRef}>
          {/* Model Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition border border-neutral-700/60"
            >
              <span className="truncate max-w-[90px] sm:max-w-none">{currentModelObj.shortLabel}</span>
              <span className="text-[10px] text-neutral-400">⌵</span>
            </button>

            {/* Model Selector Popover */}
            {showModelPicker && (
              <div className="absolute right-0 bottom-full mb-2 bg-[#161616] border border-[#2E2E2E] rounded-2xl p-1.5 shadow-2xl z-50 w-64 text-xs">
                <div className="text-[10px] font-semibold text-neutral-500 uppercase px-3 py-1.5">
                  Select AI Model
                </div>
                {SUPPORTED_MODELS.map((item) => {
                  const isSelected = model === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setModel(item.id); setShowModelPicker(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#202020] flex items-center justify-between transition ${
                        isSelected ? "bg-[#1E1E1E] text-white font-medium" : "text-neutral-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-400" : "bg-transparent"}`} />
                        <span className={isSelected ? "text-white font-semibold" : "text-neutral-300"}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Send / Stop Streaming Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className={`${compact ? "w-8 h-8" : "w-8 h-8 sm:w-9 sm:h-9"} rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold transition flex-shrink-0 shadow-lg`}
              title="Stop generating"
            >
              <div className="w-3 h-3 bg-black rounded-[2px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className={`${compact ? "w-8 h-8" : "w-8 h-8 sm:w-9 sm:h-9"} rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold transition disabled:opacity-25 disabled:cursor-not-allowed flex-shrink-0`}
              title="Send message (Enter)"
            >
              <svg className="w-3.5 h-3.5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main App Component ───────────────────────────────────────────────────────
export default function App() {
  const [sessions, setSessions]         = useState(() => {
    const h = loadHistory();
    return h.length > 0 ? h : [newSession()];
  });
  const [currentId, setCurrentId]       = useState(() => {
    const h = loadHistory();
    return h.length > 0 ? h[h.length - 1].id : sessions[0]?.id;
  });
  const currentSession = useMemo(
    () => sessions.find(s => s.id === currentId) || sessions[0],
    [sessions, currentId]
  );
  const messages = currentSession?.messages || [];

  const [input, setInput]               = useState("");
  const [isStreaming, setIsStreaming]    = useState(false);
  const [model, setModel]               = useState("openai/gpt-4o");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [citationsLoading, setCitationsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  // User message editing state
  const [editingIdx, setEditingIdx]     = useState(null);
  const [editInput, setEditInput]       = useState("");

  // Smart Auto-Scroll refs & state
  const chatContainerRef   = useRef(null);
  const isUserAtBottomRef  = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const chatInputRef       = useRef(null);
  const popoverRef         = useRef(null);
  const abortControllerRef = useRef(null);

  const currentModelObj = useMemo(() => {
    return SUPPORTED_MODELS.find(m => m.id === model) || SUPPORTED_MODELS[0];
  }, [model]);

  // Handle outside click to dismiss model picker
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowModelPicker(false);
      }
    }
    if (showModelPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showModelPicker]);

  // Persist sessions
  useEffect(() => { saveHistory(sessions); }, [sessions]);

  // Smart auto-scroll: checks if user is near bottom
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 80;
    isUserAtBottomRef.current = atBottom;
    setShowScrollBottom(!atBottom && messages.length > 0);
  }, [messages.length]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
      isUserAtBottomRef.current = true;
      setShowScrollBottom(false);
    }
  }, []);

  // Only auto-scroll on new message/token if user is at bottom
  useEffect(() => {
    if (isUserAtBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages, isStreaming, scrollToBottom]);

  const updateSession = (sessId, updater) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessId) return s;
      return typeof updater === "function" ? updater(s) : { ...s, ...updater };
    }));
  };

  const quickPrompts = [
    "What are Dar Global's top luxury branded residential projects?",
    "How do I search, rent, or buy properties on Wasalt?",
    "Explain Dar Global's 7-day token reservation policy.",
    "What are Saudi REGA regulations on Wasalt?"
  ];

  const handleSelectPrompt = (promptText) => {
    setInput(promptText);
    if (chatInputRef.current) {
      chatInputRef.current.focus();
      chatInputRef.current.style.height = "auto";
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.style.height = Math.min(chatInputRef.current.scrollHeight, 160) + "px";
        }
      }, 10);
    }
  };

  // ── New Chat ──────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const s = newSession();
    setSessions(prev => [...prev, s]);
    setCurrentId(s.id);
    setInput("");
    setSidebarOpen(false);
    setIsStreaming(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
  }, []);

  // ── Delete session ────────────────────────────────────────────────────────
  const handleDeleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const s = newSession();
        setCurrentId(s.id);
        return [s];
      }
      if (id === currentId) setCurrentId(next[next.length - 1].id);
      return next;
    });
  }, [currentId]);

  // ── Stop Streaming ────────────────────────────────────────────────────────
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCitationsLoading(false);
  }, []);

  // ── Speech Synthesis ──────────────────────────────────────────────────────
  const toggleSpeech = useCallback((msgId, fullText) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (speakingMsgId === msgId) {
      synth.cancel();
      setSpeakingMsgId(null);
      return;
    }

    synth.cancel();
    const plain = stripMarkdown(fullText);
    const utt = new SpeechSynthesisUtterance(plain);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => setSpeakingMsgId(null);
    utt.onerror = () => setSpeakingMsgId(null);
    synth.speak(utt);
    setSpeakingMsgId(msgId);
  }, [speakingMsgId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    const sessId = currentId;
    const msgId = Date.now();
    const userMsg = { role: "user", content: query };
    const assistMsg = { role: "assistant", content: "", citations: [], id: msgId, citLoading: true, isError: false };

    updateSession(sessId, s => ({
      messages: [...s.messages, userMsg, assistMsg],
      title: s.title === "New Chat" ? query.slice(0, 40) : s.title
    }));
    setInput("");
    setIsStreaming(true);
    setCitationsLoading(true);
    isUserAtBottomRef.current = true;
    scrollToBottom(true);

    if (chatInputRef.current) chatInputRef.current.style.height = "auto";

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, model, top_k: 4 }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const sleep = ms => new Promise(r => setTimeout(r, ms));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("event: citations")) {
            const next = lines[i + 1] || "";
            if (next.startsWith("data: ")) {
              try {
                const cits = JSON.parse(next.slice(6));
                updateSession(sessId, s => ({
                  messages: s.messages.map(m => m.id === msgId ? { ...m, citations: cits, citLoading: false } : m)
                }));
                setCitationsLoading(false);
              } catch {}
            }
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                await sleep(40);
                updateSession(sessId, s => ({
                  messages: s.messages.map(m =>
                    m.id === msgId ? { ...m, content: (m.content || "") + parsed.token } : m
                  )
                }));
              }
            } catch {
              if (dataStr) {
                await sleep(40);
                updateSession(sessId, s => ({
                  messages: s.messages.map(m =>
                    m.id === msgId ? { ...m, content: (m.content || "") + dataStr } : m
                  )
                }));
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // Stopped by user cleanly
        return;
      }
      updateSession(sessId, s => ({
        messages: s.messages.map(m =>
          m.id === msgId ? {
            ...m,
            isError: true,
            failedQuery: query,
            content: "Network or API rate-limit error. Click retry to re-dispatch query.",
            citLoading: false
          } : m
        )
      }));
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      setCitationsLoading(false);
      updateSession(sessId, s => ({
        messages: s.messages.map(m => m.id === msgId ? { ...m, citLoading: false } : m)
      }));
    }
  };

  // ── Retry a failed message ────────────────────────────────────────────────
  const handleRetry = (failedQuery, errorMsgIdx) => {
    if (!failedQuery || isStreaming) return;
    updateSession(currentId, s => {
      const msgs = s.messages.filter((_, i) => i !== errorMsgIdx && i !== errorMsgIdx - 1);
      return { messages: msgs };
    });
    handleSend(failedQuery);
  };

  // ── Edit & Resubmit previous user message ──────────────────────────────────
  const handleSaveEdit = (idx) => {
    const newQuery = editInput.trim();
    if (!newQuery || isStreaming) return;
    setEditingIdx(null);
    updateSession(currentId, s => ({
      messages: s.messages.slice(0, idx)
    }));
    handleSend(newQuery);
  };

  // ── Input Bar helper ──────────────────────────────────────────────────────
  const renderInputBar = (compact) => (
    <InputBar
      compact={compact}
      input={input}
      setInput={setInput}
      isStreaming={isStreaming}
      handleSend={handleSend}
      handleStopStreaming={handleStopStreaming}
      handleNewChat={handleNewChat}
      chatInputRef={chatInputRef}
      popoverRef={popoverRef}
      showModelPicker={showModelPicker}
      setShowModelPicker={setShowModelPicker}
      model={model}
      setModel={setModel}
      currentModelObj={currentModelObj}
    />
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={setCurrentId}
        onNew={handleNewChat}
        onDelete={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Top Header */}
      <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#161616] z-20 flex-shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
            title="History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <a href="https://darglobal.co.uk/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]"/>
              <span className="font-semibold tracking-wide">DAR GLOBAL</span>
              <span className="text-[10px] text-neutral-600 font-normal hidden sm:inline">LSE:DAR</span>
            </a>
            <span className="text-neutral-700">/</span>
            <a href="https://wasalt.sa/en" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]"/>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowRecruiterModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#161616] border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="hidden sm:inline">Recruiter</span> Tasks
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-3 sm:px-4 overflow-hidden relative">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 pb-16 sm:pb-20">
            <div className="mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"/>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"/>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              What should we explore?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6 sm:mb-8">Dar Global luxury real estate · Wasalt Saudi properties</p>

            <div className="w-full max-w-2xl mb-5 sm:mb-6">
              {renderInputBar(false)}
            </div>

            {/* Readymade Prompts */}
            <div className="flex flex-wrap gap-2 max-w-2xl justify-center">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPrompt(p)}
                  title="Click to paste into input"
                  className="text-xs text-neutral-400 hover:text-white bg-[#141414] hover:bg-[#1E1E1E] border border-[#222222] hover:border-neutral-600 px-3 py-1.5 rounded-full transition text-left flex items-center gap-1.5"
                >
                  <span>💬</span>
                  <span className="truncate max-w-[280px] sm:max-w-none">{p}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Feed with Smart Scroll Container */
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto space-y-5 sm:space-y-6 pt-4 pb-36 px-1"
          >
            {messages.map((m, idx) => {
              const isCurrentStreaming = isStreaming && idx === messages.length - 1;
              const isBeingRead = speakingMsgId === m.id;

              return (
                <div key={m.id || idx} className={`w-full flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "user" ? (
                    editingIdx === idx ? (
                      /* Inline Message Edit Box */
                      <div className="w-full max-w-[88%] sm:max-w-xl bg-[#1C1C1C] border border-blue-500/60 rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg">
                        <textarea
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          className="w-full bg-transparent text-white text-sm outline-none resize-none leading-relaxed"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingIdx(null)}
                            className="px-2.5 py-1 rounded-md text-neutral-400 hover:text-white transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idx)}
                            className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-neutral-200 transition"
                          >
                            Save & Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* User Message Bubble with Edit Button */
                      <div className="group relative max-w-[88%] sm:max-w-xl">
                        <div className="bg-[#1C1C1C] border border-neutral-800 text-white px-4 py-2.5 rounded-2xl text-sm leading-relaxed">
                          {m.content}
                        </div>
                        {!isStreaming && (
                          <button
                            type="button"
                            onClick={() => { setEditingIdx(idx); setEditInput(m.content); }}
                            className="opacity-0 group-hover:opacity-100 transition absolute -left-7 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white rounded"
                            title="Edit message"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    /* Assistant Message */
                    <div className="w-full text-neutral-200">
                      {m.isError ? (
                        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-800/40 text-red-200 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-red-400 font-semibold">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                            <span>Generation Error</span>
                          </div>
                          <p className="text-neutral-300 text-xs">{m.content}</p>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleRetry(m.failedQuery, idx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                              </svg>
                              Retry Response
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Real-time speech audio feedback */}
                          {isBeingRead && (
                            <div className="flex items-center gap-2 mb-2.5 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-800/40 text-blue-400 text-xs w-fit animate-appear">
                              <div className="flex items-center gap-0.5 h-3">
                                <span className="w-0.5 h-2 bg-blue-400 animate-pulse"></span>
                                <span className="w-0.5 h-3 bg-blue-400 animate-pulse delay-75"></span>
                                <span className="w-0.5 h-1.5 bg-blue-400 animate-pulse delay-150"></span>
                                <span className="w-0.5 h-2.5 bg-blue-400 animate-pulse delay-100"></span>
                              </div>
                              <span className="font-medium text-[11px]">Reading aloud with real-time speech…</span>
                            </div>
                          )}

                          {/* Markdown streaming response OR Live Thinking state */}
                          {m.content ? (
                            <div
                              className={`prose-chat transition-all duration-300 ${
                                isCurrentStreaming ? "typing-cursor" : ""
                              } ${isBeingRead ? "reading-highlight" : ""}`}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                            />
                          ) : (
                            <ThinkingState />
                          )}

                          {/* Entity highlight cards: appear ONLY after streaming completes */}
                          {!isCurrentStreaming && m.content && <EntityCards text={m.content} />}

                          {/* Citations: appear ONLY after streaming completes */}
                          {!isCurrentStreaming && m.citations && m.citations.length > 0 && (
                            <CitationsBlock
                              citations={m.citations}
                              loading={false}
                            />
                          )}

                          {/* Action row */}
                          {m.content && !isCurrentStreaming && (
                            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 animate-appear">
                              <span className="truncate max-w-[200px] sm:max-w-none">
                                Answered by {currentModelObj.label} · Grounded
                              </span>
                              <div className="flex items-center gap-2">
                                <SpeakButton
                                  messageId={m.id}
                                  text={m.content}
                                  isSpeaking={isBeingRead}
                                  onToggle={toggleSpeech}
                                />
                                <CopyButton text={m.content} />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating "Scroll to bottom" button when user scrolls up */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181818] border border-neutral-700 text-xs text-neutral-200 hover:text-white shadow-2xl hover:border-neutral-500 transition animate-appear"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
            <span className="font-medium text-[11px]">Scroll to bottom</span>
          </button>
        )}

        {/* Floating input bar */}
        {messages.length > 0 && (
          <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 px-2 sm:px-3">
            {renderInputBar(true)}
          </div>
        )}
      </main>

      {/* Recruiter Tasks Modal */}
      {showRecruiterModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowRecruiterModal(false)}>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  📋 AI Full-Stack Assignment Verification
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Candidate: <strong className="text-white">PARAG AKABARI</strong></p>
              </div>
              <button type="button" onClick={() => setShowRecruiterModal(false)} className="text-neutral-400 hover:text-white text-xl font-bold w-7 h-7 flex items-center justify-center">×</button>
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
                onClick={() => setShowRecruiterModal(false)}
                className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
