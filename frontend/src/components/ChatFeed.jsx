import React, { useMemo } from 'react';
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
  latestTurnRef,
  bottomAnchorRef,
  onScroll,
  showScrollBottom,
  onScrollToBottom
}) {
  // Group conversation into turn pairs (User Query + Assistant Response)
  const turns = useMemo(() => {
    const list = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === "user") {
        const next = messages[i + 1];
        if (next && next.role === "assistant") {
          list.push({
            id: m.id || `turn_${i}`,
            userMsg: m,
            userIdx: i,
            assistMsg: next,
            assistIdx: i + 1
          });
          i++; // grouped with assistant
        } else {
          list.push({
            id: m.id || `turn_${i}`,
            userMsg: m,
            userIdx: i,
            assistMsg: null,
            assistIdx: null
          });
        }
      } else {
        list.push({
          id: m.id || `turn_${i}`,
          userMsg: null,
          userIdx: null,
          assistMsg: m,
          assistIdx: i
        });
      }
    }
    return list;
  }, [messages]);

  return (
    <>
      <div
        ref={chatContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto pt-4 pb-48 sm:pb-56 px-1 scroll-smooth"
      >
        {turns.map((turn, tIdx) => {
          const isLatestTurn = tIdx === turns.length - 1;
          const isCurrentStreaming = isStreaming && isLatestTurn;
          const isBeingRead = turn.assistMsg && speakingMsgId === turn.assistMsg.id;

          return (
            <div
              key={turn.id}
              ref={isLatestTurn ? latestTurnRef : null}
              className="w-full relative pb-4 sm:pb-6"
            >
              {/* Sticky User Message Header: stays pinned at top-0 as the response streams / scrolls */}
              {turn.userMsg && (
                <div className="sticky top-0 z-20 pt-2 pb-3 mb-2 flex justify-end bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent backdrop-blur-md">
                  <UserMessage
                    content={turn.userMsg.content}
                    index={turn.userIdx}
                    isEditing={editingIdx === turn.userIdx}
                    editInput={editInput}
                    setEditInput={setEditInput}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={onSaveEdit}
                    isStreaming={isStreaming}
                  />
                </div>
              )}

              {/* Assistant Response Body */}
              {turn.assistMsg && (
                <div className="w-full flex justify-start pl-0.5">
                  <AssistantMessage
                    message={turn.assistMsg}
                    index={turn.assistIdx}
                    isCurrentStreaming={isCurrentStreaming}
                    isBeingRead={isBeingRead}
                    currentModelObj={currentModelObj}
                    onToggleSpeech={onToggleSpeech}
                    onRetry={onRetry}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Dedicated bottom clearance anchor for 100% full scroll clearance */}
        <div ref={bottomAnchorRef} className="h-8 w-full pointer-events-none" />
      </div>

      {/* Scroll-to-bottom floating button */}
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
