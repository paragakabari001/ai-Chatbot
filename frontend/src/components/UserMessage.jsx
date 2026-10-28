import React from 'react';

export default function UserMessage({
  content,
  index,
  isEditing,
  editInput,
  setEditInput,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isStreaming
}) {
  if (isEditing) {
    return (
      <div className="w-full max-w-[88%] sm:max-w-xl bg-[#1C1C1C] border border-blue-500/60 rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg animate-appear">
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
            onClick={onCancelEdit}
            className="px-2.5 py-1 rounded-md text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSaveEdit(index)}
            className="px-3 py-1 rounded-md bg-white text-black font-semibold hover:bg-neutral-200 transition"
          >
            Save & Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative max-w-[88%] sm:max-w-xl">
      <div className="bg-[#1C1C1C] border border-neutral-800 text-white px-4 py-2.5 rounded-2xl text-sm leading-relaxed">
        {content}
      </div>
      {!isStreaming && (
        <button
          type="button"
          onClick={() => onStartEdit(index, content)}
          className="opacity-0 group-hover:opacity-100 transition absolute -left-7 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white rounded"
          title="Edit message"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
}
