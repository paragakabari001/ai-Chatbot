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
      <button
        type="button"
        onClick={() => setShowModelPicker(!showModelPicker)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition border border-neutral-700/60"
        title="Select AI Model"
      >
        <span className={currentModelObj.iconColor}>
          <CurrentIcon className="w-3.5 h-3.5" />
        </span>
        <span className="truncate max-w-[90px] sm:max-w-none">{currentModelObj.shortLabel}</span>
        <span className="text-[10px] text-neutral-400">⌵</span>
      </button>

      {showModelPicker && (
        <div className="absolute right-0 bottom-full mb-2 bg-[#161616] border border-[#2E2E2E] rounded-2xl p-1.5 shadow-2xl z-50 w-64 text-xs animate-appear">
          <div className="text-[10px] font-semibold text-neutral-500 uppercase px-3 py-1.5 tracking-wider">
            Select AI Model
          </div>
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
                className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#202020] flex items-center justify-between transition ${
                  isSelected ? "bg-[#1E1E1E] text-white font-medium" : "text-neutral-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={item.iconColor}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className={isSelected ? "text-white font-semibold" : "text-neutral-300"}>
                    {item.label}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
