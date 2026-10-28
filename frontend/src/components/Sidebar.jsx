import React from 'react';

export default function Sidebar({ sessions, currentId, onSelect, onNew, onDelete, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div
        className="relative w-72 max-w-[85vw] h-full bg-[#0D0D0D] border-r border-[#1E1E1E] flex flex-col sidebar-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-white tracking-wider uppercase">Chat History</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => { onNew(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#262626] text-xs font-semibold text-white transition"
          >
            <span>+</span>
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {sessions.slice().reverse().map((s) => {
            const isSelected = s.id === currentId;
            return (
              <div
                key={s.id}
                onClick={() => { onSelect(s.id); onClose(); }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                  isSelected
                    ? "bg-[#1C1C1C] text-white font-medium border border-neutral-700/50"
                    : "text-neutral-400 hover:bg-[#151515] hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-neutral-500 text-[11px]">💬</span>
                  <span className="truncate">{s.title || "Untitled Chat"}</span>
                </div>
                <button
                  type="button"
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
