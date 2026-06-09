"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ---- DFA model -------------------------------------------------------------

type Sym = "0" | "1";

interface DfaState {
  id: string;
  label: string;
  x: number;
  y: number;
  accepting: boolean;
}

interface Dfa {
  name: string;
  blurb: string;
  start: string;
  states: DfaState[];
  // transitions[stateId][symbol] -> next stateId
  delta: Record<string, Record<Sym, string>>;
}

const ALPHABET: Sym[] = ["0", "1"];

// (a) Binary number divisible by 3 (read MSB-first; remainder tracked mod 3).
const divBy3: Dfa = {
  name: "divisible by 3",
  blurb:
    "Reads the string as a binary number (most-significant bit first). Each state is the current value mod 3: r0, r1, r2. On bit b, the running value becomes 2·v + b, so the remainder updates accordingly. Accept when the remainder is 0.",
  start: "r0",
  states: [
    { id: "r0", label: "r0", x: 120, y: 130, accepting: true },
    { id: "r1", label: "r1", x: 330, y: 70, accepting: false },
    { id: "r2", label: "r2", x: 330, y: 200, accepting: false },
  ],
  delta: {
    r0: { "0": "r0", "1": "r1" },
    r1: { "0": "r2", "1": "r0" },
    r2: { "0": "r1", "1": "r2" },
  },
};

// (b) Strings ending in "01".
const endsIn01: Dfa = {
  name: "ends in 01",
  blurb:
    "Tracks how much of the suffix \"01\" we have matched. s0 = nothing pending, s1 = just saw a 0, s2 = saw \"01\". Only s2 accepts. A stray 1 from s0 stays in s0; a 0 always re-arms the pending zero.",
  start: "s0",
  states: [
    { id: "s0", label: "s0", x: 110, y: 135, accepting: false },
    { id: "s1", label: "s1", x: 280, y: 135, accepting: false },
    { id: "s2", label: "s2", x: 450, y: 135, accepting: true },
  ],
  delta: {
    s0: { "0": "s1", "1": "s0" },
    s1: { "0": "s1", "1": "s2" },
    s2: { "0": "s1", "1": "s0" },
  },
};

// (c) Even number of 1s.
const evenOnes: Dfa = {
  name: "even # of 1s",
  blurb:
    "Two states track the parity of how many 1s have been seen. Reading a 0 keeps the parity; reading a 1 flips it. The start state (even, count 0) is accepting, so the empty string is accepted.",
  start: "e",
  states: [
    { id: "e", label: "even", x: 160, y: 135, accepting: true },
    { id: "o", label: "odd", x: 400, y: 135, accepting: false },
  ],
  delta: {
    e: { "0": "e", "1": "o" },
    o: { "0": "o", "1": "e" },
  },
};

const PRESETS: Dfa[] = [divBy3, endsIn01, evenOnes];

// ---- geometry helpers ------------------------------------------------------

const R = 30; // state radius

interface Pt {
  x: number;
  y: number;
}

function stateById(dfa: Dfa, id: string): DfaState {
  // every transition target is guaranteed to exist in the presets above
  return dfa.states.find((s) => s.id === id) as DfaState;
}

// Edge between two distinct circles: returns a curved path + a point for its label.
function edgePath(a: Pt, b: Pt, curve: number): { d: string; mid: Pt } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // perpendicular for the control-point offset
  const px = -uy;
  const py = ux;
  // start/end trimmed to the circle edge
  const sx = a.x + ux * R;
  const sy = a.y + uy * R;
  const ex = b.x - ux * R;
  const ey = b.y - uy * R;
  const mx = (sx + ex) / 2 + px * curve;
  const my = (sy + ey) / 2 + py * curve;
  const d = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
  const mid: Pt = {
    x: (sx + ex) / 2 + px * curve * 0.55,
    y: (sy + ey) / 2 + py * curve * 0.55,
  };
  return { d, mid };
}

// Self-loop path sitting above a state.
function selfLoop(p: Pt): { d: string; mid: Pt } {
  const top = p.y - R;
  const d = `M ${p.x - 12} ${top} C ${p.x - 40} ${top - 50}, ${p.x + 40} ${
    top - 50
  }, ${p.x + 12} ${top}`;
  return { d, mid: { x: p.x, y: top - 42 } };
}

// ---- transition rendering --------------------------------------------------

interface RenderEdge {
  key: string;
  from: string;
  to: string;
  syms: Sym[];
  d: string;
  mid: Pt;
  self: boolean;
}

function buildEdges(dfa: Dfa): RenderEdge[] {
  // Group parallel transitions (same from->to) so we show one labelled arrow.
  const grouped = new Map<string, { from: string; to: string; syms: Sym[] }>();
  for (const st of dfa.states) {
    for (const sym of ALPHABET) {
      const to = dfa.delta[st.id][sym];
      const k = `${st.id}->${to}`;
      const g = grouped.get(k);
      if (g) g.syms.push(sym);
      else grouped.set(k, { from: st.id, to, syms: [sym] });
    }
  }

  // detect bidirectional pairs to bend opposing edges apart
  const has = (from: string, to: string) => grouped.has(`${from}->${to}`);

  const edges: RenderEdge[] = [];
  for (const [key, g] of grouped) {
    const a = stateById(dfa, g.from);
    const b = stateById(dfa, g.to);
    if (g.from === g.to) {
      const { d, mid } = selfLoop(a);
      edges.push({ key, from: g.from, to: g.to, syms: g.syms, d, mid, self: true });
      continue;
    }
    // if a reverse edge exists, curve both; otherwise straight-ish
    const bidir = has(g.to, g.from);
    const curve = bidir ? 38 : 0;
    const { d, mid } = edgePath(a, b, curve);
    edges.push({ key, from: g.from, to: g.to, syms: g.syms, d, mid, self: false });
  }
  return edges;
}

// ---- simulation ------------------------------------------------------------

interface SimStep {
  index: number; // symbol index consumed to reach this state (-1 = start)
  state: string;
  symbol: Sym | null;
}

function runDfa(dfa: Dfa, input: string): SimStep[] {
  const steps: SimStep[] = [{ index: -1, state: dfa.start, symbol: null }];
  let cur = dfa.start;
  for (let i = 0; i < input.length; i++) {
    const sym = input[i] as Sym;
    cur = dfa.delta[cur][sym];
    steps.push({ index: i, state: cur, symbol: sym });
  }
  return steps;
}

// ---- color tokens ----------------------------------------------------------

const C = {
  green: "#3fb950",
  greenBright: "#56d364",
  cyan: "#39c5e0",
  amber: "#e3a93c",
  red: "#f85149",
  border: "#1e2630",
  surface: "#10151d",
  surface2: "#161c26",
  text: "#d6dee8",
  muted: "#8a97a8",
  faint: "#5b6b7d",
};

export default function DfaSim() {
  const [presetIdx, setPresetIdx] = useState<number>(0);
  const [input, setInput] = useState<string>("1100");
  const [cursor, setCursor] = useState<number>(0); // how many symbols consumed
  const [running, setRunning] = useState<boolean>(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dfa = PRESETS[presetIdx];

  // validate input against the alphabet
  const invalidChar = useMemo(() => {
    for (const ch of input) {
      if (ch !== "0" && ch !== "1") return ch;
    }
    return null;
  }, [input]);

  const steps = useMemo(
    () => (invalidChar ? [] : runDfa(dfa, input)),
    [dfa, input, invalidChar],
  );

  const edges = useMemo(() => buildEdges(dfa), [dfa]);

  // clamp cursor when input / preset changes
  useEffect(() => {
    setCursor(0);
    setRunning(false);
  }, [presetIdx, input]);

  // auto-run animation
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!running) return;
    if (cursor >= input.length) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(() => setCursor((c) => c + 1), 650);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, cursor, input.length]);

  // Guard against the single render where `input` has just shrunk but the
  // reset effect above has not yet clamped `cursor` to 0: never index past
  // the freshly recomputed `steps`.
  const safeCursor = steps.length > 0 ? Math.min(cursor, steps.length - 1) : 0;

  const finished = !invalidChar && safeCursor >= input.length;
  const currentStep = steps[safeCursor] ?? steps[0] ?? null;
  const currentStateId = currentStep ? currentStep.state : dfa.start;
  const currentState = stateById(dfa, currentStateId);
  const accepted = finished ? currentState.accepting : false;

  // active edge (the transition just taken) for highlighting
  const activeEdgeKey =
    safeCursor > 0 && steps[safeCursor]
      ? `${steps[safeCursor - 1].state}->${steps[safeCursor].state}`
      : null;

  const reset = () => {
    setRunning(false);
    setCursor(0);
  };
  const step = () => {
    setRunning(false);
    setCursor((c) => Math.min(input.length, c + 1));
  };
  const run = () => {
    if (invalidChar || input.length === 0) return;
    if (cursor >= input.length) setCursor(0);
    setRunning(true);
  };

  const pathStates = invalidChar
    ? []
    : steps.slice(0, safeCursor + 1).map((s) => s.state);

  return (
    <div className="space-y-5">
      {/* preset selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          machine
        </span>
        {PRESETS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => setPresetIdx(i)}
            className="mono text-xs rounded px-3 py-1 border transition-colors"
            style={{
              background: presetIdx === i ? C.green : "transparent",
              color: presetIdx === i ? "#06121a" : C.muted,
              borderColor: presetIdx === i ? C.green : C.border,
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* input + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="mono text-xs text-muted flex items-center gap-2">
          input =
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
            className="w-44 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
            placeholder="e.g. 1100"
            spellCheck={false}
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["", "1100", "101", "0110", "1111", "1001"].map((ex) => (
            <button
              key={ex || "ε"}
              onClick={() => setInput(ex)}
              className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
            >
              {ex === "" ? "ε" : ex}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={step}
            disabled={!!invalidChar || finished}
            className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-text disabled:opacity-40 hover:text-green"
          >
            Step
          </button>
          <button
            onClick={run}
            disabled={!!invalidChar || input.length === 0 || running}
            className="mono text-xs rounded px-3 py-1.5 border bg-green hover:bg-green-bright disabled:opacity-40"
            style={{ color: "#06121a", borderColor: C.green }}
          >
            {running ? "Running…" : "Run"}
          </button>
          <button
            onClick={reset}
            className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text"
          >
            Reset
          </button>
        </div>
      </div>

      {invalidChar && (
        <div
          className="card p-3 mono text-xs"
          style={{ color: C.red, borderColor: C.red + "55", background: C.red + "12" }}
        >
          invalid symbol &quot;{invalidChar}&quot; — this DFA only accepts the alphabet
          {" "}
          {"{0, 1}"}. Remove it to run.
        </div>
      )}

      {/* tape / remaining input */}
      {!invalidChar && (
        <div className="card p-4 overflow-x-auto">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
            tape — {safeCursor} of {input.length} symbols consumed
          </div>
          {input.length === 0 ? (
            <div className="mono text-sm text-muted">
              ε (empty string) — the machine stays in its start state.
            </div>
          ) : (
            <div className="flex gap-1 min-w-max">
              {input.split("").map((ch, i) => {
                const consumed = i < safeCursor;
                const next = i === safeCursor && !finished;
                const color = consumed ? C.faint : next ? C.cyan : C.text;
                const bg = next ? C.cyan + "1f" : consumed ? C.surface : C.surface2;
                const bd = next ? C.cyan : C.border;
                return (
                  <div
                    key={i}
                    className="grid place-items-center rounded mono text-sm font-bold"
                    style={{
                      width: 30,
                      height: 38,
                      color,
                      background: bg,
                      border: `1px solid ${bd}`,
                      textDecoration: consumed ? "line-through" : "none",
                    }}
                    title={consumed ? "consumed" : next ? "next symbol" : "remaining"}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* state diagram */}
      <div className="card p-3 overflow-x-auto">
        <svg
          viewBox="0 0 560 280"
          className="w-full"
          style={{ minWidth: 460, height: "auto" }}
          role="img"
          aria-label={`State diagram for the ${dfa.name} DFA`}
        >
          <defs>
            <marker
              id="dfa-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={C.faint} />
            </marker>
            <marker
              id="dfa-arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={C.greenBright} />
            </marker>
          </defs>

          {/* start arrow */}
          {(() => {
            const s = stateById(dfa, dfa.start);
            return (
              <line
                x1={s.x - R - 34}
                y1={s.y}
                x2={s.x - R - 4}
                y2={s.y}
                stroke={C.amber}
                strokeWidth={2}
                markerEnd="url(#dfa-arrow)"
              />
            );
          })()}

          {/* edges */}
          {edges.map((e) => {
            const active = activeEdgeKey === e.key;
            const stroke = active ? C.greenBright : C.faint;
            return (
              <g key={e.key}>
                <path
                  d={e.d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={active ? 2.6 : 1.5}
                  markerEnd={active ? "url(#dfa-arrow-active)" : "url(#dfa-arrow)"}
                  opacity={active ? 1 : 0.85}
                />
                <text
                  x={e.mid.x}
                  y={e.mid.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="mono"
                  fontSize={13}
                  fontWeight={700}
                  fill={active ? C.greenBright : C.cyan}
                >
                  {e.syms.join(",")}
                </text>
              </g>
            );
          })}

          {/* states */}
          {dfa.states.map((s) => {
            const isCurrent = s.id === currentStateId;
            const onPath = pathStates.includes(s.id);
            const fill = isCurrent
              ? C.green + "33"
              : onPath
                ? C.surface2
                : C.surface;
            const ring = isCurrent
              ? C.greenBright
              : s.accepting
                ? C.green
                : C.border;
            return (
              <g key={s.id}>
                {s.accepting && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={R + 5}
                    fill="none"
                    stroke={isCurrent ? C.greenBright : C.green}
                    strokeWidth={1.6}
                    opacity={0.8}
                  />
                )}
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={R}
                  fill={fill}
                  stroke={ring}
                  strokeWidth={isCurrent ? 3 : 2}
                />
                <text
                  x={s.x}
                  y={s.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="mono"
                  fontSize={13}
                  fontWeight={700}
                  fill={isCurrent ? C.greenBright : s.accepting ? C.green : C.text}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 px-1 mono text-[10px] text-faint">
          <Legend color={C.amber}>start</Legend>
          <Legend color={C.green}>accepting (double ring)</Legend>
          <Legend color={C.greenBright}>current state</Legend>
        </div>
      </div>

      {/* path of states */}
      {!invalidChar && (
        <div className="card p-4">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
            path of states
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mono text-xs">
            {steps.slice(0, safeCursor + 1).map((st, i) => {
              const sObj = stateById(dfa, st.state);
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-faint">
                      —<span className="text-cyan">{steps[i].symbol}</span>→
                    </span>
                  )}
                  <span
                    className="rounded px-2 py-0.5 border"
                    style={{
                      color: sObj.accepting ? C.green : C.text,
                      borderColor:
                        i === safeCursor ? C.greenBright : sObj.accepting ? C.green + "66" : C.border,
                      background: i === safeCursor ? C.green + "1f" : "transparent",
                    }}
                  >
                    {sObj.label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* verdict */}
      {!invalidChar && (
        <div
          className="card p-4"
          style={{
            borderColor: finished ? (accepted ? C.green : C.red) + "66" : C.border,
            background: finished ? (accepted ? C.green : C.red) + "10" : undefined,
          }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="mono text-sm font-bold rounded px-3 py-1"
              style={{
                color: finished ? "#06121a" : C.muted,
                background: finished
                  ? accepted
                    ? C.green
                    : C.red
                  : C.surface2,
                border: `1px solid ${finished ? (accepted ? C.green : C.red) : C.border}`,
              }}
            >
              {finished ? (accepted ? "ACCEPT" : "REJECT") : "running…"}
            </span>
            <span className="mono text-xs text-muted">
              {finished
                ? accepted
                  ? `Ended in ${currentState.label} — an accepting state.`
                  : `Ended in ${currentState.label} — not an accepting state.`
                : `Currently in ${currentState.label}. Consume the rest of the tape to finish.`}
            </span>
          </div>
          <p className="mt-3 mono text-xs text-faint leading-relaxed">{dfa.blurb}</p>
        </div>
      )}
    </div>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block rounded-full"
        style={{ width: 9, height: 9, background: color }}
      />
      {children}
    </span>
  );
}