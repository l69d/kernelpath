"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  t4-07 — Deadlock & Race Conditions
 *  Two threads each grab one lock, then reach for the other. A wait-for
 *  graph makes the circular wait visible; toggling a global lock order
 *  breaks the cycle. Animated play/pause + step scrubber.
 * ================================================================== */

type Hold = "free" | "A" | "B";

interface Frame {
  step: number;
  label: string;
  hold: { L1: Hold; L2: Hold };
  // who is blocked waiting, and on which lock
  wait: { A: "L1" | "L2" | null; B: "L1" | "L2" | null };
  deadlock: boolean;
  done: boolean;
}

const C_A = "#39c5e0"; // thread A — cyan
const C_B = "#bc8cff"; // thread B — purple
const C_FREE = "#1e2630";
const C_RED = "#f85149";
const C_GREEN = "#3fb950";

// Thread A wants L1 then L2; Thread B wants L2 then L1.
// With a global order (L1 < L2) enforced, B is rewritten to take L1 first.
function buildFrames(ordered: boolean): Frame[] {
  if (!ordered) {
    return [
      { step: 0, label: "Both threads start. Locks L1 and L2 are free.", hold: { L1: "free", L2: "free" }, wait: { A: null, B: null }, deadlock: false, done: false },
      { step: 1, label: "Thread A locks L1.  Thread B locks L2.", hold: { L1: "A", L2: "B" }, wait: { A: null, B: null }, deadlock: false, done: false },
      { step: 2, label: "A now needs L2 (held by B) → A blocks. B now needs L1 (held by A) → B blocks.", hold: { L1: "A", L2: "B" }, wait: { A: "L2", B: "L1" }, deadlock: false, done: false },
      { step: 3, label: "DEADLOCK. A waits for B, B waits for A — a cycle in the wait-for graph. Neither can ever proceed.", hold: { L1: "A", L2: "B" }, wait: { A: "L2", B: "L1" }, deadlock: true, done: false },
    ];
  }
  return [
    { step: 0, label: "Global rule: always lock L1 before L2. Both threads obey it.", hold: { L1: "free", L2: "free" }, wait: { A: null, B: null }, deadlock: false, done: false },
    { step: 1, label: "A locks L1.  B also wants L1 first now — but A holds it, so B simply waits.", hold: { L1: "A", L2: "free" }, wait: { A: null, B: "L1" }, deadlock: false, done: false },
    { step: 2, label: "A locks L2 (free), does its work, then releases both. No cycle can form.", hold: { L1: "A", L2: "A" }, wait: { A: null, B: "L1" }, deadlock: false, done: false },
    { step: 3, label: "A is done. B acquires L1, then L2, and finishes. Everyone makes progress.", hold: { L1: "B", L2: "B" }, wait: { A: null, B: null }, deadlock: false, done: true },
  ];
}

function holdColor(h: Hold): string {
  if (h === "A") return C_A;
  if (h === "B") return C_B;
  return C_FREE;
}

export default function DeadlockViz() {
  const [ordered, setOrdered] = useState(false);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  const frames = useMemo(() => buildFrames(ordered), [ordered]);
  const f = frames[Math.min(step, frames.length - 1)];
  const last = frames.length - 1;

  // animate forward; stop at a deadlock or at completion
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setStep((s) => {
        const cur = frames[Math.min(s, last)];
        if (cur.deadlock || cur.done) return s; // park on terminal frame
        return Math.min(s + 1, last);
      });
    }, 1300);
    return () => clearInterval(t);
  }, [auto, frames, last]);

  const reset = (next: boolean) => {
    setOrdered(next);
    setStep(0);
    setAuto(true);
  };

  // wait-for graph geometry
  const ax = 70;
  const bx = 290;
  const ny = 64;
  const r = 30;
  const cycleActive = f.wait.A && f.wait.B; // A→B and B→A both present
  const edgeAB = f.wait.A === "L2"; // A waiting on lock held by B
  const edgeBA = f.wait.B === "L1"; // B waiting on lock held by A

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* lock-ordering toggle */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          <button
            onClick={() => reset(false)}
            className="mono text-[11px] rounded px-3 py-1.5 transition-all"
            style={{
              background: !ordered ? `${C_RED}1a` : "#10151d",
              border: `1px solid ${!ordered ? C_RED : "#1e2630"}`,
              color: !ordered ? C_RED : "#8a97a8",
            }}
          >
            ✗ unordered locking
          </button>
          <button
            onClick={() => reset(true)}
            className="mono text-[11px] rounded px-3 py-1.5 transition-all"
            style={{
              background: ordered ? `${C_GREEN}1a` : "#10151d",
              border: `1px solid ${ordered ? C_GREEN : "#1e2630"}`,
              color: ordered ? C_GREEN : "#8a97a8",
            }}
          >
            ✓ global lock order (L1 &lt; L2)
          </button>
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto]">
          {/* ---- threads & locks ---- */}
          <div className="space-y-2">
            <ThreadRow
              name="Thread A"
              color={C_A}
              code={ordered ? ["lock(L1)", "lock(L2)", "work", "unlock×2"] : ["lock(L1)", "lock(L2)", "work", "unlock×2"]}
              holds={[f.hold.L1 === "A", f.hold.L2 === "A"]}
              waiting={f.wait.A}
            />
            <ThreadRow
              name="Thread B"
              color={C_B}
              code={ordered ? ["lock(L1)", "lock(L2)", "work", "unlock×2"] : ["lock(L2)", "lock(L1)", "work", "unlock×2"]}
              holds={[f.hold.L1 === "B", f.hold.L2 === "B"]}
              waiting={f.wait.B}
            />
            <div className="flex justify-center gap-3 pt-1">
              <LockChip name="L1" hold={f.hold.L1} />
              <LockChip name="L2" hold={f.hold.L2} />
            </div>
          </div>

          {/* ---- wait-for graph ---- */}
          <div className="grid place-items-center">
            <svg viewBox="0 0 360 128" className="w-full" style={{ maxWidth: 360, maxHeight: 150 }}>
              <defs>
                <marker id="dvArrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill={cycleActive ? C_RED : "#5b6b7d"} />
                </marker>
              </defs>
              {/* edge A -> B (A waits for a lock B holds) */}
              {edgeAB && (
                <path
                  d={`M ${ax + r} ${ny - 12} Q 180 ${ny - 40} ${bx - r} ${ny - 12}`}
                  fill="none"
                  stroke={cycleActive ? C_RED : "#5b6b7d"}
                  strokeWidth={cycleActive ? 2.4 : 1.6}
                  markerEnd="url(#dvArrow)"
                />
              )}
              {/* edge B -> A (B waits for a lock A holds) */}
              {edgeBA && (
                <path
                  d={`M ${bx - r} ${ny + 12} Q 180 ${ny + 40} ${ax + r} ${ny + 12}`}
                  fill="none"
                  stroke={cycleActive ? C_RED : "#5b6b7d"}
                  strokeWidth={cycleActive ? 2.4 : 1.6}
                  markerEnd="url(#dvArrow)"
                />
              )}
              <Node x={ax} y={ny} r={r} color={C_A} label="A" blocked={f.wait.A !== null} cycle={!!cycleActive} />
              <Node x={bx} y={ny} r={r} color={C_B} label="B" blocked={f.wait.B !== null} cycle={!!cycleActive} />
              <text x={180} y={120} textAnchor="middle" className="mono" fontSize="9" fill={cycleActive ? C_RED : "#5b6b7d"}>
                {cycleActive ? "CYCLE → deadlock" : "wait-for graph"}
              </text>
            </svg>
          </div>
        </div>

        {/* ---- status readout ---- */}
        <div
          className="card mt-3 p-3 min-h-[58px] flex items-center gap-3"
          style={{
            borderColor: f.deadlock ? C_RED : f.done ? C_GREEN : "#1e2630",
            boxShadow: f.deadlock ? `0 0 22px -8px ${C_RED}` : f.done ? `0 0 22px -8px ${C_GREEN}` : undefined,
          }}
        >
          <span
            className="mono text-[11px] font-bold rounded px-2 py-1 shrink-0"
            style={{
              color: f.deadlock ? C_RED : f.done ? C_GREEN : "#8a97a8",
              background: f.deadlock ? `${C_RED}1a` : f.done ? `${C_GREEN}1a` : "#10151d",
              border: `1px solid ${f.deadlock ? C_RED : f.done ? C_GREEN : "#1e2630"}`,
            }}
          >
            {f.deadlock ? "DEADLOCK" : f.done ? "ALL DONE" : `STEP ${f.step + 1}`}
          </span>
          <p className="text-sm text-text">{f.label}</p>
        </div>

        {/* ---- transport controls ---- */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => { setAuto(false); setStep((s) => Math.max(0, s - 1)); }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            prev
          </button>
          <div className="flex gap-1">
            {frames.map((fr, i) => (
              <button
                key={i}
                aria-label={`step ${i + 1}`}
                onClick={() => { setAuto(false); setStep(i); }}
                className="h-1.5 w-6 rounded-full transition-all"
                style={{
                  background:
                    i === step
                      ? fr.deadlock
                        ? C_RED
                        : fr.done
                        ? C_GREEN
                        : "#d6dee8"
                      : "#1e2630",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => { setAuto(false); setStep((s) => Math.min(last, s + 1)); }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            next
          </button>
          <button
            onClick={() => setAuto((a) => !a)}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text ml-1"
          >
            {auto ? "❚❚ pause" : "▶ play"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Deadlock needs a cycle of holders waiting on each other. Force every thread to grab locks in one global order and the cycle can&apos;t close.
      </p>
    </div>
  );
}

/* ---- thread row: code steps + held / waiting badges ---- */
function ThreadRow({
  name,
  color,
  code,
  holds,
  waiting,
}: {
  name: string;
  color: string;
  code: string[];
  holds: [boolean, boolean];
  waiting: "L1" | "L2" | null;
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="mono text-xs font-bold" style={{ color }}>{name}</span>
        {waiting ? (
          <span className="mono text-[10px] rounded px-1.5 py-0.5" style={{ color: C_RED, background: `${C_RED}1a`, border: `1px solid ${C_RED}55` }}>
            BLOCKED · waiting {waiting}
          </span>
        ) : (
          <span className="mono text-[10px] text-faint">running</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {code.map((line, i) => {
          // light up the lock() steps the thread currently holds
          const isHeld = (i === 0 && holds[0]) || (i === 1 && holds[1]);
          return (
            <span
              key={i}
              className="mono text-[10px] rounded px-1.5 py-0.5"
              style={{
                background: isHeld ? `${color}26` : "#10151d",
                border: `1px solid ${isHeld ? color : "#1e2630"}`,
                color: isHeld ? color : "#5b6b7d",
              }}
            >
              {line}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---- a physical lock and who owns it ---- */
function LockChip({ name, hold }: { name: string; hold: Hold }) {
  const c = holdColor(hold);
  const owned = hold !== "free";
  return (
    <div
      className="grid place-items-center rounded-lg px-4 py-2 transition-all"
      style={{
        background: owned ? `${c}1a` : "#10151d",
        border: `1px solid ${owned ? c : "#1e2630"}`,
        minWidth: 86,
      }}
    >
      <span className="mono text-xs font-bold" style={{ color: owned ? c : "#8a97a8" }}>{name}</span>
      <span className="mono text-[10px]" style={{ color: owned ? c : "#5b6b7d" }}>
        {owned ? `held by ${hold}` : "free"}
      </span>
    </div>
  );
}

/* ---- wait-for graph node ---- */
function Node({
  x,
  y,
  r,
  color,
  label,
  blocked,
  cycle,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  label: string;
  blocked: boolean;
  cycle: boolean;
}) {
  const ring = cycle ? C_RED : blocked ? color : "#1e2630";
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`${color}1a`} stroke={ring} strokeWidth={cycle ? 2.6 : 1.6} />
      <text x={x} y={y + 5} textAnchor="middle" className="mono" fontSize="15" fontWeight="700" fill={color}>
        {label}
      </text>
    </g>
  );
}