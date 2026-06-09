"use client";

import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ *
 *  cs12-03 — Bias-Variance & Regularization
 *  Fit polynomials of degree 1..9 to fixed noisy samples of a smooth
 *  curve. Watch underfit (high bias) → sweet spot → overfit (high
 *  variance). All math is deterministic; no RNG at runtime → SSR-safe.
 * ------------------------------------------------------------------ */

// Fixed noisy training samples of g(x)=sin(2πx) on x∈[0,1]. Noise baked in.
const TRAIN: ReadonlyArray<readonly [number, number]> = [
  [0.05, 0.45], [0.14, 0.95], [0.23, 1.30], [0.32, 0.70], [0.41, 0.35],
  [0.50, -0.25], [0.59, -0.45], [0.68, -1.05], [0.77, -0.60], [0.86, -0.15],
  [0.95, 0.55],
];

const TRUE = (x: number): number => Math.sin(2 * Math.PI * x);
// Center x into [-1,1] for a well-conditioned Vandermonde system.
const CX = (x: number): number => 2 * x - 1;

// Least-squares polynomial fit via normal equations + Gaussian elimination.
function fitPoly(degree: number): number[] {
  const n = degree + 1;
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const b: number[] = new Array<number>(n).fill(0);
  for (const [x0, y] of TRAIN) {
    const x = CX(x0);
    const pw: number[] = [];
    let p = 1;
    for (let i = 0; i < 2 * degree + 1; i++) { pw.push(p); p *= x; }
    for (let i = 0; i < n; i++) {
      b[i] += pw[i] * y;
      for (let j = 0; j < n; j++) A[i][j] += pw[i + j];
    }
  }
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
    [A[i], A[piv]] = [A[piv], A[i]];
    [b[i], b[piv]] = [b[piv], b[i]];
    const d = A[i][i];
    if (Math.abs(d) < 1e-12) continue;
    for (let j = i; j < n; j++) A[i][j] /= d;
    b[i] /= d;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = A[r][i];
      for (let j = i; j < n; j++) A[r][j] -= f * A[i][j];
      b[r] -= f * b[i];
    }
  }
  return b;
}

function evalPoly(coef: number[], x0: number): number {
  const x = CX(x0);
  let s = 0, p = 1;
  for (const c of coef) { s += c * p; p *= x; }
  return s;
}

function rmseTrain(coef: number[]): number {
  let s = 0;
  for (const [x, y] of TRAIN) s += (evalPoly(coef, x) - y) ** 2;
  return Math.sqrt(s / TRAIN.length);
}

// "Test" error = fidelity to the true generating curve over a dense grid.
function rmseTest(coef: number[]): number {
  let s = 0;
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    s += (evalPoly(coef, x) - TRUE(x)) ** 2;
  }
  return Math.sqrt(s / (N + 1));
}

const DEGREES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

type Curves = { fit: number[]; train: number; test: number };

export default function BiasVarianceViz() {
  const [degree, setDegree] = useState(1);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => {
      setDegree((d) => {
        if (d >= 9) { setPlay(false); return 9; }
        return d + 1;
      });
    }, 850);
    return () => clearInterval(t);
  }, [play]);

  // Per-degree fit + errors (deterministic; memoised by degree set).
  const all = useMemo<Record<number, Curves>>(() => {
    const out: Record<number, Curves> = {};
    for (const d of DEGREES) {
      const fit = fitPoly(d);
      out[d] = { fit, train: rmseTrain(fit), test: rmseTest(fit) };
    }
    return out;
  }, []);

  const cur = all[degree];

  // --- main plot geometry: x∈[0,1], y∈[-1.6,1.6] ---
  const PW = 360, PH = 220, PML = 30, PMB = 24, PMT = 12, PMR = 12;
  const ix = PW - PML - PMR, iy = PH - PMT - PMB;
  const sx = (x: number): number => PML + x * ix;
  const sy = (y: number): number => PMT + (1.6 - y) / 3.2 * iy;
  const clampY = (y: number): number => Math.max(-1.6, Math.min(1.6, y));

  const fitPath = useMemo(() => {
    const pts: string[] = [];
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      pts.push(`${sx(x).toFixed(1)},${sy(clampY(evalPoly(cur.fit, x))).toFixed(1)}`);
    }
    return "M" + pts.join(" L");
  }, [cur.fit]);

  const truePath = useMemo(() => {
    const pts: string[] = [];
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      pts.push(`${sx(x).toFixed(1)},${sy(TRUE(x)).toFixed(1)}`);
    }
    return "M" + pts.join(" L");
  }, []);

  // --- U-curve geometry ---
  const UW = 360, UH = 150, UML = 34, UMB = 26, UMT = 12, UMR = 10;
  const uix = UW - UML - UMR, uiy = UH - UMT - UMB;
  const maxErr = useMemo(() => {
    let m = 0;
    for (const d of DEGREES) m = Math.max(m, all[d].train, all[d].test);
    return m * 1.05;
  }, [all]);
  const ux = (d: number): number => UML + ((d - 1) / 8) * uix;
  const uy = (e: number): number => UMT + (1 - e / maxErr) * uiy;
  const linePath = (key: "train" | "test"): string =>
    "M" + DEGREES.map((d) => `${ux(d).toFixed(1)},${uy(all[d][key]).toFixed(1)}`).join(" L");

  // best (lowest test error) degree = the regularization sweet spot
  const bestDegree = useMemo(() => {
    let bd: number = DEGREES[0];
    for (const d of DEGREES) if (all[d].test < all[bd].test) bd = d;
    return bd;
  }, [all]);

  const verdict =
    degree <= 2
      ? { label: "UNDERFIT — high bias", color: "#58a6ff", note: "Too rigid to follow the curve. Big error even on its own training points." }
      : degree >= 8
        ? { label: "OVERFIT — high variance", color: "#f85149", note: "Wiggles through every noisy point. Tiny train error, but wild between points." }
        : degree === bestDegree
          ? { label: "SWEET SPOT — balanced", color: "#3fb950", note: "Captures the real shape, ignores the noise. Lowest error vs the true curve." }
          : { label: "good fit", color: "#39c5e0", note: "Close to the true curve — flexible enough without chasing noise." };

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* degree control */}
        <div className="flex items-center gap-3 py-1 flex-wrap">
          <span className="mono text-[11px] uppercase tracking-widest text-faint shrink-0">
            polynomial degree
          </span>
          <input
            type="range"
            min={1}
            max={9}
            step={1}
            value={degree}
            onChange={(e) => { setPlay(false); setDegree(Number(e.target.value)); }}
            className="flex-1 min-w-[160px] accent-[#3fb950]"
          />
          <span
            className="mono text-lg font-bold tabular-nums"
            style={{ color: verdict.color, minWidth: 28, textAlign: "right" }}
          >
            {degree}
          </span>
          <button
            onClick={() => { if (!play && degree >= 9) setDegree(1); setPlay((p) => !p); }}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text shrink-0"
          >
            {play ? "❚❚ pause" : "▶ sweep"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-3 mt-3">
          {/* fit plot */}
          <div className="card p-3">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1">
              the fit
            </div>
            <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full" style={{ maxHeight: 240 }}>
              {/* zero axis */}
              <line x1={PML} y1={sy(0)} x2={PW - PMR} y2={sy(0)} stroke="#1e2630" strokeWidth={1} />
              <line x1={PML} y1={PMT} x2={PML} y2={PH - PMB} stroke="#1e2630" strokeWidth={1} />
              {/* true underlying curve */}
              <path d={truePath} fill="none" stroke="#5b6b7d" strokeWidth={1.5} strokeDasharray="4 4" />
              {/* fitted polynomial */}
              <path
                d={fitPath}
                fill="none"
                stroke={verdict.color}
                strokeWidth={2.5}
                style={{ filter: `drop-shadow(0 0 4px ${verdict.color}88)` }}
              />
              {/* training points + residuals */}
              {TRAIN.map(([x, y], i) => {
                const yhat = clampY(evalPoly(cur.fit, x));
                return (
                  <g key={i}>
                    <line x1={sx(x)} y1={sy(y)} x2={sx(x)} y2={sy(yhat)} stroke="#e3a93c" strokeWidth={1} opacity={0.5} />
                    <circle cx={sx(x)} cy={sy(y)} r={3.5} fill="#e3a93c" stroke="#07090d" strokeWidth={1} />
                  </g>
                );
              })}
            </svg>
            <div className="flex items-center justify-center gap-4 mt-1 mono text-[9px] text-faint">
              <span><span style={{ color: "#e3a93c" }}>●</span> noisy data</span>
              <span><span style={{ color: "#5b6b7d" }}>--</span> true curve</span>
              <span style={{ color: verdict.color }}>━ model</span>
            </div>
          </div>

          {/* U-curve */}
          <div className="card p-3">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1">
              train vs test error
            </div>
            <svg viewBox={`0 0 ${UW} ${UH}`} className="w-full" style={{ maxHeight: 240 }}>
              <line x1={UML} y1={UH - UMB} x2={UW - UMR} y2={UH - UMB} stroke="#1e2630" strokeWidth={1} />
              <line x1={UML} y1={UMT} x2={UML} y2={UH - UMB} stroke="#1e2630" strokeWidth={1} />
              {/* sweet-spot marker */}
              <line
                x1={ux(bestDegree)} y1={UMT} x2={ux(bestDegree)} y2={UH - UMB}
                stroke="#3fb950" strokeWidth={1} strokeDasharray="3 3" opacity={0.5}
              />
              {/* current-degree marker */}
              <line
                x1={ux(degree)} y1={UMT} x2={ux(degree)} y2={UH - UMB}
                stroke={verdict.color} strokeWidth={1.5} opacity={0.6}
              />
              <path d={linePath("train")} fill="none" stroke="#39c5e0" strokeWidth={2} />
              <path d={linePath("test")} fill="none" stroke="#f778ba" strokeWidth={2} />
              {DEGREES.map((d) => (
                <g key={d}>
                  <circle cx={ux(d)} cy={uy(all[d].train)} r={d === degree ? 4 : 2.5} fill="#39c5e0" />
                  <circle cx={ux(d)} cy={uy(all[d].test)} r={d === degree ? 4 : 2.5} fill="#f778ba" />
                  <text x={ux(d)} y={UH - UMB + 12} textAnchor="middle" className="mono" fontSize={8} fill="#5b6b7d">{d}</text>
                </g>
              ))}
              <text x={(UML + UW - UMR) / 2} y={UH - 2} textAnchor="middle" className="mono" fontSize={8} fill="#5b6b7d">degree →</text>
            </svg>
            <div className="flex items-center justify-center gap-4 mt-1 mono text-[9px] text-faint">
              <span style={{ color: "#39c5e0" }}>━ train error</span>
              <span style={{ color: "#f778ba" }}>━ test error</span>
              <span style={{ color: "#3fb950" }}>┊ sweet spot (deg {bestDegree})</span>
            </div>
          </div>
        </div>

        {/* verdict + readouts */}
        <div className="grid grid-cols-3 gap-3 mt-3 text-center">
          <Stat label="train error" value={cur.train.toFixed(3)} color="#39c5e0" />
          <Stat label="test error" value={cur.test.toFixed(3)} color="#f778ba" />
          <Stat label="parameters" value={`${degree + 1}`} color={verdict.color} />
        </div>

        <div
          className="card mt-3 p-3 flex items-start gap-3"
          style={{ borderColor: `${verdict.color}55` }}
        >
          <span className="mono text-xs font-bold shrink-0 mt-0.5" style={{ color: verdict.color }}>
            {verdict.label}
          </span>
          <p className="text-sm text-muted">{verdict.note}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Drag the degree slider (or sweep 1→9). Train error always falls; test error is U-shaped —
        regularization is just choosing the degree at the bottom of that U.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-sm font-bold mt-0.5 tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}
