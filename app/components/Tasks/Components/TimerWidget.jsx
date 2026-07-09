'use client';

import { useState, useEffect } from 'react';

export default function TimerWidget({ activeTimer, onPause, onStop, onRefresh }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) return;

    // Pehle se kitna time tha
    const base = activeTimer.duration_minutes * 60;

    if (activeTimer.status === 'active') {
      const startedAt = new Date(activeTimer.started_at).getTime();

      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startedAt) / 1000);
        setElapsed(base + diff);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsed(base);
    }
  }, [activeTimer]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!activeTimer) return null;

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${activeTimer.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        <div>
          <p className="text-xs text-indigo-400 font-medium">
            {activeTimer.status === 'active' ? 'Timer Running' : 'Timer Paused'}
          </p>
          <p className="font-bold text-indigo-800 text-sm">
            {activeTimer.task_id?.title || 'Task'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-black text-indigo-700">
          {formatTime(elapsed)}
        </span>

        {activeTimer.status === 'active' ? (
          <button
            onClick={onPause}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            ▶ Resume
          </button>
        )}

        <button
          onClick={onStop}
          className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}