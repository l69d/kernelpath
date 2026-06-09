"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Turing machine model
// ---------------------------------------------------------------------------

const BLANK = "_"; // the blank symbol on the tape

type Move = "L" | "R" | "S"; // left, right, stay

type Rule = {
  write: string; // symbol to write into the current cell
  move: Move; // direction to slide the head
  next: string; // state to enter
};

// transition table: key is `${state}|${readSymbol}` -> Rule
type Transitions = Record<string, Rule>;

type Machine = {
  id: string;
  name: string;
  blurb: string;
  start: string; // initial state
  halts: string[]; // halting / accepting states
  input: string; // preloaded tape contents
  // human-readable transition list; compiled into a lookup table
  rules: Array<{ state: string; read: string; write: string; move: Move; next: string }>;
};

const MACHINES: Machine[] = [
  {
    id: "increment",
    name: "Binary increment",
    blurb:
      "Adds 1 to a binary number. The head runs to the least-significant bit, then carries leftward, flipping 1s to 0s until it lands on a 0 (or the blank) and writes a 1.",
    start: "goto_end",
    halts: ["done"],
    input: "1011",
    rules: [
      // walk to the right end of the number
      { state: "goto_end", read: "0", write: "0", move: "R", next: "goto_end" },
      { state: "goto_end", read: "1", write: "1", move: "R", next: "goto_end" },
      { state: "goto_end", read: BLANK, write: BLANK, move: "L", next: "carry" },
      // add one with carry, moving left
      { state: "carry", read: "1", write: "0", move: "L", next: "carry" },
      { state: "carry", read: "0", write: "1", move: "S", next: "done" },
      // overflow past the most-significant bit: write a fresh leading 1
      { state: "carry", read: BLANK, write: "1", move: "S", next: "done" },
    ],
  },
  {
    id: "unary_add",
    name: "Unary addition",
    blurb:
      "Two unary numbers (runs of 1s) separated by a single 0 — computes their sum. The separating 0 is rewritten as a 1 and the trailing 1 is erased, fusing the two runs into one.",
    start: "find_sep",
    halts: ["done"],
    input: "111011",
    rules: [
      // scan right for the separating 0
      { state: "find_sep", read: "1", write: "1", move: "R", next: "find_sep" },
      { state: "find_sep", read: "0", write: "1", move: "R", next: "to_end" },
      // already fused? (no separator) just stop
      { state: "find_sep", read: BLANK, write: BLANK, move: "S", next: "done" },
      // walk to the far right end
      { state: "to_end", read: "1", write: "1", move: "R", next: "to_end" },
      { state: "to_end", read: BLANK, write: BLANK, move: "L", next: "erase" },
      // erase the final 1 to keep the count correct
      { state: "erase", read: "1", write: BLANK, move: "S", next: "done" },
    ],
  },
  {
    id: "flip",
    name: "Flip all bits",
    blurb:
      "Sweeps left to right inverting every bit (0 to 1 and 1 to 0), then halts at the first blank. The simplest kind of stream transducer.",
    start: "scan",
    halts: ["done"],
    input: "100110",
    rules: [
      { state: "scan", read: "0", write: "1", move: "R", next: "scan" },
      { state: "scan", read: "1", write: "0", move: "R", next: "scan" },
      { state: "scan", read: BLANK, write: BLANK, move: "S", next: "done" },
    ],
  },
];

const STEP_CAP = 1000;

function compile(rules: Machine["rules"]): Transitions {
  const t: Transitions = {};
  for (const r of rules) {
    t[`${r.state}|${r.read}`] = { write: r.write, move: r.move, next: r.next };
  }
  return t;
}

// A clean snapshot of the machine's configuration.
type Config = {
  tape: string[];
  head: number; // index into tape
  state: string;
  steps: number;
  status: "ready" | "running" | "halted" | "stuck" | "capped";
  lastRule: { from: string; read: string; write: string; move: Move; next: string } | null;
};

function symbolColor(s: string): string {
  if (s === BLANK) return "#5b6b7d"; // faint
  if (s === "0") return "#39c5e0"; // cyan
  if (s === "1") return "#3fb950"; // green
  return "#bc8cff"; // purple for anything else
}

// Build a fresh starting configuration from an input string.
function initialConfig(m: Machine, raw: string): Config {
  const cells = raw.split("");
  const tape = cells.length > 0 ? cells : [BLANK];
  return {
    tape,
    head: 0,
    state: m.start,
    steps: 0,
    status: "ready",
    lastRule: null,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TuringMachine() {
  const [machineId, setMachineId] = useState<string>(MACHINES[0].id);
  const [customInput, setCustomInput] = useState<string>(MACHINES[0].input);
  const [inputError, setInputError] = useState<string | null>(null);
  const [config, setConfig] = useState<Config>(() => initialConfig(MACHINES[0], MACHINES[0].input));
  const [running, setRunning] = useState<boolean>(false);

  const machine = useMemo(() => MACHINES.find((m) => m.id === machineId) ?? MACHINES[0], [machineId]);
  const table = useMemo(() => compile(machine.rules), [machine]);

  const states = useMemo(() => {
    const seen = new Set<string>();
    seen.add(machine.start);
    for (const r of machine.rules) {
      seen.add(r.state);
      seen.add(r.next);
    }
    return Array.from(seen);
  }, [machine]);

  // Validate input against the machine's known alphabet.
  const validate = useCallback(
    (raw: string): string | null => {
      if (raw.length === 0) return "Tape is empty — type at least one symbol.";
      const alphabet = new Set<string>([BLANK]);
      for (const r of machine.rules) {
        alphabet.add(r.read);
        alphabet.add(r.write);
      }
      for (const ch of raw) {
        if (!alphabet.has(ch)) {
          return `Symbol "${ch}" isn't in this machine's alphabet (${Array.from(alphabet)
            .filter((a) => a !== BLANK)
            .join(", ")}).`;
        }
      }
      return null;
    },
    [machine],
  );

  // Reset whenever the chosen machine changes.
  useEffect(() => {
    setRunning(false);
    setCustomInput(machine.input);
    setInputError(null);
    setConfig(initialConfig(machine, machine.input));
  }, [machine]);

  // Advance the machine by exactly one transition. Pure given a config.
  const stepConfig = useCallback(
    (c: Config): Config => {
      if (c.status === "halted" || c.status === "stuck" || c.status === "capped") return c;
      if (machine.halts.includes(c.state)) {
        return { ...c, status: "halted" };
      }
      if (c.steps >= STEP_CAP) {
        return { ...c, status: "capped" };
      }
      const read = c.tape[c.head] ?? BLANK;
      const rule = table[`${c.state}|${read}`];
      if (!rule) {
        // no transition defined: the machine is stuck (rejects)
        return { ...c, status: "stuck", lastRule: null };
      }
      const tape = c.tape.slice();
      tape[c.head] = rule.write;
      let head = c.head;
      if (rule.move === "L") head -= 1;
      else if (rule.move === "R") head += 1;
      // extend the (conceptually infinite) tape with blanks as needed
      if (head < 0) {
        tape.unshift(BLANK);
        head = 0;
      } else if (head >= tape.length) {
        tape.push(BLANK);
      }
      const halted = machine.halts.includes(rule.next);
      return {
        tape,
        head,
        state: rule.next,
        steps: c.steps + 1,
        status: halted ? "halted" : "running",
        lastRule: { from: c.state, read, write: rule.write, move: rule.move, next: rule.next },
      };
    },
    [machine, table],
  );

  const doStep = useCallback(() => {
    setConfig((c) => stepConfig(c));
  }, [stepConfig]);

  const doReset = useCallback(() => {
    setRunning(false);
    const err = validate(customInput);
    setInputError(err);
    if (err) {
      setConfig(initialConfig(machine, machine.input));
      return;
    }
    setConfig(initialConfig(machine, customInput));
  }, [customInput, machine, validate]);

  const doRun = useCallback(() => {
    const err = validate(customInput);
    if (err) {
      setInputError(err);
      return;
    }
    setInputError(null);
    setRunning((r) => !r);
  }, [customInput, validate]);

  // Animated run loop, driven by an interval ref so it stays deterministic.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!running) {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      return;
    }
    timer.current = setInterval(() => {
      // Pure updater: stopping at a terminal state is handled by the
      // status-watching effect below. stepConfig is idempotent once halted.
      setConfig((c) => stepConfig(c));
    }, 120);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [running, stepConfig]);

  // Stop the run loop whenever we reach a terminal state (manual step or loop).
  useEffect(() => {
    if (config.status !== "running" && config.status !== "ready") setRunning(false);
  }, [config.status]);

  const onInputChange = (raw: string) => {
    setCustomInput(raw);
    const err = validate(raw);
    setInputError(err);
    if (!err) {
      setRunning(false);
      setConfig(initialConfig(machine, raw));
    }
  };

  const terminal =
    config.status === "halted" ||
    config.status === "stuck" ||
    config.status === "capped";

  const statusMeta = STATUS_META[config.status];

  // Window of tape cells to render, padded so the head always sits in view.
  const view = useMemo(() => buildView(config.tape, config.head), [config.tape, config.head]);

  // Read symbol under the head for the readout / next-rule lookup.
  const readSym = config.tape[config.head] ?? BLANK;
  const nextRule = terminal ? undefined : table[`${config.state}|${readSym}`];

  return (
    <div className="space-y-5">
      {/* machine picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">machine</span>
        {MACHINES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMachineId(m.id)}
            className="mono text-xs rounded px-3 py-1 border transition-colors"
            style={{
              background: machineId === m.id ? "var(--color-green)" : "transparent",
              color: machineId === m.id ? "#06121a" : "var(--color-muted)",
              borderColor: machineId === m.id ? "var(--color-green)" : "var(--color-border)",
            }}
          >
            {m.name}
          </button>
        ))}
        <span
          className="ml-auto mono text-xs rounded px-2.5 py-1 border"
          style={{
            color: statusMeta.color,
            borderColor: statusMeta.color + "55",
            background: statusMeta.color + "14",
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      <p className="text-xs text-muted leading-relaxed">{machine.blurb}</p>

      {/* input + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="mono text-xs text-muted flex items-center gap-2">
          tape =
          <input
            value={customInput}
            onChange={(e) => onInputChange(e.target.value)}
            className="w-48 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
            placeholder="e.g. 1011"
            spellCheck={false}
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={doStep}
            disabled={terminal || running || inputError !== null}
            className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-text hover:text-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Step
          </button>
          <button
            onClick={doRun}
            disabled={terminal || inputError !== null}
            className="mono text-xs rounded px-3 py-1.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: running ? "var(--color-amber)" : "var(--color-green)",
              color: "#06121a",
              borderColor: running ? "var(--color-amber)" : "var(--color-green)",
            }}
          >
            {running ? "Pause" : "Run"}
          </button>
          <button
            onClick={doReset}
            className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text transition-colors"
          >
            Reset
          </button>
        </div>
        <span className="ml-auto mono text-[11px] text-faint">
          step {config.steps}
          <span className="text-faint/60"> / cap {STEP_CAP}</span>
        </span>
      </div>

      {inputError && (
        <div
          className="mono text-xs rounded px-3 py-2 border"
          style={{ color: "#f85149", borderColor: "#f8514955", background: "#f8514914" }}
        >
          {inputError}
        </div>
      )}

      {/* the tape */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex justify-center gap-1 min-w-max">
          {view.cells.map((cell) => {
            const isHead = cell.index === config.head;
            const color = symbolColor(cell.symbol);
            return (
              <div key={cell.key} className="flex flex-col items-center" style={{ width: 38 }}>
                <div
                  className="grid place-items-center rounded mono text-base font-bold transition-all"
                  style={{
                    width: 38,
                    height: 44,
                    background: isHead ? color : "#10151d",
                    color: isHead ? "#06121a" : cell.symbol === BLANK ? "#3a4654" : color,
                    border: `1px solid ${isHead ? color : "#1e2630"}`,
                    boxShadow: isHead ? `0 0 0 2px ${color}55` : "none",
                  }}
                  title={cell.symbol === BLANK ? "blank" : cell.symbol}
                >
                  {cell.symbol === BLANK ? "□" : cell.symbol}
                </div>
                {/* head pointer */}
                <div className="h-4 mt-1 grid place-items-center" style={{ width: 38 }}>
                  {isHead ? (
                    <span className="mono text-sm font-bold" style={{ color }}>
                      ▲
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-center text-xs text-faint">
          head at index {config.head} · □ = blank · cells extend infinitely both ways
        </p>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Cell label="current state" value={config.state} color="#bc8cff" />
        <Cell
          label="read symbol"
          value={readSym === BLANK ? "□ (blank)" : readSym}
          color={symbolColor(readSym)}
        />
        <Cell
          label="next move"
          value={terminal ? "—" : nextRule ? moveLabel(nextRule.move) : "(none)"}
          color="#39c5e0"
        />
        <Cell label="steps run" value={String(config.steps)} color="#e3a93c" />
      </div>

      {/* the rule being applied */}
      <div className="card p-4 mono text-xs text-muted leading-relaxed">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
          rule being applied
        </div>
        {config.lastRule ? (
          <div className="break-all">
            δ(<span className="text-purple">{config.lastRule.from}</span>,{" "}
            <span style={{ color: symbolColor(config.lastRule.read) }}>
              {sym(config.lastRule.read)}
            </span>
            ) ={" "}
            <span style={{ color: symbolColor(config.lastRule.write) }}>
              {sym(config.lastRule.write)}
            </span>
            , <span className="text-cyan">{moveLabel(config.lastRule.move)}</span>,{" "}
            <span className="text-purple">{config.lastRule.next}</span>
          </div>
        ) : (
          <div className="text-faint">
            {config.status === "ready"
              ? "press Step or Run to begin — no rule applied yet."
              : "no rule was applied."}
          </div>
        )}

        <div className="text-faint uppercase tracking-widest text-[10px] mt-4 mb-2">
          next rule
        </div>
        {terminal ? (
          <div style={{ color: statusMeta.color }}>{statusMeta.detail}</div>
        ) : nextRule ? (
          <div className="break-all">
            δ(<span className="text-purple">{config.state}</span>,{" "}
            <span style={{ color: symbolColor(readSym) }}>{sym(readSym)}</span>) ={" "}
            <span style={{ color: symbolColor(nextRule.write) }}>{sym(nextRule.write)}</span>,{" "}
            <span className="text-cyan">{moveLabel(nextRule.move)}</span>,{" "}
            <span className="text-purple">{nextRule.next}</span>
          </div>
        ) : (
          <div style={{ color: "#f85149" }}>
            no transition for (state {config.state}, read {sym(readSym)}) — the machine will get
            stuck and reject.
          </div>
        )}
      </div>

      {/* transition table */}
      <div className="card p-4">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-3 mono">
          transition table — δ(state, read) → write, move, next
        </div>
        <div className="overflow-x-auto">
          <table className="w-full mono text-xs border-collapse">
            <thead>
              <tr className="text-faint">
                <th className="text-left font-normal py-1.5 px-2">state</th>
                <th className="text-left font-normal py-1.5 px-2">read</th>
                <th className="text-left font-normal py-1.5 px-2">write</th>
                <th className="text-left font-normal py-1.5 px-2">move</th>
                <th className="text-left font-normal py-1.5 px-2">next</th>
              </tr>
            </thead>
            <tbody>
              {machine.rules.map((r, i) => {
                const active =
                  !terminal && config.state === r.state && readSym === r.read;
                return (
                  <tr
                    key={`${r.state}|${r.read}|${i}`}
                    style={{
                      background: active ? "var(--color-green)" + "1f" : "transparent",
                    }}
                  >
                    <td className="py-1.5 px-2 border-t border-border">
                      <span className="text-purple">{r.state}</span>
                    </td>
                    <td className="py-1.5 px-2 border-t border-border">
                      <span style={{ color: symbolColor(r.read) }}>{sym(r.read)}</span>
                    </td>
                    <td className="py-1.5 px-2 border-t border-border">
                      <span style={{ color: symbolColor(r.write) }}>{sym(r.write)}</span>
                    </td>
                    <td className="py-1.5 px-2 border-t border-border text-cyan">{r.move}</td>
                    <td className="py-1.5 px-2 border-t border-border">
                      <span className="text-purple">{r.next}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill label={`start: ${machine.start}`} color="#3fb950" />
          {machine.halts.map((h) => (
            <Pill key={h} label={`halt: ${h}`} color="#bc8cff" />
          ))}
          <Pill label={`${states.length} states`} color="#39c5e0" />
          <Pill label={`${machine.rules.length} rules`} color="#e3a93c" />
        </div>
      </div>

      <p className="text-xs text-faint leading-relaxed">
        A Turing machine is the simplest model that captures everything a computer can compute: a
        tape of cells, a head that reads and writes one symbol at a time, and a tiny table of rules
        keyed by (state, symbol). The highlighted row above is the rule that will fire next.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  Config["status"],
  { label: string; color: string; detail: string }
> = {
  ready: { label: "ready", color: "#39c5e0", detail: "" },
  running: { label: "running", color: "#3fb950", detail: "" },
  halted: {
    label: "halted",
    color: "#bc8cff",
    detail: "reached a halting state — computation finished. Reset to run again.",
  },
  stuck: {
    label: "stuck (reject)",
    color: "#f85149",
    detail: "no transition was defined for this configuration, so the machine rejects.",
  },
  capped: {
    label: "step cap hit",
    color: "#e3a93c",
    detail: `stopped after ${STEP_CAP} steps to avoid an infinite loop.`,
  },
};

type ViewCell = { key: string; index: number; symbol: string };

// Pad the visible tape so the head is never at the very edge.
function buildView(tape: string[], head: number): { cells: ViewCell[] } {
  const PAD = 6; // minimum blanks visible on each side of the content
  const minIndex = Math.min(0, head - PAD);
  const maxIndex = Math.max(tape.length - 1, head + PAD);
  const cells: ViewCell[] = [];
  for (let i = minIndex; i <= maxIndex; i++) {
    const symbol = i >= 0 && i < tape.length ? tape[i] : BLANK;
    cells.push({ key: `c${i}`, index: i, symbol });
  }
  return { cells };
}

function moveLabel(m: Move): string {
  if (m === "L") return "← left";
  if (m === "R") return "right →";
  return "stay";
}

function sym(s: string): string {
  return s === BLANK ? "□" : s;
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-base font-bold mt-1 truncate" style={{ color }} title={value}>
        {value}
      </div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="mono text-[10px] rounded px-2 py-1 border"
      style={{ color, borderColor: color + "44", background: color + "12" }}
    >
      {label}
    </span>
  );
}
