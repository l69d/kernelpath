"use client";

import { useEffect, useMemo, useState } from "react";

/* t4-06 — Synchronization: Locks, Mutexes, Semaphores
 * Two threads each run: READ balance -> ADD 100 -> WRITE balance.
 * MUTEX mode: a lock serializes the critical section (correct result, 200).
 * RACE mode:  the same steps interleave with no lock (lost update, 100).
 * Both schedules are fully deterministic and replayable.
 */

type Op = "lock" | "read" | "add" | "write" | "unlock" | "wait";
type Owner = "T1" | "T2";

interface Step {
  who: Owner;
  op: Op;
  label: string;
}

const CYAN = "#39c5e0";
const PURPLE = "#bc8cff";
const GREEN = "#3fb950";
const GREENB = "#56d364";
const RED = "#f85149";
const AMBER = "#e3a93c";
const SURFACE = "#10151d";
const BORDER = "#1e2630";

const C: Record<Owner, string> = { T1: CYAN, T2: PURPLE };

// Critical-section body for one thread (no lock ops).
function body(who: Owner): Step[] {
  return [
    { who, op: "read", label: "reg = balance" },
    { who, op: "add", label: "reg = reg + 100" },
    { who, op: "write", label: "balance = reg" },
  ];
}

// MUTEX schedule: T2 tries to lock while T1 holds it -> T2 blocks, then runs.
const MUTEX_STEPS: Step[] = [
  { who: "T1", op: "lock", label: "lock(m)  // acquired" },
  ...body("T1"),
  { who: "T2", op: "wait", label: "lock(m)  // BLOCKED" },
  { who: "T1", op: "unlock", label: "unlock(m)" },
  { who: "T2", op: "lock", label: "lock(m)  // acquired" },
  ...body("T2"),
  { who: "T2", op: "unlock", label: "unlock(m)" },
];

// RACE schedule: both interleave their read/add/write -> lost update.
const RACE_STEPS: Step[] = [
  { who: "T1", op: "read", label: "reg1 = balance" },
  { who: "T2", op: "read", label: "reg2 = balance" },
  { who: "T1", op: "add", label: "reg1 = reg1 + 100" },
  { who: "T2", op: "add", label: "reg2 = reg2 + 100" },
  { who: "T1", op: "write", label: "balance = reg1" },
  { who: "T2", op: "write", label: "balance = reg2" },
];

interface World {
  balance: number;
  reg: Record<Owner, number>;
  holder: Owner | null;
  blocked: Owner | null;
  inside: Owner | null; // who is currently inside the critical section
  violated: boolean; // did two threads ever overlap inside?
}

// Replay the first n steps deterministically and return the resulting world.
function simulate(steps: Step[], n: number, guarded: boolean): World {
  const w: World = {
    balance: 0,
    reg: { T1: 0, T2: 0 },
    holder: null,
    blocked: null,
    inside: null,
    violated: false,
  };
  const active = new Set<Owner>();
  for (let i = 0; i < n; i++) {
    const s = steps[i];
    switch (s.op) {
      case "lock":
        w.holder = s.who;
        w.blocked = null;
        break;
      case "wait":
        w.blocked = s.who;
        break;
      case "unlock":
        active.delete(s.who);
        w.holder = null;
        break;
      case "read":
        w.reg[s.who] = w.balance;
        active.add(s.who);
        break;
      case "add":
        w.reg[s.who] = w.reg[s.who] + 100;
        break;
      case "write":
        w.balance = w.reg[s.who];
        if (!guarded) active.delete(s.who);
        break;
    }
    if (active.size > 1) w.violated = true;
    w.inside = active.size === 1 ? [...active][0] : null;
  }
  return w;
}

export default function MutexViz() {
  const [guarded, setGuarded] = useState(true);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  const steps = guarded ? MUTEX_STEPS : RACE_STEPS;
  const maxStep = steps.length;

  // Reset when switching mode.
  useEffect(() => {
    setStep(0);
    setPlaying(true);
  }, [guarded]);

  // Auto-advance, then pause at the end.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 950);
    return () => clearInterval(t);
  }, [playing, maxStep]);

  const world = useMemo(() => simulate(steps, step, guarded), [steps, step, guarded]);
  const done = step >= maxStep;
  const correct = world.balance === 200;

  const lockColor = world.holder ? C[world.holder] : world.blocked ? AMBER : GREEN;
  const lockText = world.holder
    ? `HELD by ${world.holder}`
    : guarded
      ? "FREE"
      : "no lock";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* mode toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {([true, false] as const).map((g) => (
            <button
              key={String(g)}
              onClick={() => setGuarded(g)}
              className="mono text-[11px] font-bold rounded px-3 py-1.5 transition-all"
              style={{
                background: guarded === g ? (g ? GREEN : RED) : SURFACE,
                border: `1px solid ${guarded === g ? (g ? GREEN : RED) : BORDER}`,
                color: guarded === g ? "#06121a" : "#8a97a8",
              }}
            >
              {g ? "🔒 mutex (guarded)" : "⚠ race (no lock)"}
            </button>
          ))}
        </div>

        {/* threads + lock + shared memory */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
          <Lane owner="T1" world={world} steps={steps} step={step} />

          <div className="flex flex-col items-center justify-center gap-3 px-1">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">mutex</div>
            <div
              className="grid place-items-center rounded-full transition-all"
              style={{
                width: 64,
                height: 64,
                border: `2px solid ${lockColor}`,
                background: `${lockColor}1a`,
                boxShadow: `0 0 22px -6px ${lockColor}`,
              }}
            >
              <span className="text-2xl">{world.holder ? "🔒" : guarded ? "🔓" : "∅"}</span>
            </div>
            <div className="mono text-[10px] text-center" style={{ color: lockColor }}>
              {lockText}
            </div>

            {/* shared balance */}
            <div className="card px-3 py-2 text-center mt-1">
              <div className="mono text-[9px] uppercase tracking-widest text-faint">balance</div>
              <div
                className="mono text-lg font-bold"
                style={{ color: world.inside ? C[world.inside] : "#d6dee8" }}
              >
                {world.balance}
              </div>
            </div>
          </div>

          <Lane owner="T2" world={world} steps={steps} step={step} />
        </div>

        {/* readout */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <Readout label="inside CS" value={world.inside ?? "—"} color={world.inside ? C[world.inside] : "#5b6b7d"} />
          <Readout
            label={guarded ? "blocked" : "overlap"}
            value={guarded ? (world.blocked ?? "—") : world.violated ? "YES" : "no"}
            color={guarded ? (world.blocked ? AMBER : "#5b6b7d") : world.violated ? RED : "#5b6b7d"}
          />
          <Readout
            label="final balance"
            value={done ? String(world.balance) : "…"}
            color={done ? (correct ? GREENB : RED) : "#5b6b7d"}
          />
        </div>

        {/* verdict */}
        <div
          className="card mt-3 p-3 text-center min-h-[44px] flex items-center justify-center"
          style={{ borderColor: done ? (correct ? GREEN : RED) : BORDER }}
        >
          <p className="text-sm" style={{ color: done ? (correct ? GREENB : RED) : "#8a97a8" }}>
            {!done
              ? guarded
                ? "Only one thread may hold the lock — the other waits its turn."
                : "Both threads barge into the critical section at once. Watch the shared balance…"
              : correct
                ? "✓ Two +100 deposits → balance 200. Mutual exclusion kept the critical section serialized."
                : "✗ Lost update — both read 0, both wrote 100. One deposit vanished. This is a data race."}
          </p>
        </div>

        {/* controls */}
        <div className="mt-4 space-y-3">
          <input
            type="range"
            min={0}
            max={maxStep}
            value={step}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.target.value));
            }}
            className="w-full accent-[#3fb950]"
          />
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.max(0, s - 1));
              }}
              className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              prev
            </button>
            <button
              onClick={() => {
                if (done) {
                  setStep(0);
                  setPlaying(true);
                } else {
                  setPlaying((p) => !p);
                }
              }}
              className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              {done ? "↻ replay" : playing ? "❚❚ pause" : "▶ play"}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setStep((s) => Math.min(maxStep, s + 1));
              }}
              className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              next
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Each thread does read → +100 → write. The mutex forces these to run one-at-a-time; without it, the reads interleave and a deposit is lost.
      </p>
    </div>
  );
}

function Lane({
  owner,
  world,
  steps,
  step,
}: {
  owner: Owner;
  world: World;
  steps: Step[];
  step: number;
}) {
  const color = C[owner];
  const lastIdx = step - 1;
  const current = step > 0 && lastIdx < steps.length ? steps[lastIdx] : null;
  const isActing = current?.who === owner;
  const inside = world.inside === owner;
  const blocked = world.blocked === owner;

  const state = blocked ? "BLOCKED" : inside ? "in critical section" : "running";
  const stateColor = blocked ? AMBER : inside ? color : "#5b6b7d";

  // The lines of this thread's program, with the current one highlighted.
  const lines = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.who === owner);

  return (
    <div
      className="rounded-lg p-3 transition-all"
      style={{
        background: isActing ? `${color}14` : SURFACE,
        border: `1px solid ${isActing ? color : BORDER}`,
        boxShadow: isActing ? `0 0 20px -8px ${color}` : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="mono text-xs font-bold" style={{ color }}>
          {owner}
        </span>
        <span className="mono text-[10px]" style={{ color: stateColor }}>
          {state}
        </span>
      </div>
      <div className="space-y-1">
        {lines.map(({ s, i }) => {
          const isNow = i === lastIdx;
          const past = i < lastIdx;
          return (
            <div
              key={i}
              className="mono text-[10.5px] rounded px-2 py-1 transition-all"
              style={{
                background: isNow ? color : past ? `${color}14` : "transparent",
                color: isNow ? "#06121a" : past ? color : "#5b6b7d",
                border: `1px solid ${isNow ? color : "transparent"}`,
                fontWeight: isNow ? 700 : 400,
              }}
            >
              {s.label}
            </div>
          );
        })}
      </div>
      <div className="mono text-[10px] mt-2 text-faint">
        reg = <span style={{ color }}>{world.reg[owner]}</span>
      </div>
    </div>
  );
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
