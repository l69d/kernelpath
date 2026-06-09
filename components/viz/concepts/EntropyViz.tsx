"use client";

import { useMemo, useState } from "react";

/* ================================================================== *
 *  cs1-08 — Information Theory
 *  A biased coin with probability p. Plot the binary entropy
 *  H(p) = -p·log2 p - (1-p)·log2(1-p), framed as "average bits of
 *  surprise". Drag the slider: entropy peaks at p=0.5 (1 bit, max
 *  uncertainty) and falls to 0 at the extremes (no surprise — you
 *  already know the answer).
 * ================================================================== */

const W = 560;
const Hh = 240;
const PAD_L = 46;
const PAD_R = 18;
const PAD_T = 16;
const PAD_B = 34;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = Hh - PAD_T - PAD_B;

function entropy(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

function surprise(p: number): number {
  // bits of surprise of a single outcome with probability p
  if (p <= 0) return Infinity;
  return -Math.log2(p);
}

// map p∈[0,1] → svg x, H∈[0,1] → svg y (inverted)
const px = (p: number): number => PAD_L + p * PLOT_W;
const py = (h: number): number => PAD_T + (1 - h) * PLOT_H;

const GREEN = "#3fb950";
const CYAN = "#39c5e0";
const AMBER = "#e3a93c";
const MUTED = "#8a97a8";
const BORDER = "#1e2630";

export default function EntropyViz() {
  const [p, setP] = useState(0.5);

  const curve = useMemo(() => {
    const pts: string[] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const pp = i / N;
      pts.push(`${px(pp).toFixed(2)},${py(entropy(pp)).toFixed(2)}`);
    }
    return pts.join(" ");
  }, []);

  const h = entropy(p);
  const sHeads = surprise(p);
  const sTails = surprise(1 - p);
  const headsPct = Math.round(p * 100);
  const tailsPct = 100 - headsPct;

  const fmt = (n: number): string => (Number.isFinite(n) ? n.toFixed(2) : "∞");

  // verdict text driven by where we are on the curve
  const verdict =
    h > 0.97
      ? "Maximum uncertainty — a fair coin. Every flip costs a full bit to describe."
      : h < 0.15
        ? "Almost no uncertainty — you can guess the outcome. Barely any surprise to encode."
        : "Biased coin. The likely side surprises you little; you need under a bit per flip.";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* probability slider */}
        <div className="py-1">
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-[10px] uppercase tracking-widest text-faint">
              P(heads) = p
            </span>
            <span className="mono text-sm font-bold" style={{ color: CYAN }}>
              {p.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p}
            onChange={(e) => setP(Number(e.target.value))}
            className="w-full accent-[#39c5e0]"
            aria-label="probability of heads"
          />
        </div>

        {/* coin: split heads/tails by probability */}
        <div className="mt-3 flex items-center gap-3">
          <div
            className="flex h-9 flex-1 overflow-hidden rounded"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <div
              className="grid place-items-center transition-all"
              style={{
                width: `${headsPct}%`,
                background: `${GREEN}26`,
                color: GREEN,
                borderRight: headsPct > 0 && headsPct < 100 ? `1px solid ${GREEN}` : undefined,
              }}
            >
              {headsPct >= 18 && (
                <span className="mono text-[11px] font-bold">H · {headsPct}%</span>
              )}
            </div>
            <div
              className="grid place-items-center transition-all"
              style={{
                width: `${tailsPct}%`,
                background: `${AMBER}22`,
                color: AMBER,
              }}
            >
              {tailsPct >= 18 && (
                <span className="mono text-[11px] font-bold">T · {tailsPct}%</span>
              )}
            </div>
          </div>
        </div>

        {/* H(p) curve */}
        <svg
          viewBox={`0 0 ${W} ${Hh}`}
          className="w-full mt-4"
          style={{ maxHeight: 260 }}
          role="img"
          aria-label="binary entropy curve"
        >
          {/* gridlines: H = 0, 0.5, 1 */}
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={py(g)}
                y2={py(g)}
                stroke={BORDER}
                strokeDasharray={g === 1 ? "3 3" : undefined}
              />
              <text
                x={PAD_L - 8}
                y={py(g) + 3}
                textAnchor="end"
                className="mono"
                fontSize={9}
                fill={MUTED}
              >
                {g.toFixed(1)}
              </text>
            </g>
          ))}

          {/* x ticks: 0, 0.5, 1 */}
          {[0, 0.5, 1].map((t) => (
            <text
              key={t}
              x={px(t)}
              y={Hh - 14}
              textAnchor="middle"
              className="mono"
              fontSize={9}
              fill={MUTED}
            >
              {t.toFixed(1)}
            </text>
          ))}
          <text
            x={PAD_L + PLOT_W / 2}
            y={Hh - 2}
            textAnchor="middle"
            className="mono"
            fontSize={9}
            fill="#5b6b7d"
          >
            p = P(heads)
          </text>
          <text
            x={12}
            y={PAD_T + PLOT_H / 2}
            textAnchor="middle"
            className="mono"
            fontSize={9}
            fill="#5b6b7d"
            transform={`rotate(-90 12 ${PAD_T + PLOT_H / 2})`}
          >
            H(p) — bits
          </text>

          {/* peak guide at p=0.5 */}
          <line
            x1={px(0.5)}
            x2={px(0.5)}
            y1={py(1)}
            y2={py(0)}
            stroke={GREEN}
            strokeDasharray="2 4"
            opacity={0.35}
          />

          {/* the entropy curve */}
          <polyline
            points={curve}
            fill="none"
            stroke={CYAN}
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* drop line from current point */}
          <line
            x1={px(p)}
            x2={px(p)}
            y1={py(h)}
            y2={py(0)}
            stroke={AMBER}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          {/* marker */}
          <circle cx={px(p)} cy={py(h)} r={6} fill={AMBER} stroke="#07090d" strokeWidth={2} />
          <text
            x={px(p)}
            y={py(h) - 12}
            textAnchor={p > 0.85 ? "end" : p < 0.15 ? "start" : "middle"}
            className="mono"
            fontSize={11}
            fontWeight={700}
            fill={AMBER}
          >
            {h.toFixed(3)} bits
          </text>
        </svg>

        {/* readouts */}
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="entropy H(p)" value={`${h.toFixed(3)} bits`} color={AMBER} />
          <Stat label="surprise if heads" value={`${fmt(sHeads)} bits`} color={GREEN} />
          <Stat label="surprise if tails" value={`${fmt(sTails)} bits`} color={CYAN} />
        </div>

        <p className="mt-3 text-center text-sm text-muted">
          {verdict}
        </p>
        <p className="mt-1 text-center text-xs text-faint">
          Entropy is the <b className="text-text">average surprise</b>: weight each
          outcome&apos;s surprise by how often it happens —{" "}
          <span className="mono text-cyan">p·{fmt(sHeads)} + (1−p)·{fmt(sTails)} = {h.toFixed(3)}</span>.
        </p>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        H(p) = −p·log₂p − (1−p)·log₂(1−p) · peaks at p=0.5 (1 bit) · →0 at the certain extremes
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