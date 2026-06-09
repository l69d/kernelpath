"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs8-06 — Transactions & ACID: Isolation made tangible.
 *  Two concurrent transactions read/write one shared account balance.
 *  Interleaved (low isolation) → a lost update gives a WRONG total.
 *  Serialised → each runs to completion → the CORRECT total.
 * ================================================================== */

type Actor = "A" | "B" | "DB";

interface Op {
  actor: Actor;
  /** human label shown in the step row */
  label: string;
  /** mutate the world: returns the new shared balance + each txn's local read */
  run: (w: World) => World;
}

interface World {
  db: number; // committed shared balance
  localA: number | null; // value txn A read into its register
  localB: number | null; // value txn B read into its register
}

const START = 100;
const DEPOSIT_A = 50; // A adds 50
const WITHDRAW_B = 30; // B subtracts 30
const CORRECT = START + DEPOSIT_A - WITHDRAW_B; // 120

// Interleaved schedule (lost update): both read 100, then both write back.
const INTERLEAVED: Op[] = [
  { actor: "A", label: "A: read balance", run: (w) => ({ ...w, localA: w.db }) },
  { actor: "B", label: "B: read balance", run: (w) => ({ ...w, localB: w.db }) },
  {
    actor: "A",
    label: `A: write balance + ${DEPOSIT_A}`,
    run: (w) => ({ ...w, db: (w.localA ?? w.db) + DEPOSIT_A }),
  },
  {
    actor: "B",
    label: `B: write balance − ${WITHDRAW_B}`,
    run: (w) => ({ ...w, db: (w.localB ?? w.db) - WITHDRAW_B }),
  },
];

// Serialised schedule: A fully commits, then B reads the fresh value.
const SERIAL: Op[] = [
  { actor: "A", label: "A: read balance", run: (w) => ({ ...w, localA: w.db }) },
  {
    actor: "A",
    label: `A: write balance + ${DEPOSIT_A}`,
    run: (w) => ({ ...w, db: (w.localA ?? w.db) + DEPOSIT_A }),
  },
  { actor: "B", label: "B: read balance", run: (w) => ({ ...w, localB: w.db }) },
  {
    actor: "B",
    label: `B: write balance − ${WITHDRAW_B}`,
    run: (w) => ({ ...w, db: (w.localB ?? w.db) - WITHDRAW_B }),
  },
];

const C = {
  green: "#3fb950",
  greenBright: "#56d364",
  cyan: "#39c5e0",
  purple: "#bc8cff",
  amber: "#e3a93c",
  red: "#f85149",
  faint: "#5b6b7d",
  border: "#1e2630",
  surface: "#10151d",
  ink: "#06121a",
};

const ACTOR_COLOR: Record<Actor, string> = {
  A: C.cyan,
  B: C.purple,
  DB: C.green,
};

function run(schedule: Op[], upto: number): World {
  let w: World = { db: START, localA: null, localB: null };
  for (let i = 0; i < upto; i++) w = schedule[i].run(w);
  return w;
}

export default function AcidViz() {
  const [serialised, setSerialised] = useState(false);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  const schedule = serialised ? SERIAL : INTERLEAVED;
  const total = schedule.length;

  // auto-advance the interleaving; pause when finished
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setStep((s) => (s >= total ? total : s + 1));
    }, 1100);
    return () => clearInterval(t);
  }, [auto, total]);

  // when finished, stop the clock so the result is readable
  useEffect(() => {
    if (step >= total) setAuto(false);
  }, [step, total]);

  const world = useMemo(() => run(schedule, step), [schedule, step]);
  const done = step >= total;
  const wrong = !serialised && done && world.db !== CORRECT;

  const reset = (toSerial: boolean) => {
    setSerialised(toSerial);
    setStep(0);
    setAuto(true);
  };

  const activeActor: Actor | null = step > 0 && step <= total ? schedule[step - 1].actor : null;

  return (
    <div className="card p-5 grid-bg">
      {/* mode toggle */}
      <div className="flex items-center justify-center gap-2 pb-4">
        {[
          { on: false, k: "READ UNCOMMITTED", sub: "concurrent · interleaved" },
          { on: true, k: "SERIALISABLE", sub: "isolated · one-at-a-time" },
        ].map((m) => {
          const sel = serialised === m.on;
          const col = m.on ? C.green : C.amber;
          return (
            <button
              key={m.k}
              onClick={() => reset(m.on)}
              className="rounded-lg px-4 py-2 transition-all"
              style={{
                background: sel ? col : C.surface,
                border: `1px solid ${sel ? col : C.border}`,
                color: sel ? C.ink : C.faint,
                boxShadow: sel ? `0 0 22px -6px ${col}` : undefined,
              }}
            >
              <div className="mono text-[11px] font-bold">{m.k}</div>
              <div className="mono text-[9px] opacity-80">{m.sub}</div>
            </button>
          );
        })}
      </div>

      {/* the two transactions + shared cell */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <Lane title="Txn A — deposit +50" actor="A" local={world.localA} active={activeActor === "A"} />

        {/* shared DB cell */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="mono text-[10px] uppercase tracking-widest text-faint">shared row</div>
          <div
            className="grid place-items-center rounded-lg transition-all"
            style={{
              width: 92,
              height: 92,
              background: `${ACTOR_COLOR.DB}14`,
              border: `1px solid ${activeActor === "DB" ? C.green : C.border}`,
              boxShadow: activeActor === "DB" ? `0 0 22px -6px ${C.green}` : undefined,
            }}
          >
            <span className="mono text-2xl font-bold" style={{ color: wrong ? C.red : C.greenBright }}>
              {world.db}
            </span>
          </div>
          <div className="mono text-[9px] text-faint">accounts.balance</div>
        </div>

        <Lane title="Txn B — withdraw −30" actor="B" local={world.localB} active={activeActor === "B"} />
      </div>

      {/* schedule / step trace */}
      <div className="card mt-4 p-3">
        <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
          schedule · operation {Math.min(step, total)} / {total}
        </div>
        <div className="space-y-1">
          {schedule.map((op, i) => {
            const reached = i < step;
            const isNow = i === step - 1;
            const col = ACTOR_COLOR[op.actor];
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded px-2 py-1 transition-all"
                style={{
                  background: isNow ? `${col}1a` : "transparent",
                  border: `1px solid ${isNow ? col : "transparent"}`,
                  opacity: reached ? 1 : 0.35,
                }}
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded mono text-[10px] font-bold"
                  style={{ background: reached ? col : C.surface, color: reached ? C.ink : C.faint }}
                >
                  {op.actor}
                </span>
                <span className="mono text-xs" style={{ color: isNow ? col : reached ? "#d6dee8" : C.faint }}>
                  {op.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* verdict */}
      <div
        className="card mt-3 p-3 flex items-center justify-between gap-3 transition-all"
        style={{ borderColor: done ? (wrong ? C.red : C.green) : C.border }}
      >
        <div>
          <div className="mono text-[10px] uppercase tracking-widest text-faint">expected</div>
          <div className="mono text-sm font-bold" style={{ color: C.greenBright }}>
            {START} + {DEPOSIT_A} − {WITHDRAW_B} = {CORRECT}
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[10px] uppercase tracking-widest text-faint">final balance</div>
          <div className="mono text-sm font-bold" style={{ color: !done ? C.faint : wrong ? C.red : C.green }}>
            {done ? world.db : "…"}{" "}
            {done && (wrong ? "✗ lost update" : "✓ consistent")}
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            setAuto(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          prev
        </button>
        <button
          onClick={() => setAuto((a) => !a)}
          className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          {auto ? "❚❚ pause" : done ? "↻ replay" : "▶ play"}
          {done && auto === false ? "" : ""}
        </button>
        <button
          onClick={() => {
            setAuto(false);
            setStep((s) => Math.min(total, s + 1));
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          next
        </button>
        <button
          onClick={() => {
            setStep(0);
            setAuto(true);
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          reset
        </button>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Interleaved: both read {START} before either writes — B&apos;s write clobbers A&apos;s. <b className="text-text">Isolation</b> makes
        concurrent txns behave as if run one after another.
      </p>
    </div>
  );
}

function Lane({
  title,
  actor,
  local,
  active,
}: {
  title: string;
  actor: Actor;
  local: number | null;
  active: boolean;
}) {
  const col = ACTOR_COLOR[actor];
  return (
    <div
      className="rounded-lg p-3 text-center transition-all"
      style={{
        background: active ? `${col}14` : C.surface,
        border: `1px solid ${active ? col : C.border}`,
        boxShadow: active ? `0 0 20px -8px ${col}` : undefined,
      }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: col, opacity: active ? 1 : 0.4 }}
        />
        <span className="mono text-[11px] font-bold" style={{ color: col }}>
          {title}
        </span>
      </div>
      <div className="mono text-[10px] uppercase tracking-widest text-faint">local register</div>
      <div className="mono text-xl font-bold mt-0.5" style={{ color: local === null ? C.faint : col }}>
        {local === null ? "—" : local}
      </div>
    </div>
  );
}
