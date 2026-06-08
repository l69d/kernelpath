"use client";

import { useProgress } from "@/components/ProgressProvider";

export function CompleteToggle({ id }: { id: string }) {
  const { isDone, toggle, hydrated } = useProgress();
  const done = hydrated && isDone(id);
  return (
    <button
      onClick={() => toggle(id)}
      disabled={!hydrated}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm transition-all disabled:opacity-50"
      style={{
        background: done ? "var(--color-green)" : "transparent",
        color: done ? "#06121a" : "var(--color-green)",
        border: "1px solid var(--color-green)",
        boxShadow: done ? "0 0 22px -8px var(--color-green)" : undefined,
      }}
    >
      <span
        className="grid h-4 w-4 place-items-center rounded-full text-[10px]"
        style={{
          background: done ? "#06121a" : "transparent",
          border: done ? "none" : "1.5px solid var(--color-green)",
          color: done ? "var(--color-green)" : "transparent",
        }}
      >
        ✓
      </span>
      {done ? "Completed" : "Mark complete"}
    </button>
  );
}

/** Compact pill used in the sticky footer bar. */
export function CompletePill({ id }: { id: string }) {
  const { isDone, toggle, hydrated } = useProgress();
  const done = hydrated && isDone(id);
  return (
    <button
      onClick={() => toggle(id)}
      disabled={!hydrated}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all disabled:opacity-50"
      style={{
        background: done ? "var(--color-green)" : "var(--color-surface-2)",
        color: done ? "#06121a" : "var(--color-text)",
        border: `1px solid ${done ? "var(--color-green)" : "var(--color-border)"}`,
      }}
    >
      {done ? "✓ Completed" : "Mark this module complete"}
    </button>
  );
}
