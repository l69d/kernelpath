"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs13-02 — Convolutional Neural Networks
 *  A 3x3 kernel slides over a 7x7 input. At each stop we show the
 *  element-wise multiply-and-sum that produces one output cell, and
 *  let you watch edges light up in the feature map.
 * ================================================================== */

const N = 7; // input is N x N
const K = 3; // kernel is K x K
const OUT = N - K + 1; // valid-conv output side (5)

// A simple bright square sitting on a dark field — easy to "see" edges.
const INPUT: number[][] = (() => {
  const g: number[][] = Array.from({ length: N }, () => Array<number>(N).fill(0));
  for (let r = 1; r <= 5; r++) for (let c = 1; c <= 5; c++) g[r][c] = 0.15;
  for (let r = 2; r <= 4; r++) for (let c = 2; c <= 4; c++) g[r][c] = 1;
  return g;
})();

type Kern = { id: string; name: string; m: number[][]; c: string; about: string };

const KERNELS: Kern[] = [
  {
    id: "edge",
    name: "Edge detect",
    c: "#39c5e0",
    about: "Subtracts neighbours from the centre — flat regions cancel to 0, only edges survive.",
    m: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
  },
  {
    id: "sobelx",
    name: "Vertical edges",
    c: "#bc8cff",
    about: "A Sobel filter — large response where brightness changes left-to-right.",
    m: [
      [1, 0, -1],
      [2, 0, -2],
      [1, 0, -1],
    ],
  },
  {
    id: "blur",
    name: "Box blur",
    c: "#e3a93c",
    about: "Averages the 3×3 neighbourhood — smooths the image, the opposite of sharpening.",
    m: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
  },
  {
    id: "sharp",
    name: "Sharpen",
    c: "#f778ba",
    about: "Boosts the centre against its neighbours, exaggerating local contrast.",
    m: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
];

function convAt(input: number[][], k: number[][], or: number, oc: number): number {
  let s = 0;
  for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) s += input[or + i][oc + j] * k[i][j];
  return s;
}

// Full feature map for the active kernel (deterministic, memoised).
function featureMap(k: number[][]): { vals: number[][]; max: number } {
  const vals: number[][] = [];
  let max = 1e-6;
  for (let r = 0; r < OUT; r++) {
    const row: number[] = [];
    for (let c = 0; c < OUT; c++) {
      const v = convAt(INPUT, k, r, c);
      row.push(v);
      if (Math.abs(v) > max) max = Math.abs(v);
    }
    vals.push(row);
  }
  return { vals, max };
}

function grey(v: number): string {
  const x = Math.max(0, Math.min(1, v));
  const g = Math.round(20 + x * 220);
  return `rgb(${g},${g},${g})`;
}

export default function ConvolutionViz() {
  const [kIdx, setKIdx] = useState(0);
  const [pos, setPos] = useState(12); // 0..OUT*OUT-1, the kernel's top-left position
  const [auto, setAuto] = useState(true);

  const kern = KERNELS[kIdx];
  const map = useMemo(() => featureMap(kern.m), [kern]);

  const or = Math.floor(pos / OUT);
  const oc = pos % OUT;
  const result = map.vals[or][oc];
  const shown = Math.min(pos, OUT * OUT - 1); // how many output cells revealed

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setPos((p) => (p + 1) % (OUT * OUT)), 650);
    return () => clearInterval(t);
  }, [auto]);

  const cell = 30;
  const gap = 3;
  const span = (n: number) => n * cell + (n - 1) * gap;

  // Per-term products under the kernel window, for the multiply-and-sum readout.
  const terms: { in: number; w: number }[] = [];
  for (let i = 0; i < K; i++)
    for (let j = 0; j < K; j++) terms.push({ in: INPUT[or + i][oc + j], w: kern.m[i][j] });

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* kernel picker */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
          {KERNELS.map((k, i) => (
            <button
              key={k.id}
              onClick={() => setKIdx(i)}
              className="rounded-lg px-3 py-1.5 transition-all"
              style={{
                background: i === kIdx ? k.c : "#10151d",
                border: `1px solid ${i === kIdx ? k.c : "#1e2630"}`,
                color: i === kIdx ? "#06121a" : "#8a97a8",
              }}
            >
              <span className="mono text-[11px] font-bold whitespace-nowrap">{k.name}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
          {/* INPUT grid with sliding window */}
          <div className="flex flex-col items-center gap-2">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">input · 7×7</div>
            <svg
              viewBox={`0 0 ${span(N)} ${span(N)}`}
              className="w-full"
              style={{ maxWidth: span(N), maxHeight: span(N) }}
            >
              {INPUT.map((row, r) =>
                row.map((v, c) => {
                  const under = r >= or && r < or + K && c >= oc && c < oc + K;
                  return (
                    <g key={`${r}-${c}`}>
                      <rect
                        x={c * (cell + gap)}
                        y={r * (cell + gap)}
                        width={cell}
                        height={cell}
                        rx={3}
                        fill={grey(v)}
                        stroke={under ? kern.c : "#1e2630"}
                        strokeWidth={under ? 2 : 1}
                      />
                      <text
                        x={c * (cell + gap) + cell / 2}
                        y={r * (cell + gap) + cell / 2 + 3}
                        textAnchor="middle"
                        className="mono"
                        fontSize={9}
                        fill={v > 0.5 ? "#07090d" : "#5b6b7d"}
                      >
                        {v === 1 ? "1" : v === 0 ? "0" : v.toFixed(1).slice(1)}
                      </text>
                    </g>
                  );
                }),
              )}
              {/* highlight the kernel window outline */}
              <rect
                x={oc * (cell + gap) - 1.5}
                y={or * (cell + gap) - 1.5}
                width={span(K) + 3}
                height={span(K) + 3}
                rx={4}
                fill="none"
                stroke={kern.c}
                strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 6px ${kern.c})` }}
              />
            </svg>
          </div>

          {/* operator: kernel + multiply-sum */}
          <div className="flex flex-col items-center gap-3 pt-6">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">kernel · 3×3</div>
            <svg
              viewBox={`0 0 ${span(K)} ${span(K)}`}
              style={{ width: span(K), height: span(K) }}
            >
              {kern.m.map((row, r) =>
                row.map((w, c) => (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={c * (cell + gap)}
                      y={r * (cell + gap)}
                      width={cell}
                      height={cell}
                      rx={3}
                      fill="#161c26"
                      stroke={kern.c}
                      strokeWidth={1}
                    />
                    <text
                      x={c * (cell + gap) + cell / 2}
                      y={r * (cell + gap) + cell / 2 + 3}
                      textAnchor="middle"
                      className="mono"
                      fontSize={9}
                      fill={kern.c}
                    >
                      {Number.isInteger(w) ? w : w.toFixed(2)}
                    </text>
                  </g>
                )),
              )}
            </svg>
            <div className="text-faint text-lg mono">↓ ⊙ then Σ</div>
            <div className="card px-3 py-2 text-center" style={{ minWidth: 120 }}>
              <div className="mono text-[9px] uppercase tracking-widest text-faint">output cell</div>
              <div className="mono text-xl font-bold" style={{ color: kern.c }}>
                {result.toFixed(2)}
              </div>
            </div>
          </div>

          {/* OUTPUT feature map, revealed cell-by-cell */}
          <div className="flex flex-col items-center gap-2">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">feature map · 5×5</div>
            <svg
              viewBox={`0 0 ${span(OUT)} ${span(OUT)}`}
              className="w-full"
              style={{ maxWidth: span(OUT), maxHeight: span(OUT) }}
            >
              {map.vals.map((row, r) =>
                row.map((v, c) => {
                  const idx = r * OUT + c;
                  const revealed = idx <= shown;
                  const isNow = idx === pos;
                  const norm = Math.abs(v) / map.max;
                  return (
                    <g key={`${r}-${c}`}>
                      <rect
                        x={c * (cell + gap)}
                        y={r * (cell + gap)}
                        width={cell}
                        height={cell}
                        rx={3}
                        fill={revealed ? grey(norm) : "#0b0f15"}
                        stroke={isNow ? kern.c : "#1e2630"}
                        strokeWidth={isNow ? 2 : 1}
                        style={isNow ? { filter: `drop-shadow(0 0 6px ${kern.c})` } : undefined}
                      />
                      {revealed && (
                        <text
                          x={c * (cell + gap) + cell / 2}
                          y={r * (cell + gap) + cell / 2 + 3}
                          textAnchor="middle"
                          className="mono"
                          fontSize={8}
                          fill={norm > 0.5 ? "#07090d" : "#5b6b7d"}
                        >
                          {v.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                }),
              )}
            </svg>
          </div>
        </div>

        {/* multiply-and-sum expansion for the current position */}
        <div className="card mt-5 p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
            element-wise multiply &amp; sum at this position
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {terms.map((t, i) => {
              const prod = t.in * t.w;
              return (
                <span key={i} className="mono text-[10px] flex items-center gap-1">
                  <span
                    className="rounded px-1 py-0.5"
                    style={{
                      background: prod === 0 ? "#10151d" : `${kern.c}22`,
                      color: prod === 0 ? "#5b6b7d" : kern.c,
                      border: `1px solid ${prod === 0 ? "#1e2630" : kern.c + "55"}`,
                    }}
                  >
                    {t.in === 1 ? "1" : t.in.toFixed(1).replace(/^0/, "")}·
                    {Number.isInteger(t.w) ? t.w : t.w.toFixed(2)}
                  </span>
                  {i < terms.length - 1 && <span className="text-faint">+</span>}
                </span>
              );
            })}
            <span className="mono text-[11px] text-text ml-1">
              = <b style={{ color: kern.c }}>{result.toFixed(2)}</b>
            </span>
          </div>
        </div>

        {/* about + controls */}
        <p className="mt-3 text-center text-sm text-muted">{kern.about}</p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setAuto(false);
              setPos((p) => (p - 1 + OUT * OUT) % (OUT * OUT));
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ◀ prev
          </button>
          <button
            onClick={() => setAuto((a) => !a)}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            {auto ? "❚❚ pause slide" : "▶ play slide"}
          </button>
          <button
            onClick={() => {
              setAuto(false);
              setPos((p) => (p + 1) % (OUT * OUT));
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            next ▶
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        The kernel strides across every position; each stop multiplies the 9 overlapping pixels by the
        9 weights and sums them into one output cell. Flat areas cancel, edges light up.
      </p>
    </div>
  );
}