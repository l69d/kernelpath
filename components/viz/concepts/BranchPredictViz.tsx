"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  t2-05 — Hazards & Branch Prediction
 *  A 5-stage pipeline meets a loop branch. A 2-bit saturating counter
 *  predicts taken/not-taken; correct predictions flow smoothly, a
 *  misprediction FLUSHES the in-flight instructions (bubble cycles).
 *  Step the loop and watch the predictor learn the pattern.
 * ================================================================== */

const STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;

// 2-bit counter states. 0,1 -> predict NOT-taken | 2,3 -> predict TAKEN
const SC_NAMES = ["Strong N", "Weak N", "Weak T", "Strong T"] as const;
const SC_COLORS = ["#f85149", "#e3a93c", "#39c5e0", "#3fb950"] as const;

// Loop branch: TAKEN while looping, NOT-TAKEN on the exit iteration.
const LOOP_LEN = 4; // taken, taken, taken, not-taken(exit) — repeats
const actualTaken = (i: number): boolean => i % LOOP_LEN !== LOOP_LEN - 1;

const MISS_PENALTY = 2; // bubble cycles flushed on a misprediction

type StepRec = {
  i: number;
  taken: boolean;
  predTaken: boolean;
  hit: boolean;
  stateBefore: number;
  stateAfter: number;
};

function simulate(n: number): StepRec[] {
  const recs: StepRec[] = [];
  let state = 1; // start Weak-Not-taken (cold predictor)
  for (let i = 0; i < n; i++) {
    const taken = actualTaken(i);
    const predTaken = state >= 2;
    const stateBefore = state;
    const hit = predTaken === taken;
    state = taken ? Math.min(3, state + 1) : Math.max(0, state - 1);
    recs.push({ i, taken, predTaken, hit, stateBefore, stateAfter: state });
  }
  return recs;
}

const TOTAL_STEPS = 12;

export default function BranchPredictViz() {
  const [step, setStep] = useState(0); // index into recs (0..TOTAL_STEPS-1)
  const [auto, setAuto] = useState(true);

  const recs = useMemo(() => simulate(TOTAL_STEPS), []);
  const cur = recs[step];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % TOTAL_STEPS), 1300);
    return () => clearInterval(t);
  }, [auto]);

  // running tallies up to and including the current step
  const seen = recs.slice(0, step + 1);
  const misses = seen.filter((r) => !r.hit).length;
  const wasted = misses * MISS_PENALTY;
  const acc = Math.round(((seen.length - misses) / seen.length) * 100);

  // Pipeline lanes: the branch resolves in EX. On a miss, the two
  // instructions fetched behind it (in IF/ID) get flushed as bubbles.
  const flushed = !cur.hit;
  const lanes = [
    { label: "branch", stage: 2, kind: "branch" as const },
    { label: flushed ? "flush" : "next+1", stage: 1, kind: flushed ? ("bubble" as const) : ("ok" as const) },
    { label: flushed ? "flush" : "next+2", stage: 0, kind: flushed ? ("bubble" as const) : ("ok" as const) },
  ];

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* ---- predictor + outcome readouts ---- */}
        <div className="grid gap-3 py-1 md:grid-cols-[1.1fr_1fr]">
          {/* 2-bit saturating counter */}
          <div className="card p-3">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
              2-bit saturating counter
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {SC_NAMES.map((nm, idx) => {
                const active = cur.stateBefore === idx;
                return (
                  <div key={nm} className="flex items-center">
                    <div
                      className="grid place-items-center rounded-lg px-2.5 py-2 transition-all"
                      style={{
                        width: 64,
                        background: active ? SC_COLORS[idx] : "#10151d",
                        border: `1px solid ${active ? SC_COLORS[idx] : "#1e2630"}`,
                        color: active ? "#06121a" : "#5b6b7d",
                        boxShadow: active ? `0 0 20px -6px ${SC_COLORS[idx]}` : undefined,
                      }}
                    >
                      <div className="text-center">
                        <div className="mono text-[10px] font-bold leading-none">{nm}</div>
                        <div className="mono text-[9px] mt-0.5 opacity-80">{idx.toString(2).padStart(2, "0")}</div>
                      </div>
                    </div>
                    {idx < SC_NAMES.length - 1 && <span className="mx-0.5 text-faint text-xs">·</span>}
                  </div>
                );
              })}
            </div>
            <div className="mono text-[10px] text-center mt-2 text-faint">
              predicts{" "}
              <span style={{ color: cur.predTaken ? "#3fb950" : "#f85149" }} className="font-bold">
                {cur.predTaken ? "TAKEN ↺" : "NOT-TAKEN →"}
              </span>
              {"  "}·{"  "}counter {cur.taken ? "+1 (branch taken)" : "−1 (fell through)"}
            </div>
          </div>

          {/* outcome */}
          <div
            className="card p-3 flex flex-col items-center justify-center transition-all"
            style={{
              borderColor: cur.hit ? "#3fb950" : "#f85149",
              boxShadow: `0 0 22px -10px ${cur.hit ? "#3fb950" : "#f85149"}`,
            }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              iter {cur.i} · actual: {cur.taken ? "TAKEN" : "NOT-TAKEN"}
            </div>
            <div className="mono text-2xl font-bold mt-1" style={{ color: cur.hit ? "#56d364" : "#f85149" }}>
              {cur.hit ? "✓ HIT" : "✗ MISPREDICT"}
            </div>
            <div className="mono text-[10px] text-muted mt-1">
              {cur.hit ? "pipeline flows — 0 lost cycles" : `flush → ${MISS_PENALTY} bubble cycles wasted`}
            </div>
          </div>
        </div>

        {/* ---- pipeline lanes (flush visual) ---- */}
        <div className="card p-3 mt-3">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
            pipeline · branch resolves in EX
          </div>
          <div className="space-y-1.5">
            {lanes.map((lane, li) => (
              <div key={li} className="grid items-center gap-1" style={{ gridTemplateColumns: `58px repeat(5, 1fr)` }}>
                <div
                  className="mono text-[10px] font-bold"
                  style={{
                    color: lane.kind === "bubble" ? "#f85149" : lane.kind === "branch" ? "#bc8cff" : "#39c5e0",
                  }}
                >
                  {lane.label}
                </div>
                {STAGES.map((s, si) => {
                  const here = si === lane.stage;
                  const isBubble = here && lane.kind === "bubble";
                  const base =
                    lane.kind === "branch" ? "#bc8cff" : lane.kind === "bubble" ? "#f85149" : "#39c5e0";
                  return (
                    <div
                      key={s}
                      className="grid place-items-center rounded mono text-[10px] h-7 transition-all"
                      style={{
                        background: here ? (isBubble ? "#f8514922" : base) : "transparent",
                        border: here
                          ? `1px solid ${base}`
                          : "1px dashed #1e2630",
                        color: here ? (isBubble ? "#f85149" : "#06121a") : "#5b6b7d",
                        fontWeight: here ? 700 : 400,
                      }}
                    >
                      {here ? (isBubble ? "✗" : s) : s}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ---- running scoreboard ---- */}
        <div className="grid grid-cols-3 gap-3 mt-3 text-center">
          <Stat label="accuracy" value={`${acc}%`} color={acc >= 80 ? "#3fb950" : acc >= 50 ? "#e3a93c" : "#f85149"} />
          <Stat label="mispredicts" value={`${misses}`} color="#f85149" />
          <Stat label="cycles wasted" value={`${wasted}`} color="#bc8cff" />
        </div>

        {/* ---- transport ---- */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => (s - 1 + TOTAL_STEPS) % TOTAL_STEPS);
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            prev
          </button>
          <button
            onClick={() => setAuto((a) => !a)}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            {auto ? "❚❚ pause" : "▶ play"}
          </button>
          <div className="flex gap-1">
            {recs.map((r, i) => (
              <span
                key={i}
                className="h-1.5 w-3.5 rounded-full transition-all"
                style={{
                  background:
                    i === step ? "#d6dee8" : i < step ? (r.hit ? "#3fb950" : "#f85149") : "#1e2630",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => (s + 1) % TOTAL_STEPS);
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            next
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Loop runs {LOOP_LEN - 1}× then exits. After one warm-up miss the counter saturates at{" "}
        <span className="text-green">Strong T</span> — only the loop-exit mispredicts, and one stray exit can&apos;t flip it.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
