"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  TRACKS,
  MODULES,
  modulesInTrack,
  moduleById,
} from "@/lib/modules";
import { trackColor, TRACK_INDEX } from "@/lib/ui";
import { useProgress } from "@/components/ProgressProvider";
import ProgressRing from "@/components/ProgressRing";

export default function ProgressPage() {
  const {
    hydrated,
    fraction,
    doneCount,
    total,
    completed,
    trackFraction,
    trackDone,
    reset,
    exportJson,
    importJson,
    startedAt,
  } = useProgress();

  const fileRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const nextUp = useMemo(() => {
    return MODULES.find((m) => !completed.has(m.id));
  }, [completed]);

  const note = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kernelpath-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    note("Progress exported");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importJson(String(reader.result));
      note(ok ? "Progress imported" : "Could not read that file");
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Reset all progress? This clears every completed module from this browser.",
      )
    ) {
      reset();
      note("Progress reset");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">
        Your progress
      </h1>
      <p className="mt-2 text-muted">
        Saved locally in this browser. Export it to back up or move to another
        device.
      </p>

      {/* overview */}
      <div className="mt-8 card p-6 grid gap-6 sm:grid-cols-[auto_1fr] items-center grid-bg">
        <ProgressRing
          value={hydrated ? fraction : 0}
          size={150}
          stroke={12}
          label="complete"
        />
        <div>
          <div className="text-2xl font-black">
            {hydrated ? doneCount : 0}{" "}
            <span className="text-muted font-normal text-lg">
              / {total} modules
            </span>
          </div>
          {hydrated && nextUp ? (
            <div className="mt-3">
              <div className="mono text-[11px] uppercase tracking-widest text-faint">
                continue where you left off
              </div>
              <Link
                href={`/module/${nextUp.id}`}
                className="mt-1 inline-flex items-center gap-2 rounded-lg border border-green/40 bg-green/10 px-3 py-2 text-sm font-medium text-green hover:bg-green/20 transition-colors"
              >
                <span className="mono text-[10px]">{nextUp.id}</span>
                {nextUp.title} →
              </Link>
            </div>
          ) : hydrated && !nextUp ? (
            <div className="mt-3 text-green font-semibold">
              🎉 Every module complete. Go send a patch.
            </div>
          ) : null}
          {startedAt && (
            <div className="mt-3 mono text-[11px] text-faint">
              started {new Date(startedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:border-faint/50 transition-colors"
        >
          ↧ Export
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:border-faint/50 transition-colors"
        >
          ↥ Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={handleReset}
          className="rounded-lg border border-red/40 bg-red/5 px-3 py-2 text-sm text-red hover:bg-red/10 transition-colors"
        >
          ⟲ Reset
        </button>
        {flash && (
          <span className="self-center mono text-xs text-green">{flash}</span>
        )}
      </div>

      {/* per-track */}
      <h2 className="mt-12 text-xl font-bold">By track</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t) => {
          const color = trackColor(t.id);
          const count = modulesInTrack(t.id).length;
          const done = hydrated ? trackDone(t.id) : 0;
          const f = hydrated ? trackFraction(t.id) : 0;
          return (
            <Link
              key={t.id}
              href={`/track/${t.id}`}
              className="card card-hover p-4 flex items-center gap-4"
            >
              <ProgressRing
                value={f}
                size={64}
                stroke={7}
                color={color}
                showPercent
              />
              <div className="min-w-0">
                <div className="mono text-[10px]" style={{ color }}>
                  {TRACK_INDEX[t.id]}
                </div>
                <div className="text-sm font-semibold leading-tight line-clamp-2">
                  {t.title}
                </div>
                <div className="mono text-[11px] text-faint mt-1">
                  {done}/{count}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* completed list */}
      {hydrated && doneCount > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold">
            Completed ({doneCount})
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(completed)
              .map((id) => moduleById(id))
              .filter(Boolean)
              .map((m) => (
                <Link
                  key={m!.id}
                  href={`/module/${m!.id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-green/30 bg-green/5 px-2.5 py-1 text-xs text-text hover:bg-green/10"
                >
                  <span className="text-green">✓</span>
                  <span className="mono text-[10px] text-faint">{m!.id}</span>
                  <span className="line-clamp-1 max-w-[200px]">{m!.title}</span>
                </Link>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
