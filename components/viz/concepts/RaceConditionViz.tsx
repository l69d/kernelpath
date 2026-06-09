"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  t4-03 — Threads & Concurrency: the lost update.
 *  Two threads each run LOAD / INCR / STORE on one shared counter.
 *  Pick an interleaving and step it; a bad schedule loses an update
 *  (counter ends at 1), a serial one reaches 2.
 * ================================================================== */

const T1 = "#39c5e0"; // cyan  — thread A
const T2 = "#bc8cff"; // purple — thread B
const GREEN = "#3fb950";
const RED = "#f85149";
const AMBER = "#e3a93c";

type Op = "load" | "incr" | "store";
const OPS: Op[] = ["load", "incr", "store"];

type Step = { t: 0 | 1 }; // which thread takes its next micro-op

// A schedule is the order in which the 6 micro-ops fire (3 per thread).
type Preset = { id: string; label: string; steps: Step[]; bad: boolean };

const PRESETS: Preset[] = [
  {
    id: "race",
    label: "Race (lost update)",
    bad: true,
    // A.load, B.load, A.incr, A.store, B.incr, B.store  → ends at 1
    steps: [{ t: 0 }, { t: 1 }, { t: 0 }, { t: 0 }, { t: 1 }, { t: 1 }],
  },
  {
    id: "race2",
    label: "Race (interleaved)",
    bad: true,
    // A.load, B.load, B.incr, B.store, A.incr, A.store  → ends at 1
    steps: [{ t: 0 }, { t: 1 }, { t: 1 }, { t: 1 }, { t: 0 }, { t: 0 }],
  },
  {
    id: "serialA",
    label: "Serial (A then B)",
    bad: false,
    // A runs fully, then B runs fully → ends at 2
    steps: [{ t: 0 }, { t: 0 }, { t: 0 }, { t: 1 }, { t: 1 }, { t: 1 }],
  },
  {
    id: "serialB",
    label: "Serial (B then A)",
    bad: false,
    steps: [{ t: 1 }, { t: 1 }, { t: 1 }, { t: 0 }, { t: 0 }, { t: 0 }],
  },
];

type Frame = {
  counter: number;
  reg: [number | null, number | null]; // private register per thread
  prog: [number, number]; // next micro-op index per thread (0..3)
  acting: 0 | 1 | null;
  op: Op | null;
  note: string;
};

// Deterministic simulator: replay `steps[0..n]` from a zeroed counter.
function simulate(steps: Step[], n: number): Frame {
  let counter = 0;
  const reg: [number | null, number | null] = [null, null];
  const prog: [number, number] = [0, 0];
  let acting: 0 | 1 | null = null;
  let op: Op | null = null;
  let note = "Counter = 0. Both threads are about to run counter++.";

  for (let i = 0; i < n; i++) {
    const t = steps[i].t;
    const stage = prog[t] as 0 | 1 | 2;
    op = OPS[stage];
    acting = t;
    const name = t === 0 ? "T1" : "T2";
    if (op === "load") {
      reg[t] = counter;
      note = `${name} LOAD: reads counter (${counter}) into its private register.`;
    } else if (op === "incr") {
      reg[t] = (reg[t] ?? 0) + 1;
      note = `${name} INCR: adds 1 in its register → ${reg[t]} (counter untouched).`;
    } else {
      counter = reg[t] ?? counter;
      note = `${name} STORE: writes its register (${reg[t]}) back to counter → ${counter}.`;
    }
    prog[t] = stage + 1;
  }
  return { counter, reg, prog, acting, op, note };
}

export default function RaceConditionViz() {
  const [presetId, setPresetId] = useState<string>("race");
  const [n, setN] = useState(0); // how many micro-ops have fired
  const [playing, setPlaying] = useState(false);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0],
    [presetId],
  );
  const total = preset.steps.length;
  const frame = useMemo(() => simulate(preset.steps, n), [preset, n]);
  const done = n >= total;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setN((cur) => {
        if (cur >= total) {
          setPlaying(false);
          return cur;
        }
        return cur + 1;
      });
    }, 750);
    return () => clearInterval(id);
  }, [playing, total]);

  const pick = (id: string) => {
    setPresetId(id);
    setN(0);
    setPlaying(false);
  };

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* schedule chooser */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
          {PRESETS.map((p) => {
            const sel = p.id === presetId;
            const c = p.bad ? RED : GREEN;
            return (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                className="mono text-[11px] rounded px-2.5 py-1 transition-all"
                style={{
                  background: sel ? c : "#10151d",
                  color: sel ? "#06121a" : "#8a97a8",
                  border: `1px solid ${sel ? c : "#1e2630"}`,
                  fontWeight: sel ? 700 : 400,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* the two threads + shared counter */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
          <ThreadCard
            name="T1"
            color={T1}
            reg={frame.reg[0]}
            prog={frame.prog[0]}
            acting={frame.acting === 0}
          />

          {/* shared counter in the middle */}
          <div className="grid place-items-center">
            <div
              className="card grid place-items-center px-4 py-3 transition-all"
              style={{
                borderColor:
                  done && (frame.counter === 2 ? GREEN : RED) || "#1e2630",
                boxShadow:
                  done
                    ? `0 0 26px -6px ${frame.counter === 2 ? GREEN : RED}`
                    : frame.op === "store"
                    ? `0 0 22px -6px ${AMBER}`
                    : undefined,
              }}
            >
              <div className="mono text-[9px] uppercase tracking-widest text-faint text-center">
                shared
                <br />
                counter
              </div>
              <div
                className="mono text-3xl font-bold mt-1"
                style={{
                  color: frame.op === "store" ? AMBER : "#d6dee8",
                }}
              >
                {frame.counter}
              </div>
            </div>
            <div className="mono text-[10px] text-faint mt-1">in memory</div>
          </div>

          <ThreadCard
            name="T2"
            color={T2}
            reg={frame.reg[1]}
            prog={frame.prog[1]}
            acting={frame.acting === 1}
          />
        </div>

        {/* schedule timeline */}
        <div className="mt-4">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1 text-center">
            schedule (fired left → right)
          </div>
          <div className="flex justify-center gap-1 flex-wrap">
            {preset.steps.map((s, i) => {
              const fired = i < n;
              const c = s.t === 0 ? T1 : T2;
              const stage = countStage(preset.steps, i);
              return (
                <span
                  key={i}
                  className="mono text-[10px] rounded px-1.5 py-0.5 transition-all"
                  style={{
                    background: fired ? c : "#10151d",
                    color: fired ? "#06121a" : "#5b6b7d",
                    border: `1px solid ${fired ? c : "#1e2630"}`,
                    opacity: i === n - 1 ? 1 : fired ? 0.78 : 1,
                    fontWeight: i === n - 1 ? 700 : 400,
                  }}
                >
                  {s.t === 0 ? "T1" : "T2"}.{OPS[stage]}
                </span>
              );
            })}
          </div>
        </div>

        {/* narration */}
        <div className="card mt-4 p-3 min-h-[48px] flex items-center">
          <p className="text-sm text-text">
            {done ? (
              <span>
                Final counter ={" "}
                <b
                  style={{ color: frame.counter === 2 ? GREEN : RED }}
                  className="mono"
                >
                  {frame.counter}
                </b>
                {frame.counter === 2 ? (
                  <span className="text-muted">
                    {" "}
                    — correct. Both increments landed.
                  </span>
                ) : (
                  <span className="text-muted">
                    {" "}
                    — <b style={{ color: RED }}>one update was lost.</b> T2 read
                    the counter before T1 stored, so T2 overwrote T1&apos;s
                    write with a stale value.
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted">{frame.note}</span>
            )}
          </p>
        </div>

        {/* transport */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setN(0);
              setPlaying(false);
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ⟲ reset
          </button>
          <button
            onClick={() => {
              if (done) return;
              setPlaying(false);
              setN((c) => Math.min(total, c + 1));
            }}
            disabled={done}
            className="mono text-xs rounded border border-border px-3 py-1"
            style={{ color: done ? "#5b6b7d" : "#d6dee8" }}
          >
            step ▸
          </button>
          <button
            onClick={() => {
              if (done) {
                setN(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className="mono text-xs rounded px-3 py-1"
            style={{
              background: playing ? "#161c26" : preset.bad ? RED : GREEN,
              color: playing ? "#8a97a8" : "#06121a",
              border: `1px solid ${playing ? "#1e2630" : preset.bad ? RED : GREEN}`,
            }}
          >
            {playing ? "❚❚ pause" : done ? "▶ replay" : "▶ play"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        counter++ is really three steps: load → increment → store. Interleave
        the loads and one update vanishes — the textbook race condition a mutex
        prevents.
      </p>
    </div>
  );
}

// stage index (0=load,1=incr,2=store) of step i within its own thread.
function countStage(steps: Step[], i: number): 0 | 1 | 2 {
  const t = steps[i].t;
  let count = 0;
  for (let j = 0; j < i; j++) if (steps[j].t === t) count++;
  return count as 0 | 1 | 2;
}

function ThreadCard({
  name,
  color,
  reg,
  prog,
  acting,
}: {
  name: string;
  color: string;
  reg: number | null;
  prog: number;
  acting: boolean;
}) {
  return (
    <div
      className="card p-3 transition-all"
      style={{
        borderColor: acting ? color : "#1e2630",
        boxShadow: acting ? `0 0 22px -8px ${color}` : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="mono text-xs font-bold" style={{ color }}>
          {name}
        </span>
        <span className="mono text-[9px] uppercase tracking-widest text-faint">
          thread
        </span>
      </div>

      {/* the three micro-ops, highlight the one most recently run / next */}
      <div className="mt-2 space-y-1">
        {OPS.map((op, idx) => {
          const ran = idx < prog;
          const next = idx === prog;
          return (
            <div
              key={op}
              className="mono text-[11px] rounded px-2 py-1 flex items-center gap-2 transition-all"
              style={{
                background: ran ? `${color}22` : "#10151d",
                border: `1px solid ${
                  next && acting ? color : ran ? `${color}55` : "#1e2630"
                }`,
                color: ran ? color : "#5b6b7d",
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: ran ? color : "#1e2630" }}
              />
              {op}
            </div>
          );
        })}
      </div>

      {/* private register */}
      <div className="mt-2 flex items-center justify-between rounded px-2 py-1 border border-border bg-[#10151d]">
        <span className="mono text-[9px] uppercase tracking-widest text-faint">
          register
        </span>
        <span className="mono text-sm font-bold" style={{ color }}>
          {reg === null ? "—" : reg}
        </span>
      </div>
    </div>
  );
}
