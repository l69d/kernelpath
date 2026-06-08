"use client";

import { useProgress } from "@/components/ProgressProvider";

/** Small completion dot for a module, used on cards & lists. */
export function StatusDot({ id, size = 10 }: { id: string; size?: number }) {
  const { isDone, hydrated } = useProgress();
  const done = hydrated && isDone(id);
  return (
    <span
      aria-label={done ? "completed" : "not completed"}
      className="inline-block rounded-full shrink-0 transition-colors"
      style={{
        width: size,
        height: size,
        background: done ? "var(--color-green)" : "transparent",
        border: `1.5px solid ${done ? "var(--color-green)" : "#2b3a49"}`,
        boxShadow: done ? "0 0 8px var(--color-green)" : undefined,
      }}
    />
  );
}

/** Thin per-track progress bar + count. */
export function TrackProgressBar({ trackId }: { trackId: string }) {
  const { trackFraction, trackDone, hydrated } = useProgress();
  const f = hydrated ? trackFraction(trackId) : 0;
  const done = hydrated ? trackDone(trackId) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full bg-green transition-all duration-700"
          style={{ width: `${f * 100}%` }}
        />
      </div>
      <span className="mono text-[10px] text-faint tabular-nums">
        {done}
      </span>
    </div>
  );
}

/** A live number that only shows real value after hydration. */
export function LiveCount({
  value,
  fallback = 0,
}: {
  value: number;
  fallback?: number;
}) {
  const { hydrated } = useProgress();
  return <>{hydrated ? value : fallback}</>;
}
