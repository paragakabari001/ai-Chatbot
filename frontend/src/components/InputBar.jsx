import React from 'react';
import ModelPicker from './ModelPicker';

export default function InputBar({
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
        onChange={(e) => {
          setInput(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = Math.max(compact ? 48 : 72, Math.min(e.target.scrollHeight, 160)) + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
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
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition"
            title="New Chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Right: Model selector + Send/Stop Button */}
        <div className="flex items-center gap-2">
          <ModelPicker
            model={model}
            setModel={setModel}
            showModelPicker={showModelPicker}
            setShowModelPicker={setShowModelPicker}
            currentModelObj={currentModelObj}
            popoverRef={popoverRef}
          />

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
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
