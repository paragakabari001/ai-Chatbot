import React from 'react';

export default function SpeakButton({ messageId, text, isSpeaking, onToggle }) {
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
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
        </svg>
      )}
    </button>
  );
}
