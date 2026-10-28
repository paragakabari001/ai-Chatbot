import React, { useState, useEffect } from 'react';

export default function ThinkingState() {
  const [elapsed, setElapsed] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1 text-neutral-400 text-xs animate-appear">
      <span className="w-3 h-3 rounded-full border-2 border-neutral-600 border-t-white animate-spin"></span>
      <span className="text-neutral-400 font-normal">Working for {elapsed}s</span>
    </div>
  );
}
