"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs0-03 — Mathematical Induction & Recursion
 *  A row of dominoes. Base case P(0) knocks the first; the inductive
 *  step (P(k) -> P(k+1)) is each domino tipping the next. Play the
 *  cascade and watch ∀n P(n) become tangible.
 * ================================================================== */

const GREEN = "#3fb950";
const GREEN_BRIGHT = "#56d364";
const CYAN = "#39c5e0";
const AMBER = "#e3a93c";
const PURPLE = "#bc8cff";
const FAINT = "#5b6b7d";
const BORDER = "#1e2630";

type Phase = "idle" | "running" | "done";

export default function InductionViz() {
  const [count, setCount] = useState(7);
  // fallen[i] === true once domino i has been knocked over.
  const [fallen, setFallen] = useState<boolean[]>(() => Array(7).fill(false));
  const [front, setFront] = useState<number>(-1); // index of the toppling "wave"
  const [phase, setPhase] = useState<Phase>("idle");

  // Resize the domino row when the slider changes; this also resets state.
  useEffect(() => {
    setFallen(Array(count).fill(false));
    setFront(-1);
    setPhase("idle");
  }, [count]);

  // The cascade: each tick advances the toppling front by one domino.
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setFront((f) => {
        const next = f + 1;
        if (next >= count) {
          setPhase("done");
          return f;
        }
        setFallen((prev) => {
          const copy = prev.slice();
          copy[next] = true;
          return copy;
        });
        return next;
      });
    }, 360);
    return () => clearInterval(t);
  }, [phase, count]);

  const allFallen = useMemo(() => fallen.every(Boolean), [fallen]);

  function knockBaseCase() {
    // P(0): physically knock the first domino, then let the step cascade.
    setFallen(() => {
      const arr = Array(count).fill(false);
      arr[0] = true;
      return arr;
    });
    setFront(0);
    setPhase("running");
  }

  function reset() {
    setFallen(Array(count).fill(false));
    setFront(-1);
    setPhase("idle");
  }

  // Geometry for the SVG domino row.
  const W = 720;
  const H = 200;
  const padX = 30;
  const slot = (W - padX * 2) / count;
  const dw = Math.min(26, slot * 0.42);
  const dh = 92;
  const baseY = 150;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* ---- the dominoes ---- */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 240 }}
          role="img"
          aria-label="A row of dominoes falling in a cascade"
        >
          {/* floor line */}
          <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke={BORDER} strokeWidth={1} />

          {Array.from({ length: count }).map((_, i) => {
            const cx = padX + slot * i + slot / 2;
            const isFallen = fallen[i];
            const isFront = i === front && phase === "running";
            // A fallen domino rotates 78° about its bottom-right corner.
            const pivotX = cx + dw / 2;
            const pivotY = baseY;
            const rot = isFallen ? 78 : 0;
            const col = isFallen ? GREEN : i === 0 && phase === "idle" ? CYAN : "#10151d";
            const stroke = isFallen ? GREEN_BRIGHT : i === 0 && phase === "idle" ? CYAN : BORDER;

            return (
              <g key={i}>
                {/* pip / domino number under each slot */}
                <text
                  x={cx}
                  y={baseY + 18}
                  textAnchor="middle"
                  className="mono"
                  style={{ fontSize: 11, fill: isFallen ? GREEN_BRIGHT : FAINT }}
                >
                  {i}
                </text>
                <g
                  style={{
                    transform: `rotate(${rot}deg)`,
                    transformOrigin: `${pivotX}px ${pivotY}px`,
                    transition: "transform 0.34s cubic-bezier(.45,.05,.3,1)",
                  }}
                >
                  <rect
                    x={cx - dw / 2}
                    y={baseY - dh}
                    width={dw}
                    height={dh}
                    rx={3}
                    fill={col}
                    stroke={stroke}
                    strokeWidth={isFront ? 2.5 : 1.5}
                    style={{
                      filter: isFront ? `drop-shadow(0 0 10px ${GREEN})` : undefined,
                    }}
                  />
                  {/* divider groove */}
                  <line
                    x1={cx - dw / 2 + 3}
                    y1={baseY - dh / 2}
                    x2={cx + dw / 2 - 3}
                    y2={baseY - dh / 2}
                    stroke={isFallen ? "#06121a" : BORDER}
                    strokeWidth={1}
                  />
                </g>
                {/* the "if k falls then k+1 falls" arrow between neighbours */}
                {i < count - 1 && (
                  <text
                    x={cx + slot / 2}
                    y={baseY - dh - 6}
                    textAnchor="middle"
                    className="mono"
                    style={{
                      fontSize: 13,
                      fill: fallen[i] ? GREEN_BRIGHT : FAINT,
                      opacity: fallen[i] ? 1 : 0.4,
                      transition: "fill .3s, opacity .3s",
                    }}
                  >
                    ⟶
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ---- the logic, mirrored as cards ---- */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <LogicCard
          label="base case"
          formula="P(0)"
          desc="The first domino is knocked over by hand."
          color={CYAN}
          active={fallen[0]}
        />
        <LogicCard
          label="inductive step"
          formula="P(k) → P(k+1)"
          desc="Each standing domino, once it falls, tips its neighbour."
          color={AMBER}
          active={phase === "running" || phase === "done"}
        />
        <LogicCard
          label="conclusion"
          formula="∀n. P(n)"
          desc="So every domino in the row must fall — no matter how many."
          color={PURPLE}
          active={allFallen && count > 0}
        />
      </div>

      {/* ---- controls ---- */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={knockBaseCase}
          disabled={phase === "running"}
          className="mono text-xs font-bold rounded px-4 py-2 transition-all disabled:opacity-40"
          style={{
            background: phase === "running" ? "#10151d" : CYAN,
            border: `1px solid ${CYAN}`,
            color: phase === "running" ? CYAN : "#06121a",
          }}
        >
          ▶ knock P(0)
        </button>
        <button
          onClick={reset}
          className="mono text-xs rounded border border-border px-3 py-2 text-faint hover:text-text transition-colors"
        >
          ↺ stand back up
        </button>
        <label className="flex items-center gap-2 mono text-[11px] text-muted">
          <span className="text-faint">dominoes</span>
          <input
            type="range"
            min={3}
            max={14}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-28 accent-[#3fb950]"
            aria-label="number of dominoes"
          />
          <span className="text-green font-bold w-5 text-right">{count}</span>
        </label>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Induction is exactly this chain reaction: prove the{" "}
        <b style={{ color: CYAN }}>base case</b> P(0), prove the{" "}
        <b style={{ color: AMBER }}>step</b> P(k)→P(k+1), and{" "}
        <b style={{ color: PURPLE }}>every</b> case follows for free — you never
        check them one by one.
      </p>

      <p className="mt-3 text-xs text-faint mono text-center">
        Recursion is the same idea running the other way: a base case plus a call
        that shrinks toward it. {count} dominoes, 1 push.
      </p>
    </div>
  );
}

function LogicCard({
  label,
  formula,
  desc,
  color,
  active,
}: {
  label: string;
  formula: string;
  desc: string;
  color: string;
  active: boolean;
}) {
  return (
    <div
      className="card p-3 transition-all"
      style={{
        background: active ? `${color}1a` : "#10151d",
        border: `1px solid ${active ? color : BORDER}`,
        boxShadow: active ? `0 0 20px -8px ${color}` : undefined,
      }}
    >
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-base font-bold mt-1" style={{ color }}>
        {formula}
      </div>
      <p className="text-xs text-muted mt-1.5 leading-snug">{desc}</p>
    </div>
  );
}
