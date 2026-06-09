"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Algo = "FIFO" | "LRU" | "Optimal" | "Clock";

const ALGOS: { id: Algo; label: string; blurb: string }[] = [
  { id: "FIFO", label: "FIFO", blurb: "evict the oldest-loaded page" },
  { id: "LRU", label: "LRU", blurb: "evict the least-recently-used page" },
  { id: "Optimal", label: "Optimal", blurb: "evict the page used farthest in the future" },
  { id: "Clock", label: "Clock", blurb: "second-chance: scan a hand over use-bits" },
];

// One column of the timeline — the state after processing reference at this index.
type Step = {
  page: number; // the referenced page
  fault: boolean; // true = page fault, false = hit
  frames: (number | null)[]; // frame contents AFTER handling this reference
  loadedSlot: number | null; // frame index that received the new page (faults only)
  evictedPage: number | null; // page that was thrown out (capacity-miss faults only)
  hitSlot: number | null; // frame index that already held the page (hits only)
};

type SimResult = {
  steps: Step[];
  faults: number;
};

function parseRefs(raw: string): { refs: number[]; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === "") return { refs: [], error: "Enter a reference string, e.g. 7 0 1 2 0 3" };
  // Accept spaces, commas, tabs, newlines as separators.
  const tokens = trimmed.split(/[\s,]+/).filter((t) => t.length > 0);
  const refs: number[] = [];
  for (const tok of tokens) {
    if (!/^\d+$/.test(tok)) {
      return { refs: [], error: `"${tok}" is not a non-negative integer page number` };
    }
    const n = Number(tok);
    if (!Number.isSafeInteger(n)) {
      return { refs: [], error: `"${tok}" is out of range` };
    }
    refs.push(n);
  }
  if (refs.length > 64) {
    return { refs: [], error: "Reference string is limited to 64 pages for clarity" };
  }
  return { refs, error: null };
}

function simulate(refs: number[], frameCount: number, algo: Algo): SimResult {
  const steps: Step[] = [];
  let faults = 0;

  // Frame contents: page number or null when empty.
  const frames: (number | null)[] = new Array(frameCount).fill(null);
  // Per-algorithm bookkeeping.
  const loadOrder: number[] = []; // FIFO queue of frame slots in insertion order
  const lastUsed = new Map<number, number>(); // page -> last reference index (LRU)
  const useBit: boolean[] = new Array(frameCount).fill(false); // Clock use-bits
  let hand = 0; // Clock hand position

  const slotOf = (page: number): number => frames.indexOf(page);

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i];
    const existing = slotOf(page);

    if (existing !== -1) {
      // HIT
      lastUsed.set(page, i);
      if (algo === "Clock") useBit[existing] = true;
      steps.push({
        page,
        fault: false,
        frames: frames.slice(),
        loadedSlot: null,
        evictedPage: null,
        hitSlot: existing,
      });
      continue;
    }

    // FAULT — find a slot to place the page.
    faults += 1;
    let target = frames.indexOf(null); // prefer an empty frame
    let evictedPage: number | null = null;

    if (target === -1) {
      // No empty frame — pick a victim per the algorithm.
      if (algo === "FIFO") {
        target = loadOrder.shift() as number;
      } else if (algo === "LRU") {
        let oldest = Infinity;
        for (let s = 0; s < frameCount; s++) {
          const p = frames[s] as number;
          const t = lastUsed.get(p) ?? -1;
          if (t < oldest) {
            oldest = t;
            target = s;
          }
        }
      } else if (algo === "Optimal") {
        // Evict the page whose next use is farthest in the future (or never used again).
        let farthest = -1;
        target = 0;
        for (let s = 0; s < frameCount; s++) {
          const p = frames[s] as number;
          let nextUse = Infinity;
          for (let j = i + 1; j < refs.length; j++) {
            if (refs[j] === p) {
              nextUse = j;
              break;
            }
          }
          if (nextUse > farthest) {
            farthest = nextUse;
            target = s;
          }
          if (nextUse === Infinity) break; // can't beat "never used again"
        }
      } else {
        // Clock (second-chance): advance the hand, clearing use-bits, until one is 0.
        while (useBit[hand]) {
          useBit[hand] = false;
          hand = (hand + 1) % frameCount;
        }
        target = hand;
        hand = (hand + 1) % frameCount;
      }
      evictedPage = frames[target] as number;
    }

    // Maintain per-algorithm structures for the chosen slot.
    if (algo === "FIFO") {
      // The slot is now (re)inserted at the back of the queue.
      const qi = loadOrder.indexOf(target);
      if (qi !== -1) loadOrder.splice(qi, 1);
      loadOrder.push(target);
    }
    if (algo === "Clock") {
      useBit[target] = true; // freshly loaded page gets a second chance
    }

    if (evictedPage !== null) lastUsed.delete(evictedPage);
    frames[target] = page;
    lastUsed.set(page, i);

    steps.push({
      page,
      fault: true,
      frames: frames.slice(),
      loadedSlot: target,
      evictedPage,
      hitSlot: null,
    });
  }

  return { steps, faults };
}

const PRESETS: { label: string; refs: string; frames: number }[] = [
  { label: "Classic (Belady book)", refs: "7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1", frames: 3 },
  { label: "Belady's anomaly", refs: "1 2 3 4 1 2 5 1 2 3 4 5", frames: 3 },
  { label: "Looping locality", refs: "0 1 2 3 0 1 2 3 0 1 2 3", frames: 3 },
];

export default function Paging() {
  const [refInput, setRefInput] = useState<string>("7 0 1 2 0 3 0 4 2 3 0 3 2");
  const [frameCount, setFrameCount] = useState<number>(3);
  const [algo, setAlgo] = useState<Algo>("FIFO");
  const [cursor, setCursor] = useState<number>(0); // how many references have been processed
  const [running, setRunning] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const { refs, error } = useMemo(() => parseRefs(refInput), [refInput]);

  const sim = useMemo<SimResult | null>(() => {
    if (error || refs.length === 0) return null;
    return simulate(refs, frameCount, algo);
  }, [refs, frameCount, algo, error]);

  const totalSteps = sim ? sim.steps.length : 0;

  // Clamp the cursor whenever the simulation length changes.
  useEffect(() => {
    setCursor((c) => Math.min(c, totalSteps));
  }, [totalSteps]);

  // Reset playback whenever inputs that change the timeline change.
  useEffect(() => {
    setCursor(0);
    setRunning(false);
  }, [refInput, frameCount, algo]);

  // Auto-run animation.
  useEffect(() => {
    if (!running) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (cursor >= totalSteps) {
      setRunning(false);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setCursor((c) => Math.min(c + 1, totalSteps));
    }, 550);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, cursor, totalSteps]);

  const step = () => {
    setRunning(false);
    setCursor((c) => Math.min(c + 1, totalSteps));
  };
  const stepBack = () => {
    setRunning(false);
    setCursor((c) => Math.max(c - 1, 0));
  };
  const reset = () => {
    setRunning(false);
    setCursor(0);
  };
  const toggleRun = () => {
    if (cursor >= totalSteps) setCursor(0);
    setRunning((r) => !r);
  };

  // Faults accumulated through the visible prefix.
  const visibleSteps = sim ? sim.steps.slice(0, cursor) : [];
  const faultsSoFar = visibleSteps.filter((s) => s.fault).length;
  const hitsSoFar = cursor - faultsSoFar;
  const rate = cursor > 0 ? (faultsSoFar / cursor) * 100 : 0;

  const frameRows = Array.from({ length: frameCount }, (_, i) => i);

  return (
    <div className="space-y-5">
      {/* controls row 1: reference string */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="mono text-xs text-muted flex flex-col gap-1.5 flex-1 min-w-[260px]">
          <span className="uppercase tracking-widest text-[10px] text-faint">
            reference string
          </span>
          <input
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            className="w-full bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
            placeholder="e.g. 7 0 1 2 0 3 0 4 2 3 0 3 2"
            spellCheck={false}
          />
        </label>
        <label className="mono text-xs text-muted flex flex-col gap-1.5">
          <span className="uppercase tracking-widest text-[10px] text-faint">frames</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setFrameCount(n)}
                className="mono text-xs rounded px-2.5 py-1.5 border transition-colors"
                style={{
                  background: frameCount === n ? "var(--color-green)" : "transparent",
                  color: frameCount === n ? "#06121a" : "var(--color-muted)",
                  borderColor: frameCount === n ? "var(--color-green)" : "var(--color-border)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </label>
      </div>

      {/* presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono text-[10px] uppercase tracking-widest text-faint mr-1">
          presets
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setRefInput(p.refs);
              setFrameCount(p.frames);
            }}
            className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* algorithm selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ALGOS.map((a) => {
          const active = algo === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAlgo(a.id)}
              className="text-left rounded-md border px-3 py-2 transition-colors"
              style={{
                borderColor: active ? "var(--color-cyan)" : "var(--color-border)",
                background: active ? "#39c5e014" : "var(--color-surface)",
              }}
            >
              <div
                className="mono text-sm font-bold"
                style={{ color: active ? "#39c5e0" : "var(--color-text)" }}
              >
                {a.label}
              </div>
              <div className="mono text-[10px] text-faint leading-tight mt-0.5">{a.blurb}</div>
            </button>
          );
        })}
      </div>

      {/* transport controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleRun}
          disabled={!sim}
          className="mono text-xs rounded px-3 py-1.5 border font-bold transition-colors disabled:opacity-40"
          style={{
            background: running ? "transparent" : "var(--color-green)",
            color: running ? "var(--color-muted)" : "#06121a",
            borderColor: running ? "var(--color-border)" : "var(--color-green)",
          }}
        >
          {running ? "⏸ Pause" : cursor >= totalSteps && totalSteps > 0 ? "↻ Replay" : "▶ Run"}
        </button>
        <button
          onClick={stepBack}
          disabled={!sim || cursor === 0}
          className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text disabled:opacity-40"
        >
          ‹ Back
        </button>
        <button
          onClick={step}
          disabled={!sim || cursor >= totalSteps}
          className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text disabled:opacity-40"
        >
          Step ›
        </button>
        <button
          onClick={reset}
          disabled={!sim || cursor === 0}
          className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text disabled:opacity-40"
        >
          Reset
        </button>
        <span className="mono text-[11px] text-faint ml-1">
          {cursor} / {totalSteps} refs
        </span>
      </div>

      {error ? (
        <div
          className="card p-4 mono text-sm"
          style={{ color: "#f85149", borderColor: "#f8514955", background: "#f8514910" }}
        >
          {error}
        </div>
      ) : !sim ? null : (
        <>
          {/* readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Cell label="page faults" value={String(faultsSoFar)} color="#f85149" />
            <Cell label="page hits" value={String(hitsSoFar)} color="#3fb950" />
            <Cell
              label="fault rate"
              value={cursor > 0 ? rate.toFixed(1) + "%" : "—"}
              color="#e3a93c"
            />
            <Cell
              label="total faults"
              value={`${sim.faults} / ${totalSteps}`}
              color="#39c5e0"
            />
          </div>

          {/* timeline grid */}
          <div className="card p-4 overflow-x-auto">
            <div className="min-w-max">
              {/* header row: reference string */}
              <div className="flex gap-1 mb-1">
                <HeaderLabel>ref</HeaderLabel>
                {sim.steps.map((s, c) => {
                  const visible = c < cursor;
                  const current = c === cursor - 1;
                  return (
                    <div
                      key={c}
                      className="grid place-items-center rounded mono text-sm font-bold transition-all"
                      style={{
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        background: current ? "#58a6ff" : visible ? "#161c26" : "#0b0f15",
                        color: current ? "#06121a" : visible ? "#d6dee8" : "#3a4654",
                        border: `1px solid ${current ? "#58a6ff" : "#1e2630"}`,
                      }}
                    >
                      {s.page}
                    </div>
                  );
                })}
              </div>

              {/* frame rows */}
              {frameRows.map((row) => (
                <div key={row} className="flex gap-1 mb-1">
                  <HeaderLabel>f{row}</HeaderLabel>
                  {sim.steps.map((s, c) => {
                    const visible = c < cursor;
                    const content = visible ? s.frames[row] : null;
                    const isLoad = visible && s.fault && s.loadedSlot === row;
                    const isHit = visible && !s.fault && s.hitSlot === row;
                    const isCurrentCol = c === cursor - 1;

                    let bg = "#0b0f15";
                    let fg = "#3a4654";
                    let border = "#1e2630";
                    if (content !== null) {
                      bg = "#10151d";
                      fg = "#d6dee8";
                    }
                    if (isLoad) {
                      bg = "#f8514922";
                      fg = "#f85149";
                      border = "#f85149";
                    } else if (isHit) {
                      bg = "#3fb95022";
                      fg = "#3fb950";
                      border = "#3fb950";
                    } else if (content !== null && isCurrentCol) {
                      border = "#58a6ff66";
                    }

                    return (
                      <div
                        key={c}
                        className="grid place-items-center rounded mono text-sm transition-all"
                        style={{
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          background: bg,
                          color: fg,
                          border: `1px solid ${border}`,
                          fontWeight: isLoad || isHit ? 700 : 400,
                        }}
                        title={
                          isLoad
                            ? s.evictedPage !== null
                              ? `loaded ${s.page}, evicted ${s.evictedPage}`
                              : `loaded ${s.page} into empty frame`
                            : isHit
                              ? `hit on page ${s.page}`
                              : content !== null
                                ? `page ${content}`
                                : "empty"
                        }
                      >
                        {content === null ? "·" : content}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* status row: HIT / FAULT */}
              <div className="flex gap-1 mt-1">
                <HeaderLabel> </HeaderLabel>
                {sim.steps.map((s, c) => {
                  const visible = c < cursor;
                  return (
                    <div
                      key={c}
                      className="grid place-items-center rounded mono text-[9px] font-bold transition-all"
                      style={{
                        width: 30,
                        height: 18,
                        flexShrink: 0,
                        color: !visible ? "#2a323d" : s.fault ? "#f85149" : "#3fb950",
                        letterSpacing: "0.02em",
                      }}
                      title={visible ? (s.fault ? "page fault" : "hit") : ""}
                    >
                      {!visible ? "" : s.fault ? "F" : "H"}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
              <LegendSwatch color="#f85149" label="fault — page loaded / evicted" />
              <LegendSwatch color="#3fb950" label="hit — already resident" />
              <span className="mono">
                F = fault &nbsp;·&nbsp; H = hit &nbsp;·&nbsp; · = empty frame
              </span>
            </div>
          </div>

          {/* current-step explanation */}
          <div className="card p-4 mono text-xs leading-relaxed">
            <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
              {algo} · {frameCount} frame{frameCount > 1 ? "s" : ""}
            </div>
            <StepExplain
              algo={algo}
              cursor={cursor}
              total={totalSteps}
              step={cursor > 0 ? sim.steps[cursor - 1] : null}
            />
          </div>
        </>
      )}
    </div>
  );
}

function StepExplain({
  algo,
  cursor,
  total,
  step,
}: {
  algo: Algo;
  cursor: number;
  total: number;
  step: Step | null;
}) {
  if (step === null) {
    return (
      <p className="text-muted">
        Press <span className="text-text">Step</span> or <span className="text-text">Run</span> to
        feed the reference string through {algo}. Each column is the frame state after one memory
        reference; the bottom row marks whether it was a hit or a page fault.
      </p>
    );
  }
  if (!step.fault) {
    return (
      <p className="text-muted">
        Reference <span className="text-cyan font-bold">{step.page}</span> →{" "}
        <span className="text-green font-bold">HIT</span>. The page is already resident in frame{" "}
        <span className="text-text">f{step.hitSlot}</span>, so no fault and no eviction.
        {algo === "LRU" && " Its recency timestamp is refreshed."}
        {algo === "Clock" && " Its use-bit is set back to 1, earning a second chance."}
      </p>
    );
  }
  return (
    <p className="text-muted">
      Reference <span className="text-cyan font-bold">{step.page}</span> →{" "}
      <span style={{ color: "#f85149" }} className="font-bold">
        FAULT
      </span>
      .{" "}
      {step.evictedPage === null ? (
        <>
          Loaded into the empty frame <span className="text-text">f{step.loadedSlot}</span>.
        </>
      ) : (
        <>
          {algo} chose to evict page <span className="text-text">{step.evictedPage}</span> from
          frame <span className="text-text">f{step.loadedSlot}</span>, then loaded{" "}
          <span className="text-text">{step.page}</span> there.
        </>
      )}{" "}
      <span className="text-faint">
        ({cursor} of {total} references processed)
      </span>
    </p>
  );
}

function HeaderLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid place-items-center mono text-[10px] uppercase tracking-wider text-faint"
      style={{ width: 26, flexShrink: 0 }}
    >
      {children}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 mono">
      <span
        className="inline-block rounded-sm"
        style={{ width: 11, height: 11, background: color + "33", border: `1px solid ${color}` }}
      />
      {label}
    </span>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-lg font-bold mt-1 truncate" style={{ color }} title={value}>
        {value}
      </div>
    </div>
  );
}