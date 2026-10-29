import React, { useMemo } from 'react';

export default function Sidebar({
  sessions,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
  isOpen,
  onClose
}) {
  if (!isOpen) return null;

  // Filter only sessions that actually have conversation messages
  const activeSessions = useMemo(() => {
    return sessions.filter(s => s.messages && s.messages.length > 0);
  }, [sessions]);

  // Group sessions by date recency (Today, Yesterday, Previous 7 Days, Older)
  const groupedSessions = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: []
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - 6 * 86400000;

    // Latest first
    const sorted = [...activeSessions].sort((a, b) => (b.ts || 0) - (a.ts || 0));

    for (const s of sorted) {
      const ts = s.ts || Date.now();
      if (ts >= todayStart) {
        groups.today.push(s);
      } else if (ts >= yesterdayStart) {
        groups.yesterday.push(s);
      } else if (ts >= sevenDaysStart) {
        groups.previous7Days.push(s);
      } else {
        groups.older.push(s);
      }
    }

    return groups;
  }, [activeSessions]);

  const renderSessionItem = (s) => {
    const isSelected = s.id === currentId;
    const qCount = s.messages ? Math.ceil(s.messages.filter(m => m.role === "user").length) : 1;

    return (
      <div
        key={s.id}
        onClick={() => {
          onSelect(s.id);
          onClose();
        }}
        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs relative ${
          isSelected
            ? "bg-[#1C1C1C] text-white font-medium border border-neutral-700/70 shadow-sm"
            : "text-neutral-400 hover:bg-[#151515] hover:text-neutral-200 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
          <svg
            className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-blue-400" : "text-neutral-500 group-hover:text-neutral-300"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="truncate">{s.title || "Real Estate Consultation"}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-neutral-600 group-hover:hidden">
            {qCount} {qCount === 1 ? "query" : "queries"}
          </span>

          {/* Premium Red Trash Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(s.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/15 transition-all"
            title="Delete chat"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const sections = [
    { title: "Today", items: groupedSessions.today },
    { title: "Yesterday", items: groupedSessions.yesterday },
    { title: "Previous 7 Days", items: groupedSessions.previous7Days },
    { title: "Older", items: groupedSessions.older }
  ].filter(sec => sec.items.length > 0);

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div
        className="relative w-80 max-w-[85vw] h-full bg-[#0D0D0D] border-r border-[#1E1E1E] flex flex-col sidebar-enter shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
            <span className="text-xs font-bold text-white tracking-wider uppercase">Consultation History</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Chat Action */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onNew();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#262626] hover:border-neutral-700 text-xs font-semibold text-white transition shadow-sm"
          >
            <span className="text-sm font-bold text-blue-400">+</span>
            <span>New Consultation</span>
          </button>
        </div>

        {/* Scrollable History List grouped by Date */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {sections.length > 0 ? (
            sections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <div className="text-[10px] font-bold text-neutral-500 uppercase px-2 py-1 tracking-wider">
                  {sec.title}
                </div>
                {sec.items.map(renderSessionItem)}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <span className="text-2xl mb-2 text-neutral-600">💬</span>
              <p className="text-xs text-neutral-400 font-medium">No saved chats yet</p>
              <p className="text-[11px] text-neutral-600 mt-1">Ask questions about Dar Global or Wasalt properties to start.</p>
            </div>
          )}
        </div>

        {/* Footer with Clear All History */}
        <div className="p-3 border-t border-[#1E1E1E] bg-[#0A0A0A] flex items-center justify-between">
          {activeSessions.length > 0 && onClearAll ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete all chat history?")) {
                  onClearAll();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
              title="Clear all saved chats"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear all</span>
            </button>
          ) : (
            <span className="text-[10px] text-neutral-600">Dar Global & Wasalt</span>
          )}

          <span className="text-[10px] text-neutral-500">
            {activeSessions.length} {activeSessions.length === 1 ? "chat" : "chats"}
          </span>
        </div>
      </div>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
    </div>
  );
}
