"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs5-05 — Decidability & the Halting Problem
 *  Diagonalization: rows = programs, columns = inputs (each program is
 *  also fed its own encoding). Cells = does Pᵢ(Pⱼ) halt or loop?
 *  Build D = the OPPOSITE of the diagonal, then ask D(D): contradiction.
 * ================================================================== */

const N = 6;
const PROGS = ["P₀", "P₁", "P₂", "P₃", "P₄", "P₅"];

const GREEN = "#3fb950";
const RED = "#f85149";
const AMBER = "#e3a93c";
const PINK = "#f778ba";
const FAINT = "#5b6b7d";

// Deterministic toy oracle: would H *claim* Pᵢ halts on input Pⱼ?
// Pseudo-fixed via index arithmetic — no RNG, identical on server & client.
function halts(i: number, j: number): boolean {
  return ((i * 7 + j * 5 + i * j + 3) % 5) > 1;
}

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS: { k: string; d: string; c: string }[] = [
  {
    k: "1 · Suppose H exists",
    d: "Assume a program H exists that decides, for ANY program Pᵢ and input Pⱼ, whether Pᵢ(Pⱼ) halts. Fill the grid: green H = halts, red L = loops forever.",
    c: GREEN,
  },
  {
    k: "2 · Read the diagonal",
    d: "Look only at the diagonal: H's verdict on each program run on its OWN source code, Pᵢ(Pᵢ). This is the behaviour D will sabotage.",
    c: AMBER,
  },
  {
    k: "3 · Build D = the opposite",
    d: "Define D(Pᵢ): run H on Pᵢ(Pᵢ). If H says HALTS, D loops forever; if H says LOOPS, D halts. D's row is the diagonal, flipped — and it is perfectly buildable from H.",
    c: PINK,
  },
  {
    k: "4 · Feed D its own code",
    d: "D is a program, so it has a column too. Ask the forbidden question: what does D do on input D — the cell D(D), where D's row meets D's column?",
    c: PINK,
  },
  {
    k: "5 · Contradiction",
    d: "If H says D(D) halts, D was built to loop. If H says D(D) loops, D was built to halt. D(D) halts ⇔ D(D) loops. No consistent answer exists — so H cannot exist. Halting is undecidable.",
    c: RED,
  },
];

export default function HaltingProblemViz() {
  const [step, setStep] = useState<Step>(0);
  const [flip, setFlip] = useState(false); // step 5: which horn of the contradiction H is asserting

  // Auto-toggle the two horns on the final step to dramatise "no consistent answer".
  useEffect(() => {
    if (step !== 4) return;
    const t = setInterval(() => setFlip((f) => !f), 1100);
    return () => clearInterval(t);
  }, [step]);

  const diag = useMemo(() => Array.from({ length: N }, (_, i) => halts(i, i)), []);
  const dRow = useMemo(() => diag.map((h) => !h), [diag]); // D = flipped diagonal

  const showDiag = step >= 1;
  const showD = step >= 3;
  const showDD = step >= 4;

  // SVG geometry
  const cell = 40;
  const left = 56;
  const top = 26;
  const gridW = left + (N + 1) * cell + 6; // +1 column for D's own input
  const dRowY = top + N * cell + 12;
  const dColX = left + N * cell; // the extra "input = D" column
  const svgH = dRowY + cell + 14;

  // The verdict H currently asserts for D(D), and what D was built to do in response.
  const verdict = flip ? "HALT" : "LOOP";
  const builtTo = flip ? "LOOP" : "HALT";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* step rail */}
        <div className="flex items-center gap-1 pb-3 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s.k} className="flex items-center shrink-0">
              <button
                onClick={() => setStep(i as Step)}
                className="grid place-items-center rounded-lg px-3 py-2 transition-all"
                style={{
                  background: i === step ? s.c : "#10151d",
                  border: `1px solid ${i === step ? s.c : "#1e2630"}`,
                  color: i === step ? "#06121a" : "#8a97a8",
                }}
              >
                <span className="mono text-[11px] font-bold whitespace-nowrap">{s.k}</span>
              </button>
              {i < STEPS.length - 1 && <span className="mx-0.5 text-faint">→</span>}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* the grid */}
          <svg
            viewBox={`0 0 ${gridW} ${svgH}`}
            className="w-full shrink-0 lg:w-auto"
            style={{ maxHeight: 340, minWidth: 320 }}
            role="img"
            aria-label="Diagonalization grid of programs versus inputs"
          >
            <text x={left + (N * cell) / 2} y={10} textAnchor="middle" className="mono" fontSize="9" fill={FAINT}>
              input →
            </text>

            {/* column headers (inputs) */}
            {PROGS.map((p, j) => (
              <text key={`c${j}`} x={left + j * cell + cell / 2} y={top - 8} textAnchor="middle" className="mono" fontSize="11" fill={FAINT}>
                {p}
              </text>
            ))}
            {showD && (
              <text x={dColX + cell / 2} y={top - 8} textAnchor="middle" className="mono" fontSize="11" fontWeight={700} fill={PINK}>
                D
              </text>
            )}

            {/* program rows */}
            {PROGS.map((p, i) => {
              const y = top + i * cell;
              return (
                <g key={`r${i}`}>
                  <text x={left - 10} y={y + cell / 2 + 4} textAnchor="end" className="mono" fontSize="11" fill={FAINT}>
                    {p}
                  </text>
                  {PROGS.map((_, j) => {
                    const h = halts(i, j);
                    const diagActive = showDiag && i === j;
                    const base = h ? GREEN : RED;
                    return (
                      <g key={`${i}-${j}`}>
                        <rect
                          x={left + j * cell + 2}
                          y={y + 2}
                          width={cell - 4}
                          height={cell - 4}
                          rx={5}
                          fill={diagActive ? base : `${base}22`}
                          stroke={diagActive ? base : "#1e2630"}
                          strokeWidth={diagActive ? 2 : 1}
                        />
                        <text
                          x={left + j * cell + cell / 2}
                          y={y + cell / 2 + 4}
                          textAnchor="middle"
                          className="mono"
                          fontSize="12"
                          fontWeight={diagActive ? 700 : 400}
                          fill={diagActive ? "#06121a" : base}
                        >
                          {h ? "H" : "L"}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* constructed program D as a new row */}
            {showD && (
              <g>
                <line x1={left - 14} y1={dRowY - 7} x2={gridW} y2={dRowY - 7} stroke="#1e2630" strokeDasharray="3 3" />
                <text x={left - 10} y={dRowY + cell / 2 + 4} textAnchor="end" className="mono" fontSize="12" fontWeight={700} fill={PINK}>
                  D
                </text>
                {dRow.map((dh, j) => {
                  const base = dh ? GREEN : RED;
                  return (
                    <g key={`d${j}`}>
                      <rect
                        x={left + j * cell + 2}
                        y={dRowY + 2}
                        width={cell - 4}
                        height={cell - 4}
                        rx={5}
                        fill={`${base}22`}
                        stroke={PINK}
                        strokeWidth={1.5}
                      />
                      <text x={left + j * cell + cell / 2} y={dRowY + cell / 2 + 4} textAnchor="middle" className="mono" fontSize="12" fill={base}>
                        {dh ? "H" : "L"}
                      </text>
                      {/* dashed link: D cell = flip of the diagonal cell above */}
                      <line
                        x1={left + j * cell + cell / 2}
                        y1={top + j * cell + cell - 2}
                        x2={left + j * cell + cell / 2}
                        y2={dRowY + 2}
                        stroke={`${PINK}55`}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* the forbidden cell D(D): row D meets column D */}
            {showDD && (
              <g>
                {/* the D column down to the D row */}
                <rect
                  x={dColX + 2}
                  y={dRowY + 2}
                  width={cell - 4}
                  height={cell - 4}
                  rx={5}
                  fill={`${RED}22`}
                  stroke={RED}
                  strokeWidth={2}
                />
                <text x={dColX + cell / 2} y={dRowY + cell / 2 + 5} textAnchor="middle" className="mono" fontSize="13" fontWeight={700} fill={RED}>
                  ?
                </text>
                <circle
                  cx={dColX + cell / 2}
                  cy={dRowY + cell / 2}
                  r={cell / 2 + 3}
                  fill="none"
                  stroke={RED}
                  strokeWidth={2.5}
                  opacity={flip ? 0.95 : 0.3}
                  style={{ transition: "opacity .4s" }}
                />
                <text x={dColX + cell / 2} y={dRowY + cell + 12} textAnchor="middle" className="mono" fontSize="9" fontWeight={700} fill={RED}>
                  D(D)
                </text>
              </g>
            )}
          </svg>

          {/* narration + readout */}
          <div className="flex-1 min-w-[220px] space-y-3">
            <div className="card p-4 min-h-[150px]">
              <div className="mono text-xs font-bold" style={{ color: STEPS[step].c }}>
                {STEPS[step].k}
              </div>
              <p className="text-sm text-muted mt-2 leading-relaxed">{STEPS[step].d}</p>
            </div>

            {step === 4 && (
              <div className="card p-4" style={{ borderColor: RED, boxShadow: `0 0 22px -10px ${RED}` }}>
                <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">the cell D(D)</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="card py-2">
                    <div className="mono text-[10px] uppercase tracking-widest text-faint">H claims</div>
                    <div className="mono text-sm font-bold mt-0.5" style={{ color: verdict === "HALT" ? GREEN : RED }}>
                      D(D) {verdict}S
                    </div>
                  </div>
                  <div className="card py-2">
                    <div className="mono text-[10px] uppercase tracking-widest text-faint">so D actually</div>
                    <div className="mono text-sm font-bold mt-0.5" style={{ color: builtTo === "HALT" ? GREEN : RED }}>
                      {builtTo}S
                    </div>
                  </div>
                </div>
                <p className="mono text-[11px] text-center mt-3" style={{ color: RED }}>
                  {verdict} ≠ {builtTo} — no answer is consistent
                </p>
                <button
                  onClick={() => setFlip((f) => !f)}
                  className="mt-3 w-full mono text-[11px] rounded border px-3 py-1.5 transition-colors hover:text-text"
                  style={{ borderColor: "#1e2630", color: FAINT }}
                >
                  flip H&apos;s guess → still contradictory
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
              >
                prev
              </button>
              <div className="flex gap-1 flex-1 justify-center">
                {STEPS.map((_, i) => (
                  <span key={i} className="h-1.5 w-6 rounded-full" style={{ background: i === step ? STEPS[step].c : "#1e2630" }} />
                ))}
              </div>
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1) as Step)}
                className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
              >
                next
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] mono text-faint">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: GREEN }} /> H = halts
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: RED }} /> L = loops
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        D differs from every row Pᵢ at the diagonal, so D is no Pᵢ in the list — yet D is a real program. The impossible link is the decider H.
      </p>
    </div>
  );
}