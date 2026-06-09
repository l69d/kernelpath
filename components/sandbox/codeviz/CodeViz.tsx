"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Algorithm } from "./types";
import { CodePanel, Viz } from "./renderers";

export default function CodeViz({ algo }: { algo: Algorithm }) {
  const steps = useMemo(() => {
    try {
      return algo.run();
    } catch {
      return [];
    }
  }, [algo]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(55); // 0..100, higher = faster
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // reset when algorithm changes
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [algo]);

  const clear = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    clear();
    if (!playing || steps.length === 0) return;
    timer.current = setInterval(
      () => {
        setIdx((i) => {
          if (i >= steps.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      },
      Math.max(60, 720 - speed * 6.6),
    );
    return clear;
  }, [playing, speed, steps.length, clear]);

  if (steps.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-muted">
        This algorithm produced no steps to visualize.
      </div>
    );
  }

  const safeIdx = Math.min(idx, steps.length - 1);
  const step = steps[safeIdx];
  const activeLines = Array.isArray(step.line) ? step.line : [step.line];
  const done = safeIdx >= steps.length - 1;

  const go = (n: number) => {
    setPlaying(false);
    setIdx(Math.max(0, Math.min(steps.length - 1, n)));
  };

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            if (done) setIdx(0);
            setPlaying((p) => !p);
          }}
          className="rounded-lg bg-green px-4 py-1.5 font-semibold text-sm text-[#06121a] hover:bg-green-bright transition-colors"
        >
          {playing ? "❚❚ pause" : done ? "↻ replay" : "▶ play"}
        </button>
        <button
          onClick={() => go(safeIdx - 1)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          ← back
        </button>
        <button
          onClick={() => go(safeIdx + 1)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          step →
        </button>
        <button
          onClick={() => go(0)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          ⟲ reset
        </button>
        <label className="ml-auto flex items-center gap-2 mono text-[11px] text-faint">
          speed
          <input
            type="range"
            min={5}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="accent-[#3fb950]"
          />
        </label>
      </div>

      {/* explanation banner */}
      <div
        className="rounded-lg px-4 py-3 text-sm"
        style={{
          background: "rgba(227,169,60,0.10)",
          border: "1px solid rgba(227,169,60,0.32)",
          color: "#e8d9b8",
        }}
      >
        <span className="mono text-[10px] uppercase tracking-widest text-amber mr-2">
          line {activeLines.map((l) => l + 1).join(", ")}
        </span>
        {step.explain}
      </div>

      {/* code + viz */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <CodePanel code={algo.code} active={activeLines} />
        </div>
        <div className="order-1 lg:order-2">
          <div className="card p-4 min-h-[300px] flex flex-col justify-center">
            <Viz kind={algo.renderKind} state={step.state} />
          </div>
        </div>
      </div>

      {/* scrubber */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={safeIdx}
          onChange={(e) => go(Number(e.target.value))}
          className="flex-1 accent-[#3fb950]"
        />
        <span className="mono text-[11px] text-faint whitespace-nowrap">
          step {safeIdx + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}
