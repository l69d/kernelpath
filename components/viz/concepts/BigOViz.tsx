"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs4-01 — Algorithm Analysis & Asymptotics
 *  Plot the growth classes on shared axes (clamped, log-y) and let a
 *  slider for n drive a live "operations at n" table so the divergence
 *  between n^2, 2^n and n! becomes visceral.
 * ================================================================== */

type Klass = {
  key: string;
  label: string;
  color: string;
  /** operations at size n (may overflow to Infinity for 2^n / n!) */
  f: (n: number) => number;
};

const CLASSES: Klass[] = [
  { key: "1", label: "O(1)", color: "#3fb950", f: () => 1 },
  { key: "logn", label: "O(log n)", color: "#56d364", f: (n) => Math.log2(Math.max(1, n)) },
  { key: "n", label: "O(n)", color: "#39c5e0", f: (n) => n },
  { key: "nlogn", label: "O(n log n)", color: "#58a6ff", f: (n) => n * Math.log2(Math.max(1, n)) },
  { key: "n2", label: "O(n²)", color: "#e3a93c", f: (n) => n * n },
  { key: "2n", label: "O(2ⁿ)", color: "#f778ba", f: (n) => Math.pow(2, n) },
  { key: "nfact", label: "O(n!)", color: "#f85149", f: factorial },
];

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) {
    r *= i;
    if (!isFinite(r)) return Infinity;
  }
  return r;
}

const N_MIN = 1;
const N_MAX = 40;
const Y_CAP = 1e12; // clamp ceiling: anything past here is "off the chart"

// SVG plot geometry
const W = 720;
const H = 300;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 28;

/** map n -> x pixel */
function xOf(n: number): number {
  return PAD_L + ((n - N_MIN) / (N_MAX - N_MIN)) * (W - PAD_L - PAD_R);
}
/** map an op-count to y pixel on a log scale clamped to [1, Y_CAP] */
function yOf(ops: number): number {
  const v = Math.min(Math.max(ops, 1), Y_CAP);
  const t = Math.log10(v) / Math.log10(Y_CAP); // 0..1
  return H - PAD_B - t * (H - PAD_T - PAD_B);
}

/** format an operation count compactly */
function fmt(ops: number): string {
  if (!isFinite(ops)) return "∞ (overflow)";
  if (ops < 1000) return ops % 1 === 0 ? String(ops) : ops.toFixed(1);
  const exp = Math.floor(Math.log10(ops));
  if (exp >= 15) return ops.toExponential(2).replace("e+", " × 10^");
  const units = [
    { e: 12, s: "T" },
    { e: 9, s: "B" },
    { e: 6, s: "M" },
    { e: 3, s: "K" },
  ];
  for (const u of units) {
    if (exp >= u.e) return (ops / Math.pow(10, u.e)).toFixed(2) + u.s;
  }
  return String(Math.round(ops));
}

/** human time if each op costs 1 nanosecond */
function humanTime(ops: number): string {
  if (!isFinite(ops)) return "longer than the universe";
  const ns = ops; // 1 op = 1 ns
  const sec = ns / 1e9;
  if (sec < 1e-6) return "< 1 µs";
  if (sec < 1e-3) return (sec * 1e6).toFixed(1) + " µs";
  if (sec < 1) return (sec * 1e3).toFixed(1) + " ms";
  if (sec < 60) return sec.toFixed(2) + " s";
  if (sec < 3600) return (sec / 60).toFixed(1) + " min";
  if (sec < 86400) return (sec / 3600).toFixed(1) + " hr";
  if (sec < 3.15e7) return (sec / 86400).toFixed(1) + " days";
  const years = sec / 3.15e7;
  if (years < 1e3) return years.toFixed(1) + " yr";
  if (years < 1e15) return years.toExponential(1) + " yr";
  return "≫ age of universe";
}

export default function BigOViz() {
  const [n, setN] = useState(12);
  const [hover, setHover] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // auto-sweep n to show the divergence kick in
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setN((cur) => (cur >= N_MAX ? N_MIN : cur + 1));
    }, 220);
    return () => clearInterval(t);
  }, [playing]);

  // precompute polylines for each class across the n-domain
  const paths = useMemo(() => {
    return CLASSES.map((c) => {
      const pts: string[] = [];
      for (let x = N_MIN; x <= N_MAX; x += 1) {
        const ops = c.f(x);
        if (!isFinite(ops) && pts.length === 0) continue;
        pts.push(`${xOf(x).toFixed(1)},${yOf(ops).toFixed(1)}`);
        if (ops >= Y_CAP) break; // stop once it pins to the ceiling
      }
      return { ...c, d: "M" + pts.join(" L") };
    });
  }, []);

  // table rows for the current n
  const rows = useMemo(
    () =>
      CLASSES.map((c) => {
        const ops = c.f(n);
        return { ...c, ops, off: !isFinite(ops) || ops >= Y_CAP };
      }),
    [n],
  );

  // gridline op-counts (powers of 10 up to the cap)
  const yTicks = [1, 1e2, 1e4, 1e6, 1e8, 1e10, 1e12];

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-4 py-1">
          {/* ---- controls ---- */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="mono text-[10px] uppercase tracking-widest text-faint">
              input size n
            </span>
            <input
              type="range"
              min={N_MIN}
              max={N_MAX}
              value={n}
              onChange={(e) => {
                setPlaying(false);
                setN(Number(e.target.value));
              }}
              className="flex-1 min-w-[160px] accent-[#39c5e0]"
            />
            <span
              className="mono text-base font-bold tabular-nums"
              style={{ color: "#39c5e0", minWidth: 52 }}
            >
              n = {n}
            </span>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              {playing ? "❚❚ pause" : "▶ sweep"}
            </button>
          </div>

          {/* ---- plot ---- */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ maxHeight: 320 }}
            role="img"
            aria-label="Growth-rate curves on a log scale"
          >
            {/* y gridlines + labels (op counts, log scale) */}
            {yTicks.map((t) => {
              const y = yOf(t);
              return (
                <g key={t}>
                  <line
                    x1={PAD_L}
                    x2={W - PAD_R}
                    y1={y}
                    y2={y}
                    stroke="#1e2630"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_L - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="mono"
                    fontSize={9}
                    fill="#5b6b7d"
                  >
                    {t >= 1e6 ? `10^${Math.round(Math.log10(t))}` : fmt(t)}
                  </text>
                </g>
              );
            })}

            {/* ceiling banner */}
            <text
              x={W - PAD_R}
              y={PAD_T + 9}
              textAnchor="end"
              className="mono"
              fontSize={9}
              fill="#f85149"
            >
              ↑ off the chart (≥ 10¹²)
            </text>

            {/* current-n vertical marker */}
            <line
              x1={xOf(n)}
              x2={xOf(n)}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="#39c5e0"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />

            {/* curves */}
            {paths.map((p) => {
              const dim = hover !== null && hover !== p.key;
              return (
                <path
                  key={p.key}
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={hover === p.key ? 3 : 2}
                  opacity={dim ? 0.18 : 1}
                  style={{ transition: "opacity 120ms" }}
                />
              );
            })}

            {/* dot at intersection of marker and each curve */}
            {rows.map((r) =>
              r.off ? null : (
                <circle
                  key={r.key}
                  cx={xOf(n)}
                  cy={yOf(r.ops)}
                  r={hover === r.key ? 4.5 : 3}
                  fill={r.color}
                  opacity={hover !== null && hover !== r.key ? 0.18 : 1}
                />
              ),
            )}

            {/* x axis label */}
            <text
              x={(PAD_L + W - PAD_R) / 2}
              y={H - 6}
              textAnchor="middle"
              className="mono"
              fontSize={9}
              fill="#5b6b7d"
            >
              n →
            </text>
          </svg>

          {/* ---- legend (hover to isolate) ---- */}
          <div className="flex flex-wrap gap-1.5">
            {CLASSES.map((c) => (
              <button
                key={c.key}
                onMouseEnter={() => setHover(c.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(c.key)}
                onBlur={() => setHover(null)}
                className="mono text-[11px] rounded px-2 py-1 transition-all"
                style={{
                  background: hover === c.key ? c.color : "#10151d",
                  color: hover === c.key ? "#06121a" : c.color,
                  border: `1px solid ${hover === c.key ? c.color : "#1e2630"}`,
                  fontWeight: hover === c.key ? 700 : 400,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* ---- live operations table at current n ---- */}
          <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-[1fr_1.1fr_1.2fr] mono text-[10px] uppercase tracking-widest text-faint border-b border-border">
              <div className="px-3 py-2">growth class</div>
              <div className="px-3 py-2 text-right">ops at n = {n}</div>
              <div className="px-3 py-2 text-right">time @ 1 op/ns</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.key}
                onMouseEnter={() => setHover(r.key)}
                onMouseLeave={() => setHover(null)}
                className="grid grid-cols-[1fr_1.1fr_1.2fr] items-center text-sm transition-colors"
                style={{
                  background:
                    hover === r.key ? `${r.color}1a` : "transparent",
                  borderLeft: `2px solid ${
                    hover === r.key ? r.color : "transparent"
                  }`,
                }}
              >
                <div
                  className="px-3 py-1.5 mono text-xs font-bold"
                  style={{ color: r.color }}
                >
                  {r.label}
                </div>
                <div
                  className="px-3 py-1.5 mono text-right tabular-nums"
                  style={{ color: r.off ? "#f85149" : "#d6dee8" }}
                >
                  {fmt(r.ops)}
                </div>
                <div
                  className="px-3 py-1.5 mono text-right text-xs"
                  style={{ color: r.off ? "#f85149" : "#8a97a8" }}
                >
                  {humanTime(r.ops)}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted">
            At small n every curve looks the same — but{" "}
            <b className="text-text">asymptotic dominance</b> means the higher
            class eventually wins by an unbounded margin. Push n past ~20 and{" "}
            <span style={{ color: "#f778ba" }}>O(2ⁿ)</span> and{" "}
            <span style={{ color: "#f85149" }}>O(n!)</span> leave the chart for
            good — no faster computer saves them.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-faint mono text-center">
        Drag the slider (or ▶ sweep) to grow n. Hover a class to isolate its
        curve. y-axis is log-scaled and clamped at 10¹².
      </p>
    </div>
  );
}
