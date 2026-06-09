"use client";

import { useMemo, useState } from "react";

/* ================================================================== *
 *  t1-06 — Dynamic Memory: malloc, free & the Heap
 *  A horizontal heap of cells. malloc(size) first-fits a free run and
 *  paints it; free(id) releases it. Free non-adjacent blocks and watch
 *  a big malloc fail despite plenty of TOTAL free space — fragmentation.
 * ================================================================== */

const CELLS = 24; // bytes in our toy heap
const PALETTE = ["#3fb950", "#39c5e0", "#bc8cff", "#e3a93c", "#f778ba", "#58a6ff"];

type Block = { id: number; color: string }; // an allocation
type Cell = number | null; // block id occupying this byte, or null = free

type Step = { kind: "malloc"; size: number } | { kind: "free"; id: number };

// Scripted demo that produces the fragmentation "aha":
// fill the heap with adjacent blocks, free two NON-adjacent ones, then
// try a malloc bigger than any single hole (but smaller than total free).
const DEMO: Step[] = [
  { kind: "malloc", size: 5 },
  { kind: "malloc", size: 4 },
  { kind: "malloc", size: 6 },
  { kind: "malloc", size: 5 },
  { kind: "free", id: 1 }, // open a 5-byte hole on the left
  { kind: "free", id: 3 }, // open a 6-byte hole in the middle (non-adjacent)
  { kind: "malloc", size: 9 }, // 11 bytes free total, but no run ≥ 9 → FAILS
];

function firstFit(cells: Cell[], size: number): number {
  let run = 0;
  for (let i = 0; i < cells.length; i++) {
    run = cells[i] === null ? run + 1 : 0;
    if (run >= size) return i - size + 1; // start index of the fit
  }
  return -1;
}

function largestRun(cells: Cell[]): number {
  let run = 0;
  let best = 0;
  for (const c of cells) {
    run = c === null ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

export default function HeapAllocViz() {
  const [cells, setCells] = useState<Cell[]>(() => Array<Cell>(CELLS).fill(null));
  const [blocks, setBlocks] = useState<Record<number, Block>>({});
  const [nextId, setNextId] = useState(1);
  const [size, setSize] = useState(4);
  const [demo, setDemo] = useState(0); // index into DEMO for the guided tour
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const used = useMemo(() => cells.filter((c) => c !== null).length, [cells]);
  const free = CELLS - used;
  const largest = useMemo(() => largestRun(cells), [cells]);
  const liveIds = useMemo(
    () => Object.values(blocks).sort((a, b) => a.id - b.id),
    [blocks],
  );

  function doMalloc(n: number) {
    const start = firstFit(cells, n);
    if (start < 0) {
      setMsg({
        text: `malloc(${n}) → NULL · ${free}B free total, but the largest contiguous hole is only ${largest}B`,
        ok: false,
      });
      return -1;
    }
    const id = nextId;
    const color = PALETTE[(id - 1) % PALETTE.length];
    const next = cells.slice();
    for (let i = start; i < start + n; i++) next[i] = id;
    setCells(next);
    setBlocks((b) => ({ ...b, [id]: { id, color } }));
    setNextId(id + 1);
    setMsg({ text: `malloc(${n}) → block #${id} at byte ${start} (first-fit)`, ok: true });
    return id;
  }

  function doFree(id: number) {
    if (!blocks[id]) return;
    setCells((c) => c.map((v) => (v === id ? null : v)));
    setBlocks((b) => {
      const copy = { ...b };
      delete copy[id];
      return copy;
    });
    setMsg({ text: `free(#${id}) → bytes returned to the heap (now reusable)`, ok: true });
  }

  function reset() {
    setCells(Array<Cell>(CELLS).fill(null));
    setBlocks({});
    setNextId(1);
    setDemo(0);
    setMsg(null);
  }

  function stepDemo() {
    if (demo >= DEMO.length) {
      reset();
      return;
    }
    const s = DEMO[demo];
    if (s.kind === "malloc") doMalloc(s.size);
    else doFree(s.id);
    setDemo(demo + 1);
  }

  const hoverId = hover === null ? null : cells[hover];

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="py-2 space-y-4">
          {/* readouts */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="used" value={`${used} B`} color="#f85149" />
            <Stat label="free (total)" value={`${free} B`} color="#3fb950" />
            <Stat label="largest hole" value={`${largest} B`} color="#39c5e0" />
          </div>

          {/* the heap */}
          <div>
            <div className="flex gap-[3px]">
              {cells.map((c, i) => {
                const blk = c === null ? null : blocks[c];
                const isHoverBlk = hoverId !== null && c === hoverId;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => c !== null && doFree(c)}
                    title={c === null ? `byte ${i} · free` : `byte ${i} · block #${c} (click to free)`}
                    className="relative flex-1 rounded-sm transition-all"
                    style={{
                      height: 46,
                      minWidth: 14,
                      background: blk ? blk.color : "#10151d",
                      border: `1px solid ${blk ? blk.color : "#1e2630"}`,
                      opacity: blk && isHoverBlk ? 1 : blk ? 0.86 : 1,
                      boxShadow: isHoverBlk && blk ? `0 0 16px -4px ${blk.color}` : undefined,
                      cursor: c === null ? "default" : "pointer",
                    }}
                  >
                    <span
                      className="mono absolute inset-x-0 bottom-0.5 text-center text-[8px]"
                      style={{ color: blk ? "#06121a" : "#5b6b7d" }}
                    >
                      {i}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mono mt-1 flex justify-between text-[10px] text-faint">
              <span>0x0000 · low addresses</span>
              <span>{CELLS}-byte heap · brk →</span>
            </div>
          </div>

          {/* status line */}
          <div
            className="card flex min-h-[46px] items-center gap-3 p-3"
            style={{ borderColor: msg ? (msg.ok ? "#2b3a49" : "#f8514955") : "#1e2630" }}
          >
            <span
              className="mono text-xs font-bold"
              style={{ color: msg ? (msg.ok ? "#56d364" : "#f85149") : "#5b6b7d" }}
            >
              {msg ? (msg.ok ? "OK" : "✕") : "›"}
            </span>
            <p className="mono text-xs" style={{ color: msg && !msg.ok ? "#f85149" : "#8a97a8" }}>
              {msg ? msg.text : "Pick a size and malloc. Click any colored byte to free its block."}
            </p>
          </div>

          {/* controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="card flex items-center gap-3 p-2">
              <span className="mono text-[10px] uppercase tracking-widest text-faint">size</span>
              <input
                type="range"
                min={1}
                max={12}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-28 accent-[#3fb950]"
              />
              <span className="mono w-10 text-sm font-bold text-text">{size} B</span>
            </div>
            <button
              onClick={() => doMalloc(size)}
              className="mono rounded border px-3 py-2 text-xs font-bold transition-all"
              style={{ background: "#10151d", borderColor: "#3fb950", color: "#56d364" }}
            >
              malloc({size})
            </button>
            <button
              onClick={stepDemo}
              className="mono rounded border border-border px-3 py-2 text-xs text-cyan transition-all hover:text-text"
            >
              {demo >= DEMO.length ? "↺ reset demo" : `▶ fragment demo (${demo}/${DEMO.length})`}
            </button>
            <button
              onClick={reset}
              className="mono rounded border border-border px-3 py-2 text-xs text-faint transition-all hover:text-text"
            >
              clear heap
            </button>
          </div>

          {/* live allocations */}
          {liveIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mono text-[10px] uppercase tracking-widest text-faint">live blocks:</span>
              {liveIds.map((b) => (
                <button
                  key={b.id}
                  onClick={() => doFree(b.id)}
                  onMouseEnter={() => setHover(cells.indexOf(b.id))}
                  onMouseLeave={() => setHover(null)}
                  className="mono rounded px-2 py-1 text-[11px] transition-all"
                  style={{ background: `${b.color}22`, color: b.color, border: `1px solid ${b.color}66` }}
                >
                  free(#{b.id})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mono mt-3 text-center text-xs text-faint">
        First-fit picks the first hole big enough. Free non-adjacent blocks, then{" "}
        <span className="text-cyan">malloc(9)</span> — it fails even with{" "}
        <span className="text-green">11 B free</span>. That gap is <b className="text-text">fragmentation</b>.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono mt-0.5 text-sm font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
