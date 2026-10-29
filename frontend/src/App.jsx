import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SUPPORTED_MODELS } from './utils/models';
import {
  loadHistory,
  saveHistory,
  loadCurrentId,
  saveCurrentId,
  newSession
} from './utils/helpers';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import InputBar from './components/InputBar';
import ChatFeed from './components/ChatFeed';
import RecruiterModal from './components/RecruiterModal';

function formatSessionTitle(text) {
  if (!text) return "Real Estate Consultation";
  const clean = text.replace(/^[#*`_~\s]+/, "").trim();
  const title = clean.charAt(0).toUpperCase() + clean.slice(1);
  return title.length > 38 ? title.slice(0, 38).trim() + "…" : title;
}

export default function App() {
  // ── Session State ──────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState(() => {
    const h = loadHistory();
    // Keep sessions with actual messages or initialize with 1 clean session
    const valid = (h || []).filter(s => s.messages && s.messages.length > 0);
    if (valid.length > 0) return valid;
    const initial = newSession();
    return [initial];
  });

  const [currentId, setCurrentId] = useState(() => {
    const savedId = loadCurrentId();
    const h = loadHistory();
    if (savedId && h.some(s => s.id === savedId)) return savedId;
    if (h && h.length > 0) return h[0].id;
    return null;
  });

  // Ensure currentId is initialized if null
  useEffect(() => {
    if (!currentId && sessions.length > 0) {
      const id = sessions[0].id;
      setCurrentId(id);
      saveCurrentId(id);
    } else if (currentId) {
      saveCurrentId(currentId);
    }
  }, [currentId, sessions]);

  // Persist sessions to localStorage
  useEffect(() => {
    saveHistory(sessions);
  }, [sessions]);

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === currentId) || sessions[0] || null;
  }, [sessions, currentId]);

  const messages = currentSession?.messages || [];

  // ── Chat & UI State ────────────────────────────────────────────────────────
  const [input, setInput]                             = useState("");
  const [isStreaming, setIsStreaming]                  = useState(false);
  const [model, setModel]                             = useState("openai/gpt-4o");
  const [showModelPicker, setShowModelPicker]         = useState(false);
  const [showRecruiterModal, setShowRecruiterModal]   = useState(false);
  const [sidebarOpen, setSidebarOpen]                 = useState(false);
  const [, setCitationsLoading]                        = useState(false);
  const [speakingMsgId, setSpeakingMsgId]             = useState(null);

  // User message inline edit
  const [editingIdx, setEditingIdx]                   = useState(null);
  const [editInput, setEditInput]                     = useState("");

  // Smart Auto-Scroll
  const chatContainerRef   = useRef(null);
  const isUserAtBottomRef  = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const chatInputRef       = useRef(null);
  const popoverRef         = useRef(null);
  const abortControllerRef = useRef(null);

  const currentModelObj = useMemo(() => {
    return SUPPORTED_MODELS.find(m => m.id === model) || SUPPORTED_MODELS[0];
  }, [model]);

  // Dismiss model popover on outside click
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

  // Smart auto-scroll logic
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

  useEffect(() => {
    if (isUserAtBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages, isStreaming, scrollToBottom]);

  const updateSession = (sessId, updater) => {
    setSessions(prev => {
      const exists = prev.some(s => s.id === sessId);
      if (!exists) {
        const base = { id: sessId, title: "New Chat", messages: [], ts: Date.now() };
        const updated = typeof updater === "function" ? updater(base) : { ...base, ...updater };
        return [updated, ...prev];
      }
      return prev.map(s => {
        if (s.id !== sessId) return s;
        return typeof updater === "function" ? updater(s) : { ...s, ...updater };
      });
    });
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

  // ── New Chat Creation ──────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setIsStreaming(false);
    setCitationsLoading(false);
    setEditingIdx(null);
    setInput("");
    setSidebarOpen(false);

    const fresh = newSession();
    setSessions(prev => [fresh, ...prev.filter(s => s.messages && s.messages.length > 0)]);
    setCurrentId(fresh.id);
    saveCurrentId(fresh.id);
  }, []);

  // ── Select Chat Session ────────────────────────────────────────────────────
  const handleSelectSession = useCallback((id) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setIsStreaming(false);
    setCitationsLoading(false);
    setEditingIdx(null);
    setInput("");
    setCurrentId(id);
    saveCurrentId(id);
    isUserAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(false), 50);
  }, [scrollToBottom]);

  // ── Delete Chat Session ────────────────────────────────────────────────────
  const handleDeleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = newSession();
        setCurrentId(fresh.id);
        saveCurrentId(fresh.id);
        return [fresh];
      }
      if (id === currentId) {
        const fallback = next[0].id;
        setCurrentId(fallback);
        saveCurrentId(fallback);
      }
      return next;
    });
  }, [currentId]);

  // ── Clear All History ──────────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setIsStreaming(false);
    setCitationsLoading(false);
    setEditingIdx(null);
    setInput("");

    const fresh = newSession();
    setSessions([fresh]);
    setCurrentId(fresh.id);
    saveCurrentId(fresh.id);
    saveHistory([fresh]);
  }, []);

  // ── Stop Streaming Immediately ─────────────────────────────────────────────
  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCitationsLoading(false);
  }, []);

  // ── Speech Synthesis Toggle ────────────────────────────────────────────────
  const toggleSpeech = useCallback((msgId, fullText) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (speakingMsgId === msgId) {
      synth.cancel();
      setSpeakingMsgId(null);
      return;
    }

    synth.cancel();
    const plain = (fullText || "").replace(/[*_#`~]+/g, "").trim();
    const utt = new SpeechSynthesisUtterance(plain);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => setSpeakingMsgId(null);
    utt.onerror = () => setSpeakingMsgId(null);
    synth.speak(utt);
    setSpeakingMsgId(msgId);
  }, [speakingMsgId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    let targetSessionId = currentId;
    if (!targetSessionId || !sessions.some(s => s.id === targetSessionId)) {
      const fresh = newSession();
      targetSessionId = fresh.id;
      setCurrentId(fresh.id);
      saveCurrentId(fresh.id);
      setSessions(prev => [fresh, ...prev]);
    }

    const msgId = Date.now();
    const userMsg = { role: "user", content: query };
    const assistMsg = {
      role: "assistant",
      content: "",
      citations: [],
      id: msgId,
      citLoading: true,
      isError: false
    };

    setSessions(prev => {
      const exists = prev.some(s => s.id === targetSessionId);
      if (!exists) {
        return [{
          id: targetSessionId,
          title: formatSessionTitle(query),
          messages: [userMsg, assistMsg],
          ts: Date.now()
        }, ...prev];
      }
      return prev.map(s => {
        if (s.id !== targetSessionId) return s;
        const isNewTitle = !s.messages || s.messages.length === 0 || s.title === "New Chat" || s.title === "Untitled Chat";
        return {
          ...s,
          title: isNewTitle ? formatSessionTitle(query) : s.title,
          messages: [...(s.messages || []), userMsg, assistMsg],
          ts: s.ts || Date.now()
        };
      });
    });

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

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedContent = "";
      let currentEvent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            currentEvent = "";
            continue;
          }
          if (trimmedLine.startsWith("event: ")) {
            currentEvent = trimmedLine.slice(7).trim();
            continue;
          }
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6).trim();
            if (dataStr === "[DONE]") {
              continue;
            }

            if (currentEvent === "citations") {
              try {
                const cits = JSON.parse(dataStr);
                setSessions(prev => prev.map(s => {
                  if (s.id !== targetSessionId) return s;
                  return {
                    ...s,
                    messages: (s.messages || []).map(m =>
                      m.id === msgId ? { ...m, citations: cits, citLoading: false } : m
                    )
                  };
                }));
                setCitationsLoading(false);
              } catch (e) {}
            } else {
              let tokenText = "";
              try {
                const parsed = JSON.parse(dataStr);
                tokenText = parsed.token || "";
              } catch {
                tokenText = dataStr;
              }

              if (tokenText) {
                accumulatedContent += tokenText;
                setSessions(prev => prev.map(s => {
                  if (s.id !== targetSessionId) return s;
                  return {
                    ...s,
                    messages: (s.messages || []).map(m =>
                      m.id === msgId ? { ...m, content: accumulatedContent } : m
                    )
                  };
                }));
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      setSessions(prev => prev.map(s => {
        if (s.id !== targetSessionId) return s;
        return {
          ...s,
          messages: (s.messages || []).map(m =>
            m.id === msgId ? {
              ...m,
              isError: true,
              failedQuery: query,
              content: "Network or API rate-limit error. Click retry to re-dispatch query.",
              citLoading: false
            } : m
          )
        };
      }));
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
      setCitationsLoading(false);
      setSessions(prev => prev.map(s => {
        if (s.id !== targetSessionId) return s;
        return {
          ...s,
          messages: (s.messages || []).map(m =>
            m.id === msgId ? { ...m, citLoading: false } : m
          )
        };
      }));
    }
  };

  // ── Retry Failed Assistant Message ─────────────────────────────────────────
  const handleRetry = (failedQuery, errorMsgIdx) => {
    if (!failedQuery || isStreaming) return;
    updateSession(currentId, s => {
      const msgs = (s.messages || []).filter((_, i) => i !== errorMsgIdx && i !== errorMsgIdx - 1);
      return { messages: msgs };
    });
    handleSend(failedQuery);
  };

  // ── Edit & Resubmit Previous User Message ──────────────────────────────────
  const handleStartEdit = (idx, text) => {
    setEditingIdx(idx);
    setEditInput(text);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditInput("");
  };

  const handleSaveEdit = (idx) => {
    const newQuery = editInput.trim();
    if (!newQuery || isStreaming) return;
    setEditingIdx(null);
    setEditInput("");
    updateSession(currentId, s => ({
      messages: (s.messages || []).slice(0, idx)
    }));
    handleSend(newQuery);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden">
      {/* History Sidebar Drawer */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={handleSelectSession}
        onNew={handleNewChat}
        onDelete={handleDeleteSession}
        onClearAll={handleClearAll}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Top Header */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenRecruiterModal={() => setShowRecruiterModal(true)}
      />

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-3 sm:px-4 overflow-hidden relative">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 pb-16 sm:pb-20">
            <div className="mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              What should we explore?
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mb-6 sm:mb-8">
              Dar Global luxury real estate · Wasalt Saudi properties
            </p>

            <div className="w-full max-w-2xl mb-5 sm:mb-6">
              <InputBar
                compact={false}
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
            </div>

            {/* Readymade Quick Prompts */}
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
          /* Active Chat Feed */
          <ChatFeed
            messages={messages}
            isStreaming={isStreaming}
            speakingMsgId={speakingMsgId}
            currentModelObj={currentModelObj}
            onToggleSpeech={toggleSpeech}
            onRetry={handleRetry}
            editingIdx={editingIdx}
            editInput={editInput}
            setEditInput={setEditInput}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            chatContainerRef={chatContainerRef}
            onScroll={handleScroll}
            showScrollBottom={showScrollBottom}
            onScrollToBottom={() => scrollToBottom(true)}
          />
        )}

        {/* Floating Input Bar with background gradient fade (prevents text overlap) */}
        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-2 sm:px-3 pb-3 sm:pb-4 pt-8 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent pointer-events-none">
            <div className="pointer-events-auto max-w-3xl mx-auto">
              <InputBar
                compact={true}
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
            </div>
          </div>
        )}
      </main>

      {/* Recruiter Assignment Verification Modal */}
      <RecruiterModal
        isOpen={showRecruiterModal}
        onClose={() => setShowRecruiterModal(false)}
      />
    </div>
  );
}
