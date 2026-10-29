import React from 'react';
import { SUPPORTED_MODELS } from '../utils/models';

export default function ModelPicker({
  model,
  setModel,
  showModelPicker,
  setShowModelPicker,
  currentModelObj,
  popoverRef
}) {
  const CurrentIcon = currentModelObj.icon;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setShowModelPicker(!showModelPicker)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
          showModelPicker
            ? "bg-[#222222] text-white border-neutral-600 ring-2 ring-blue-500/20"
            : "bg-[#181818] hover:bg-[#202020] text-neutral-300 hover:text-white border-neutral-700/70"
        }`}
        title="Select AI Model"
      >
        <span className={currentModelObj.iconColor}>
          <CurrentIcon className="w-3.5 h-3.5" />
        </span>
        <span className="truncate max-w-[100px] sm:max-w-none">{currentModelObj.shortLabel}</span>
        <svg
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${showModelPicker ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Spacious Polished Dropdown Popover */}
      {showModelPicker && (
        <div className="absolute right-0 bottom-full mb-2.5 bg-[#121212] border border-[#2A2A2A] rounded-2xl p-2 shadow-[0_16px_48px_rgba(0,0,0,0.85)] z-50 w-80 max-w-[92vw] sm:w-[340px] text-xs animate-appear backdrop-blur-xl">
          {/* Popover Header */}
          <div className="px-3 py-2 border-b border-[#222222] flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Select AI Model
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Grounded RAG
            </span>
          </div>

          {/* Model Options List */}
          <div className="space-y-1">
            {SUPPORTED_MODELS.map((item) => {
              const isSelected = model === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setModel(item.id);
                    setShowModelPicker(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition group ${
                    isSelected
                      ? "bg-[#1C1C1C] text-white border border-neutral-700/70 shadow-sm"
                      : "text-neutral-400 hover:bg-[#181818] hover:text-neutral-200 border border-transparent"
                  }`}
                >
                  {/* Left: Icon + Label + Subtitle */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-neutral-800 text-white" : "bg-neutral-900/90 text-neutral-400 group-hover:text-white"
                      } ${item.iconColor} border border-neutral-800 transition`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold whitespace-nowrap ${isSelected ? "text-white" : "text-neutral-200"}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 truncate max-w-[170px] sm:max-w-[190px]">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {/* Right: Badge + Checkmark */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
