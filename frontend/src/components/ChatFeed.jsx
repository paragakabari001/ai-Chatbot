import React from 'react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';

export default function ChatFeed({
  messages,
  isStreaming,
  speakingMsgId,
  currentModelObj,
  onToggleSpeech,
  onRetry,
  editingIdx,
  editInput,
  setEditInput,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  chatContainerRef,
  bottomAnchorRef,
  onScroll,
  showScrollBottom,
  onScrollToBottom
}) {
  return (
    <>
      <div
        ref={chatContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto space-y-5 sm:space-y-6 pt-4 pb-48 sm:pb-56 px-1"
      >
        {messages.map((m, idx) => {
          const isCurrentStreaming = isStreaming && idx === messages.length - 1;
          const isBeingRead = speakingMsgId === m.id;

          return (
            <div
              key={m.id || idx}
              className={`w-full flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "user" ? (
                <UserMessage
                  content={m.content}
                  index={idx}
                  isEditing={editingIdx === idx}
                  editInput={editInput}
                  setEditInput={setEditInput}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onSaveEdit={onSaveEdit}
                  isStreaming={isStreaming}
                />
              ) : (
                <AssistantMessage
                  message={m}
                  index={idx}
                  isCurrentStreaming={isCurrentStreaming}
                  isBeingRead={isBeingRead}
                  currentModelObj={currentModelObj}
                  onToggleSpeech={onToggleSpeech}
                  onRetry={onRetry}
                />
              )}
            </div>
          );
        })}

        {/* Dedicated bottom clearance anchor for 100% full scroll clearance */}
        <div ref={bottomAnchorRef} className="h-8 w-full pointer-events-none" />
      </div>

      {/* Scroll-to-bottom floating button (Image 4 style: circular button with down chevron above input) */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={onScrollToBottom}
          className="absolute right-4 sm:right-6 bottom-40 sm:bottom-44 z-30 w-8 h-8 rounded-full bg-[#1C1C1C] hover:bg-[#282828] border border-neutral-700/80 text-white shadow-xl flex items-center justify-center transition animate-appear"
          title="Scroll to latest message"
        >
          <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </>
  );
}
