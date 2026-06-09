"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  cs1-04  Eigenvalues & SVD — "a direction the matrix can't turn"
 *  Fixed 2x2 matrix A = [[2,1],[0,3]]  (real eigenvalues 2 and 3).
 *  Ring of input vectors rotate off their line under A; the two
 *  eigenvectors only get scaled. Drag a probe to hunt for alignment.
 * ------------------------------------------------------------------ */

type Vec = { x: number; y: number };

const A: [number, number, number, number] = [2, 1, 0, 3]; // a b c d, row-major
// eigenpairs of [[2,1],[0,3]]: λ=2 → (1,0) ; λ=3 → (1,1)/√2
const EIGS: { lambda: number; dir: Vec; color: string }[] = [
  { lambda: 2, dir: { x: 1, y: 0 }, color: "#3fb950" },
  { lambda: 3, dir: { x: 1 / Math.SQRT2, y: 1 / Math.SQRT2 }, color: "#bc8cff" },
];

const VIEW = 320;
const CX = VIEW / 2;
const CY = VIEW / 2;
const SCALE = 46; // px per unit (input ring radius ~ 1.6)

function apply(v: Vec): Vec {
  return { x: A[0] * v.x + A[1] * v.y, y: A[2] * v.x + A[3] * v.y };
}
function lerp(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function toScreen(v: Vec): Vec {
  return { x: CX + v.x * SCALE, y: CY - v.y * SCALE }; // y up
}
function len(v: Vec): number {
  return Math.hypot(v.x, v.y);
}
// signed alignment: +1 same direction, -1 opposite, 0 perpendicular
function cosAngle(a: Vec, b: Vec): number {
  const la = len(a);
  const lb = len(b);
  if (la < 1e-6 || lb < 1e-6) return 0;
  return (a.x * b.x + a.y * b.y) / (la * lb);
}

const RING_N = 16;
const RING_R = 1.6;

export default function EigenvectorViz() {
  const [t, setT] = useState(1); // morph 0=identity, 1=full transform
  const [auto, setAuto] = useState(true);
  const [probe, setProbe] = useState<Vec>({ x: 1.25, y: 0.55 }); // unit-ish
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!auto) return;
    const dt = setInterval(() => {
      setT((p) => {
        const nx = p + 0.022;
        return nx > 1 ? 0 : nx;
      });
    }, 40);
    return () => clearInterval(dt);
  }, [auto]);

  // ring of input vectors + their morphed positions
  const ring = useMemo(() => {
    return Array.from({ length: RING_N }, (_, i) => {
      const a = (i / RING_N) * Math.PI * 2;
      const base: Vec = { x: Math.cos(a) * RING_R, y: Math.sin(a) * RING_R };
      const out = apply(base);
      const cur = lerp(base, out, t);
      // how aligned is its CURRENT position with its ORIGINAL line?
      const onLine = Math.abs(cosAngle(base, cur)) > 0.998;
      return { base, cur, onLine };
    });
  }, [t]);

  // probe analysis (always at full transform — the "true" A·v)
  const probeOut = useMemo(() => apply(probe), [probe]);
  const c = cosAngle(probe, probeOut);
  const aligned = Math.abs(c) > 0.985;
  const eigenval = aligned ? (len(probeOut) / len(probe)) * Math.sign(c) : null;
  const matchColor = aligned
    ? Math.abs((eigenval ?? 0) - 2) < 0.25
      ? "#3fb950"
      : Math.abs((eigenval ?? 0) - 3) < 0.25
        ? "#bc8cff"
        : "#e3a93c"
    : "#39c5e0";

  function pointFromEvent(clientX: number, clientY: number): Vec | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * VIEW;
    const sy = ((clientY - rect.top) / rect.height) * VIEW;
    let vx = (sx - CX) / SCALE;
    let vy = -(sy - CY) / SCALE;
    const r = Math.hypot(vx, vy);
    const clamp = 1.7;
    if (r > clamp) {
      vx = (vx / r) * clamp;
      vy = (vy / r) * clamp;
    }
    if (r < 0.25) return null;
    return { x: vx, y: vy };
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging) return;
    const p = pointFromEvent(e.clientX, e.clientY);
    if (p) setProbe(p);
  }

  const probeS = toScreen(probe);
  const probeOutS = toScreen(probeOut);

  return (
    <div className="card p-5 grid-bg">
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        {/* ---------------- the plane ---------------- */}
        <div className="shrink-0 mx-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            className="w-full select-none touch-none"
            style={{ maxHeight: 340, maxWidth: 340, cursor: dragging ? "grabbing" : "crosshair" }}
            onPointerDown={(e) => {
              const p = pointFromEvent(e.clientX, e.clientY);
              if (p) {
                setProbe(p);
                setDragging(true);
                (e.target as SVGElement).setPointerCapture?.(e.pointerId);
              }
            }}
            onPointerMove={onMove}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
          >
            <defs>
              <marker id="ev-out" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#39c5e0" />
              </marker>
              <marker id="ev-probe" markerWidth="10" markerHeight="10" refX="6.5" refY="3" orient="auto">
                <path d="M0,0 L6.5,3 L0,6 Z" fill={matchColor} />
              </marker>
            </defs>

            {/* axes */}
            <line x1={0} y1={CY} x2={VIEW} y2={CY} stroke="#1e2630" strokeWidth={1} />
            <line x1={CX} y1={0} x2={CX} y2={VIEW} stroke="#1e2630" strokeWidth={1} />

            {/* eigen-lines (the directions A can't turn) */}
            {EIGS.map((e, i) => {
              const f = 200;
              const p1 = toScreen({ x: e.dir.x * f, y: e.dir.y * f });
              const p2 = toScreen({ x: -e.dir.x * f, y: -e.dir.y * f });
              return (
                <line
                  key={i}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={e.color}
                  strokeWidth={1.25}
                  strokeDasharray="5 4"
                  opacity={0.55}
                />
              );
            })}

            {/* ring vectors morphing under A */}
            {ring.map((v, i) => {
              const o = toScreen(v.cur);
              return (
                <line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={o.x}
                  y2={o.y}
                  stroke={v.onLine ? "#56d364" : "#39c5e0"}
                  strokeWidth={v.onLine ? 2 : 1}
                  opacity={v.onLine ? 0.95 : 0.34}
                  markerEnd="url(#ev-out)"
                />
              );
            })}

            {/* eigenvector tips (always shown as anchors) */}
            {EIGS.map((e, i) => {
              const tip = toScreen({ x: e.dir.x * RING_R, y: e.dir.y * RING_R });
              return <circle key={i} cx={tip.x} cy={tip.y} r={3} fill={e.color} />;
            })}

            {/* probe input + its image A·v */}
            <line
              x1={CX}
              y1={CY}
              x2={probeOutS.x}
              y2={probeOutS.y}
              stroke={matchColor}
              strokeWidth={2}
              opacity={0.4}
              markerEnd="url(#ev-probe)"
            />
            <line
              x1={CX}
              y1={CY}
              x2={probeS.x}
              y2={probeS.y}
              stroke={matchColor}
              strokeWidth={2.5}
              markerEnd="url(#ev-probe)"
            />
            <circle
              cx={probeS.x}
              cy={probeS.y}
              r={7}
              fill={matchColor}
              stroke="#07090d"
              strokeWidth={1.5}
              style={{ cursor: "grab" }}
            />
            {aligned && (
              <circle
                cx={CX}
                cy={CY}
                r={11}
                fill="none"
                stroke={matchColor}
                strokeWidth={1.5}
                opacity={0.8}
              />
            )}
          </svg>
        </div>

        {/* ---------------- controls + readout ---------------- */}
        <div className="flex-1 flex flex-col gap-3 min-w-[230px]">
          <div className="card p-3">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
              transform matrix A
            </div>
            <div className="flex items-center gap-3">
              <div
                className="grid grid-cols-2 gap-x-4 gap-y-1 px-3 py-2 rounded mono text-sm"
                style={{ background: "#10151d", border: "1px solid #1e2630", color: "#d6dee8" }}
              >
                <span>2</span>
                <span>1</span>
                <span>0</span>
                <span>3</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Every blue arrow gets pushed somewhere new. Two special directions only{" "}
                <span className="text-text">stretch</span>, never turn.
              </p>
            </div>
          </div>

          {/* probe readout */}
          <div
            className="card p-3 transition-all"
            style={{
              borderColor: aligned ? matchColor : "#1e2630",
              boxShadow: aligned ? `0 0 22px -8px ${matchColor}` : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-[10px] uppercase tracking-widest text-faint">
                your probe vector v
              </span>
              <span
                className="mono text-[10px] font-bold rounded px-1.5 py-0.5"
                style={{
                  background: aligned ? matchColor : "#161c26",
                  color: aligned ? "#06121a" : "#5b6b7d",
                }}
              >
                {aligned ? "EIGENVECTOR" : "rotated"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded py-1.5" style={{ background: "#10151d", border: "1px solid #1e2630" }}>
                <div className="mono text-[9px] uppercase tracking-widest text-faint">v · Av angle</div>
                <div className="mono text-sm font-bold mt-0.5" style={{ color: matchColor }}>
                  {(Math.acos(Math.max(-1, Math.min(1, c))) * (180 / Math.PI)).toFixed(1)}°
                </div>
              </div>
              <div className="rounded py-1.5" style={{ background: "#10151d", border: "1px solid #1e2630" }}>
                <div className="mono text-[9px] uppercase tracking-widest text-faint">eigenvalue λ</div>
                <div className="mono text-sm font-bold mt-0.5" style={{ color: aligned ? matchColor : "#5b6b7d" }}>
                  {aligned ? `≈ ${eigenval!.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {aligned
                ? "Av lands right back on v's own line — A only scaled it by λ. That's an eigenvector."
                : "Av points off v's line: the matrix rotated it. Keep dragging toward a dashed line."}
            </p>
          </div>

          {/* morph control */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-[10px] uppercase tracking-widest text-faint">
                apply A  ·  t = {t.toFixed(2)}
              </span>
              <button
                onClick={() => setAuto((a) => !a)}
                className="mono text-[10px] rounded border border-border px-2 py-0.5 text-faint hover:text-text"
              >
                {auto ? "❚❚ pause" : "▶ play"}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={t}
              onChange={(e) => {
                setAuto(false);
                setT(Number(e.target.value));
              }}
              className="w-full accent-[#39c5e0]"
            />
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Slide from identity to A. The{" "}
              <span style={{ color: "#56d364" }}>green</span> arrows sit on an eigen-line and
              just grow; <span style={{ color: "#39c5e0" }}>blue</span> ones swing away.
            </p>
            <div className="flex gap-3 mt-2">
              {EIGS.map((e, i) => (
                <span key={i} className="mono text-[10px]" style={{ color: e.color }}>
                  ● λ{i + 1} = {e.lambda}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-faint mono text-center">
        drag the dot to aim v · an eigenvector is any direction A leaves on its own line, scaled by λ
      </p>
    </div>
  );
}