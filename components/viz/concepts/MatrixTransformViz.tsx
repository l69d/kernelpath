"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ================================================================== *
 *  cs1-03 — Linear Algebra I: a 2x2 matrix IS a linear transformation.
 *  Edit [[a,b],[c,d]] with sliders; the grid, basis vectors and unit
 *  square deform live. The determinant reads out as the signed area
 *  scale of the unit square -> parallelogram.
 * ================================================================== */

type Vec = { x: number; y: number };
type Mat = { a: number; b: number; c: number; d: number };

const VIEW_W = 440;
const VIEW_H = 320;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const UNIT = 42; // pixels per unit length

// math-space (x right, y up) -> screen-space (y down)
function toScreen(v: Vec): Vec {
  return { x: CX + v.x * UNIT, y: CY - v.y * UNIT };
}
// apply matrix to a math-space vector
function apply(m: Mat, v: Vec): Vec {
  return { x: m.a * v.x + m.b * v.y, y: m.c * v.x + m.d * v.y };
}

type Preset = { k: string; m: Mat; note: string };
const PRESETS: Preset[] = [
  { k: "identity", m: { a: 1, b: 0, c: 0, d: 1 }, note: "does nothing — every vector maps to itself" },
  { k: "scale 2×", m: { a: 2, b: 0, c: 0, d: 2 }, note: "stretches space; area ×4, so det = 4" },
  { k: "rotate 90°", m: { a: 0, b: -1, c: 1, d: 0 }, note: "spins space a quarter turn; area unchanged, det = 1" },
  { k: "shear", m: { a: 1, b: 1, c: 0, d: 1 }, note: "slides the top sideways; area unchanged, det = 1" },
  { k: "flip x", m: { a: -1, b: 0, c: 0, d: 1 }, note: "mirrors across the y-axis; orientation flips, det = −1" },
  { k: "collapse", m: { a: 1, b: 2, c: 0.5, d: 1 }, note: "near-singular: squashes the plane; det → 0" },
];

const G = "#3fb950"; // i-hat / green
const C = "#39c5e0"; // j-hat / cyan
const P = "#bc8cff"; // parallelogram / purple
const RED = "#f85149";

export default function MatrixTransformViz() {
  const [m, setM] = useState<Mat>({ a: 1, b: 0, c: 0, d: 1 });
  // animation: when a preset is picked we lerp current -> target
  const targetRef = useRef<Mat | null>(null);

  useEffect(() => {
    const t = targetRef.current;
    if (!t) return;
    const id = setInterval(() => {
      setM((cur) => {
        const goal = targetRef.current;
        if (!goal) return cur;
        const lerp = (x: number, y: number) => x + (y - x) * 0.18;
        const next: Mat = {
          a: lerp(cur.a, goal.a),
          b: lerp(cur.b, goal.b),
          c: lerp(cur.c, goal.c),
          d: lerp(cur.d, goal.d),
        };
        const done =
          Math.abs(next.a - goal.a) +
            Math.abs(next.b - goal.b) +
            Math.abs(next.c - goal.c) +
            Math.abs(next.d - goal.d) <
          0.001;
        if (done) {
          targetRef.current = null;
          return goal;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [m]);

  const animateTo = (goal: Mat) => {
    targetRef.current = goal;
    setM((cur) => ({ ...cur })); // kick the effect
  };
  const set = (key: keyof Mat, val: number) => {
    targetRef.current = null;
    setM((cur) => ({ ...cur, [key]: val }));
  };

  const det = useMemo(() => m.a * m.d - m.b * m.c, [m]);

  // transformed basis vectors + unit-square corners
  const iHat = apply(m, { x: 1, y: 0 });
  const jHat = apply(m, { x: 0, y: 1 });
  const square: Vec[] = [
    { x: 0, y: 0 },
    iHat,
    { x: iHat.x + jHat.x, y: iHat.y + jHat.y },
    jHat,
  ];
  const polyPts = square.map(toScreen).map((p) => `${p.x},${p.y}`).join(" ");

  // transformed grid lines from -4..4 in each axis
  const gridLines = useMemo(() => {
    const lines: { p1: Vec; p2: Vec; major: boolean }[] = [];
    const R = 5;
    for (let n = -R; n <= R; n++) {
      // vertical line x = n  (varies in y)
      lines.push({
        p1: toScreen(apply(m, { x: n, y: -R })),
        p2: toScreen(apply(m, { x: n, y: R })),
        major: n === 0,
      });
      // horizontal line y = n  (varies in x)
      lines.push({
        p1: toScreen(apply(m, { x: -R, y: n })),
        p2: toScreen(apply(m, { x: R, y: n })),
        major: n === 0,
      });
    }
    return lines;
  }, [m]);

  const origin = toScreen({ x: 0, y: 0 });
  const iTip = toScreen(iHat);
  const jTip = toScreen(jHat);
  const fmt = (n: number) => (Math.abs(n) < 0.005 ? "0" : n.toFixed(2));
  const detColor = det < -0.001 ? RED : Math.abs(det) < 0.05 ? "#e3a93c" : P;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col lg:flex-row gap-5 py-1">
          {/* ---- the plane ---- */}
          <div className="flex-1 min-w-[300px]">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="w-full rounded-lg"
              style={{ maxHeight: 340, background: "#07090d", border: "1px solid #1e2630" }}
            >
              {/* transformed grid */}
              {gridLines.map((l, i) => (
                <line
                  key={i}
                  x1={l.p1.x}
                  y1={l.p1.y}
                  x2={l.p2.x}
                  y2={l.p2.y}
                  stroke={l.major ? "#2b3a49" : "#161c26"}
                  strokeWidth={l.major ? 1.4 : 1}
                />
              ))}

              {/* unit square -> parallelogram */}
              <polygon
                points={polyPts}
                fill={`${detColor}26`}
                stroke={detColor}
                strokeWidth={1.5}
              />

              {/* basis vectors */}
              <defs>
                <marker id="ah-i" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill={G} />
                </marker>
                <marker id="ah-j" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill={C} />
                </marker>
              </defs>
              <line
                x1={origin.x}
                y1={origin.y}
                x2={iTip.x}
                y2={iTip.y}
                stroke={G}
                strokeWidth={2.4}
                markerEnd="url(#ah-i)"
              />
              <line
                x1={origin.x}
                y1={origin.y}
                x2={jTip.x}
                y2={jTip.y}
                stroke={C}
                strokeWidth={2.4}
                markerEnd="url(#ah-j)"
              />
              <circle cx={origin.x} cy={origin.y} r={3} fill="#d6dee8" />
              <text x={iTip.x + 6} y={iTip.y + 4} fill={G} className="mono" fontSize={12} fontWeight={700}>
                î
              </text>
              <text x={jTip.x + 6} y={jTip.y + 4} fill={C} className="mono" fontSize={12} fontWeight={700}>
                ĵ
              </text>
            </svg>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
              {PRESETS.map((pr) => (
                <button
                  key={pr.k}
                  onClick={() => animateTo(pr.m)}
                  className="mono text-[11px] rounded border border-border px-2.5 py-1 text-faint hover:text-text transition-colors"
                  style={{ background: "#10151d" }}
                >
                  {pr.k}
                </button>
              ))}
            </div>
          </div>

          {/* ---- controls + readouts ---- */}
          <div className="lg:w-[270px] space-y-3">
            {/* matrix grid */}
            <div className="card p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
                the matrix
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-faint">[</span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-center">
                  <Cell label="a" value={m.a} color={G} />
                  <Cell label="b" value={m.b} color={C} />
                  <Cell label="c" value={m.c} color={G} />
                  <Cell label="d" value={m.d} color={C} />
                </div>
                <span className="text-2xl text-faint">]</span>
              </div>
              <p className="text-[11px] text-muted mt-2 leading-snug text-center">
                column 1 is where{" "}
                <b style={{ color: G }}>î</b> lands; column 2 is where{" "}
                <b style={{ color: C }}>ĵ</b> lands.
              </p>
            </div>

            {/* sliders */}
            <div className="card p-3 space-y-2.5">
              <Slider name="a" val={m.a} color={G} onChange={(v) => set("a", v)} />
              <Slider name="b" val={m.b} color={C} onChange={(v) => set("b", v)} />
              <Slider name="c" val={m.c} color={G} onChange={(v) => set("c", v)} />
              <Slider name="d" val={m.d} color={C} onChange={(v) => set("d", v)} />
            </div>

            {/* determinant readout */}
            <div className="card p-3 text-center">
              <div className="mono text-[10px] uppercase tracking-widest text-faint">
                determinant · area scale
              </div>
              <div className="mono text-2xl font-bold mt-1" style={{ color: detColor }}>
                {fmt(det)}
              </div>
              <div className="mono text-[11px] text-muted mt-0.5">
                ad − bc = {fmt(m.a)}·{fmt(m.d)} − {fmt(m.b)}·{fmt(m.c)}
              </div>
              <p className="text-[11px] mt-1.5 leading-snug" style={{ color: detColor }}>
                {det < -0.001
                  ? "negative → space is flipped inside-out"
                  : Math.abs(det) < 0.05
                    ? "≈ 0 → the plane is squashed onto a line"
                    : `the unit square's area is scaled ×${fmt(Math.abs(det))}`}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-faint mono text-center">
        Drag a slider or pick a preset. The grid bends because a 2×2 matrix <i>is</i> a
        linear map — and its determinant is exactly the signed area of the parallelogram.
      </p>
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="grid place-items-center rounded mono text-sm font-bold"
      style={{ width: 52, height: 36, background: "#161c26", border: `1px solid ${color}55`, color }}
      title={label}
    >
      {Math.abs(value) < 0.005 ? "0" : value.toFixed(1)}
    </div>
  );
}

function Slider({
  name,
  val,
  color,
  onChange,
}: {
  name: string;
  val: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-xs font-bold w-3" style={{ color }}>
        {name}
      </span>
      <input
        type="range"
        min={-3}
        max={3}
        step={0.1}
        value={val}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
        style={{ accentColor: color }}
      />
      <span className="mono text-[11px] text-muted w-9 text-right">
        {val.toFixed(1)}
      </span>
    </div>
  );
}
