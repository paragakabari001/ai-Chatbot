import React from 'react';
import { renderMarkdown } from '../utils/helpers';
import ThinkingState from './ThinkingState';
import EntityCards from './EntityCards';
import CitationsBlock from './CitationsBlock';
import SpeakButton from './SpeakButton';
import CopyButton from './CopyButton';

export default function AssistantMessage({
  message,
  index,
  isCurrentStreaming,
  isBeingRead,
  currentModelObj,
  onToggleSpeech,
  onRetry
}) {
  if (message.isError) {
    return (
      <div className="w-full text-neutral-200">
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-800/40 text-red-200 text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>Generation Error</span>
          </div>
          <p className="text-neutral-300 text-xs">{message.content}</p>
          <div>
            <button
              type="button"
              onClick={() => onRetry(message.failedQuery, index)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Retry Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-neutral-200">
      {/* Real-time speech audio pill */}
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

      {/* Markdown streaming response OR Live Working timer */}
      {message.content ? (
        <div
          className={`prose-chat transition-all duration-300 ${
            isCurrentStreaming ? "typing-cursor" : ""
          } ${isBeingRead ? "reading-highlight" : ""}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
      ) : (
        <ThinkingState />
      )}

      {/* Entity highlight cards: appear ONLY after streaming completes */}
      {!isCurrentStreaming && message.content && <EntityCards text={message.content} />}

      {/* Citations: appear ONLY after streaming completes */}
      {!isCurrentStreaming && message.citations && message.citations.length > 0 && (
        <CitationsBlock
          citations={message.citations}
          loading={false}
        />
      )}

      {/* Action row */}
      {message.content && !isCurrentStreaming && (
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 animate-appear">
          <span className="truncate max-w-[200px] sm:max-w-none">
            Answered by {currentModelObj.label} · Grounded
          </span>
          <div className="flex items-center gap-2">
            <SpeakButton
              messageId={message.id}
              text={message.content}
              isSpeaking={isBeingRead}
              onToggle={onToggleSpeech}
            />
            <CopyButton text={message.content} />
          </div>
        </div>
      )}
    </div>
  );
}
