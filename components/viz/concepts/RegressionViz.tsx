"use client";

import { useMemo, useState } from "react";

/* cs12-02 — Linear & Logistic Regression
 * Drag the line (slope + intercept), watch the vertical residuals and the
 * sum of squared errors update live. "Fit" snaps to the analytic
 * least-squares line that minimises SSE. */

type Pt = { x: number; y: number };

// 8 deterministic points (roughly linear with noise). Data space: x,y in [0,10].
const POINTS: Pt[] = [
  { x: 0.6, y: 1.4 },
  { x: 1.5, y: 2.0 },
  { x: 2.4, y: 3.6 },
  { x: 3.7, y: 3.2 },
  { x: 4.8, y: 5.5 },
  { x: 6.1, y: 5.0 },
  { x: 7.5, y: 7.8 },
  { x: 9.0, y: 8.1 },
];

// Analytic ordinary-least-squares fit: minimise sum (y - (m x + b))^2.
function leastSquares(pts: Pt[]): { m: number; b: number } {
  const n = pts.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sxx += p.x * p.x;
  }
  const denom = n * sxx - sx * sx;
  const m = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { m, b };
}

const OLS = leastSquares(POINTS);

export default function RegressionViz() {
  const [m, setM] = useState(0.4); // slope
  const [b, setB] = useState(2.6); // intercept
  const [hover, setHover] = useState<number | null>(null);

  // SVG geometry. Data x,y in [0,10] mapped into the plot box.
  const W = 460, H = 320;
  const pad = 38;
  const px = (x: number) => pad + (x / 10) * (W - 2 * pad);
  const py = (y: number) => H - pad - (y / 10) * (H - 2 * pad);
  const lineY = (x: number) => m * x + b;

  const residuals = useMemo(
    () => POINTS.map((p) => p.y - lineY(p.x)),
    [m, b],
  );
  const sse = useMemo(
    () => residuals.reduce((acc, r) => acc + r * r, 0),
    [residuals],
  );
  const olsSse = useMemo(() => {
    let s = 0;
    for (const p of POINTS) {
      const r = p.y - (OLS.m * p.x + OLS.b);
      s += r * r;
    }
    return s;
  }, []);

  const atFit = Math.abs(m - OLS.m) < 0.02 && Math.abs(b - OLS.b) < 0.02;

  // line endpoints across the plot
  const x0 = 0, x1 = 10;
  const ly0 = Math.max(-2, Math.min(12, lineY(x0)));
  const ly1 = Math.max(-2, Math.min(12, lineY(x1)));

  return (
    <div className="card p-5 grid-bg">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* ---- plot ---- */}
        <div className="flex-1 min-w-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ maxHeight: 340 }}
            role="img"
            aria-label="Scatter plot with a draggable regression line and residuals"
          >
            {/* axes */}
            <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#1e2630" strokeWidth={1} />
            <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#1e2630" strokeWidth={1} />
            {[2, 4, 6, 8].map((g) => (
              <g key={g}>
                <line x1={px(g)} y1={pad} x2={px(g)} y2={H - pad} stroke="#10151d" strokeWidth={1} />
                <line x1={pad} y1={py(g)} x2={W - pad} y2={py(g)} stroke="#10151d" strokeWidth={1} />
              </g>
            ))}
            <text x={W - pad} y={H - pad + 18} textAnchor="end" className="mono" fill="#5b6b7d" fontSize={10}>x →</text>
            <text x={pad - 6} y={pad - 8} textAnchor="start" className="mono" fill="#5b6b7d" fontSize={10}>y</text>

            {/* squared-error boxes (area = r^2, the thing we minimise) */}
            {POINTS.map((p, i) => {
              const yhat = lineY(p.x);
              const r = residuals[i];
              const side = px(Math.abs(r)) - px(0); // pixels per |r| in data units
              const topY = Math.min(py(p.y), py(yhat));
              const isHot = hover === i;
              return (
                <rect
                  key={`sq-${i}`}
                  x={px(p.x)}
                  y={topY}
                  width={side}
                  height={Math.abs(py(p.y) - py(yhat))}
                  fill={isHot ? "#f8514922" : "#f8514912"}
                  stroke={isHot ? "#f85149" : "none"}
                  strokeWidth={1}
                />
              );
            })}

            {/* residual segments */}
            {POINTS.map((p, i) => (
              <line
                key={`res-${i}`}
                x1={px(p.x)}
                y1={py(p.y)}
                x2={px(p.x)}
                y2={py(lineY(p.x))}
                stroke={hover === i ? "#f85149" : "#e3a93c"}
                strokeWidth={hover === i ? 2 : 1.5}
                strokeDasharray="3 3"
              />
            ))}

            {/* regression line */}
            <line
              x1={px(x0)}
              y1={py(ly0)}
              x2={px(x1)}
              y2={py(ly1)}
              stroke={atFit ? "#56d364" : "#39c5e0"}
              strokeWidth={2.5}
            />

            {/* points */}
            {POINTS.map((p, i) => (
              <circle
                key={`pt-${i}`}
                cx={px(p.x)}
                cy={py(p.y)}
                r={hover === i ? 6 : 4.5}
                fill={hover === i ? "#f85149" : "#58a6ff"}
                stroke="#07090d"
                strokeWidth={1.5}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </svg>
        </div>

        {/* ---- controls + readout ---- */}
        <div className="lg:w-56 shrink-0 space-y-4">
          <div className="space-y-3">
            <Slider
              label="slope (m)"
              value={m}
              min={-1}
              max={2}
              step={0.01}
              color="#39c5e0"
              onChange={setM}
            />
            <Slider
              label="intercept (b)"
              value={b}
              min={-2}
              max={6}
              step={0.01}
              color="#bc8cff"
              onChange={setB}
            />
          </div>

          <div
            className="card p-3 text-center"
            style={{ borderColor: atFit ? "#3fb950" : "#1e2630" }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              sum of squared errors
            </div>
            <div
              className="mono text-2xl font-bold mt-1"
              style={{ color: atFit ? "#56d364" : "#e3a93c" }}
            >
              {sse.toFixed(2)}
            </div>
            <div className="mono text-[10px] text-faint mt-1">
              minimum = {olsSse.toFixed(2)}
            </div>
            {/* how far above the minimum we are */}
            <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#161c26" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (olsSse / sse) * 100)}%`,
                  background: atFit ? "#3fb950" : "#39c5e0",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setM(Number(OLS.m.toFixed(2)));
                setB(Number(OLS.b.toFixed(2)));
              }}
              className="mono text-[11px] rounded px-2 py-2 font-semibold transition-all"
              style={{
                background: "#3fb950",
                color: "#06121a",
                border: "1px solid #3fb950",
              }}
            >
              ▸ fit
            </button>
            <button
              onClick={() => {
                setM(0.4);
                setB(2.6);
              }}
              className="mono text-[11px] rounded border border-border px-2 py-2 text-faint hover:text-text"
            >
              ⟲ reset
            </button>
          </div>

          <div className="mono text-[11px] text-center" style={{ color: atFit ? "#56d364" : "#8a97a8" }}>
            ŷ = {m.toFixed(2)}·x {b >= 0 ? "+" : "−"} {Math.abs(b).toFixed(2)}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-faint mono text-center">
        Drag the sliders to tilt &amp; shift the line — the amber dashes are residuals,
        the red squares are their <i>squared</i> errors. SSE is the total red area;
        <span className="text-green"> fit</span> jumps to the line where that area is smallest.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="mono text-[10px] uppercase tracking-widest text-faint">{label}</span>
        <span className="mono text-xs font-bold" style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}