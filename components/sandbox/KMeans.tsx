"use client";

import { useMemo, useState } from "react";

// ---- types ---------------------------------------------------------------

type Pt = { x: number; y: number };
type Assignment = number[]; // cluster index per point, -1 = unassigned
type Centroids = Pt[];

type Frame = {
  centroids: Centroids;
  assign: Assignment;
  iteration: number;
  converged: boolean;
  changed: number; // how many points changed cluster on this step
};

// ---- constants -----------------------------------------------------------

// Cluster palette (kept inside the site token set).
const CLUSTER_COLORS = ["#3fb950", "#39c5e0", "#bc8cff", "#e3a93c"] as const;

const MAX_ITERS = 30;

// SVG world. Points live in a 0..100 coordinate space; we map into the box.
const VIEW = 520;
const PAD = 28;
const WORLD = 100;

// ---- deterministic data --------------------------------------------------

// 36 fixed 2-D points arranged in three loose blobs. No randomness — these
// are hard-coded so every run is identical and reproducible.
const POINTS: Pt[] = [
  // blob A — lower-left
  { x: 14, y: 20 },
  { x: 18, y: 26 },
  { x: 11, y: 30 },
  { x: 22, y: 18 },
  { x: 26, y: 28 },
  { x: 16, y: 14 },
  { x: 24, y: 34 },
  { x: 20, y: 22 },
  { x: 9, y: 22 },
  { x: 28, y: 21 },
  { x: 13, y: 36 },
  { x: 30, y: 30 },
  // blob B — upper-middle
  { x: 46, y: 74 },
  { x: 52, y: 80 },
  { x: 44, y: 84 },
  { x: 56, y: 76 },
  { x: 50, y: 70 },
  { x: 58, y: 86 },
  { x: 42, y: 78 },
  { x: 54, y: 88 },
  { x: 48, y: 90 },
  { x: 60, y: 72 },
  { x: 40, y: 70 },
  { x: 62, y: 82 },
  // blob C — lower-right
  { x: 78, y: 24 },
  { x: 84, y: 30 },
  { x: 72, y: 28 },
  { x: 88, y: 22 },
  { x: 80, y: 34 },
  { x: 90, y: 32 },
  { x: 76, y: 18 },
  { x: 86, y: 38 },
  { x: 82, y: 16 },
  { x: 70, y: 20 },
  { x: 92, y: 26 },
  { x: 74, y: 36 },
];

// ---- math helpers --------------------------------------------------------

function dist2(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

// Deterministic seeding: spread k centroids across the sorted-by-x points so
// they start far apart (a cheap, reproducible k-means++ flavour).
function seedCentroids(pts: Pt[], k: number): Centroids {
  if (pts.length === 0 || k <= 0) return [];
  const order = pts
    .map((p, i) => ({ i, p }))
    .sort((a, b) => a.p.x - b.p.x || a.p.y - b.p.y);
  const out: Centroids = [];
  for (let c = 0; c < k; c++) {
    // evenly spaced indices across the x-sorted list
    const idx = Math.round((c * (order.length - 1)) / Math.max(1, k - 1));
    const src = order[Math.min(order.length - 1, idx)].p;
    out.push({ x: src.x, y: src.y });
  }
  return out;
}

// Assign each point to its nearest centroid. Returns labels + change count.
function assignPoints(
  pts: Pt[],
  centroids: Centroids,
  prev: Assignment,
): { assign: Assignment; changed: number } {
  const assign: Assignment = new Array(pts.length).fill(-1);
  let changed = 0;
  for (let i = 0; i < pts.length; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const d = dist2(pts[i], centroids[c]);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    assign[i] = best;
    if (prev[i] !== best) changed++;
  }
  return { assign, changed };
}

// Move each centroid to the mean of its assigned points. Empty clusters keep
// their previous position so the algorithm stays stable and deterministic.
function updateCentroids(
  pts: Pt[],
  assign: Assignment,
  prev: Centroids,
): Centroids {
  const sums = prev.map(() => ({ x: 0, y: 0, n: 0 }));
  for (let i = 0; i < pts.length; i++) {
    const c = assign[i];
    if (c < 0 || c >= sums.length) continue;
    sums[c].x += pts[i].x;
    sums[c].y += pts[i].y;
    sums[c].n += 1;
  }
  return prev.map((p, c) =>
    sums[c].n > 0
      ? { x: sums[c].x / sums[c].n, y: sums[c].y / sums[c].n }
      : { x: p.x, y: p.y },
  );
}

// Within-cluster sum of squared distances — a quality readout (inertia).
function inertia(pts: Pt[], centroids: Centroids, assign: Assignment): number {
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const c = assign[i];
    if (c >= 0 && c < centroids.length) total += dist2(pts[i], centroids[c]);
  }
  return total;
}

// Run one full iteration (assign -> update) from a frame. Stops advancing once
// the run has converged or hit the iteration cap, so step/run can never push
// the count past MAX_ITERS.
function stepOnce(pts: Pt[], frame: Frame): Frame {
  if (frame.converged || frame.iteration >= MAX_ITERS) return frame;
  const { assign, changed } = assignPoints(pts, frame.centroids, frame.assign);
  const centroids = updateCentroids(pts, assign, frame.centroids);
  const converged = changed === 0 && frame.iteration > 0;
  return {
    centroids,
    assign,
    iteration: frame.iteration + 1,
    converged,
    changed,
  };
}

function initialFrame(pts: Pt[], k: number): Frame {
  return {
    centroids: seedCentroids(pts, k),
    assign: new Array(pts.length).fill(-1),
    iteration: 0,
    converged: false,
    changed: pts.length,
  };
}

// world coord (0..100, y-up) -> svg pixel (y-down)
function sx(x: number): number {
  return PAD + (x / WORLD) * (VIEW - 2 * PAD);
}
function sy(y: number): number {
  return VIEW - PAD - (y / WORLD) * (VIEW - 2 * PAD);
}

// ---- component -----------------------------------------------------------

export default function KMeans() {
  const [k, setK] = useState<number>(3);
  const [frame, setFrame] = useState<Frame>(() => initialFrame(POINTS, 3));
  const [showLines, setShowLines] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const reset = (nextK: number) => {
    if (!Number.isInteger(nextK) || nextK < 2 || nextK > 4) {
      setError("k must be a whole number from 2 to 4.");
      return;
    }
    setError("");
    setK(nextK);
    setFrame(initialFrame(POINTS, nextK));
  };

  const step = () => {
    setError("");
    setFrame((f) => stepOnce(POINTS, f));
  };

  // Run to convergence (or the cap). Computed up front, no async/timers, so it
  // stays deterministic and never depends on the wall clock.
  const run = () => {
    setError("");
    setFrame((f) => {
      let cur = f;
      for (let i = 0; i < MAX_ITERS && !cur.converged; i++) {
        const next = stepOnce(POINTS, cur);
        if (next === cur) break; // cap reached — stepOnce is a no-op
        cur = next;
      }
      return cur;
    });
  };

  const sizes = useMemo(() => {
    const counts = new Array(k).fill(0);
    for (const a of frame.assign) if (a >= 0 && a < k) counts[a]++;
    return counts as number[];
  }, [frame.assign, k]);

  const score = useMemo(
    () => inertia(POINTS, frame.centroids, frame.assign),
    [frame.centroids, frame.assign],
  );

  const assignedYet = frame.iteration > 0;
  const atCap = frame.iteration >= MAX_ITERS && !frame.converged;
  const done = frame.converged || atCap;

  const statusColor = frame.converged
    ? "#3fb950"
    : atCap
      ? "#e3a93c"
      : "#39c5e0";
  const statusText = frame.converged
    ? "converged"
    : atCap
      ? "iteration cap reached"
      : assignedYet
        ? "running"
        : "ready";

  return (
    <div className="space-y-5">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          clusters k
        </span>
        {([2, 3, 4] as number[]).map((opt) => (
          <button
            key={opt}
            onClick={() => reset(opt)}
            className="mono text-xs rounded px-3 py-1 border transition-colors"
            style={{
              background: k === opt ? "var(--color-green)" : "transparent",
              color: k === opt ? "#06121a" : "var(--color-muted)",
              borderColor: k === opt ? "var(--color-green)" : "var(--color-border)",
            }}
          >
            {opt}
          </button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={step}
            disabled={done}
            className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-text transition-colors hover:bg-green hover:text-[#06121a] disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-text"
          >
            step
          </button>
          <button
            onClick={run}
            disabled={done}
            className="mono text-xs rounded px-3 py-1.5 border transition-colors disabled:opacity-40"
            style={{
              background: done ? "transparent" : "var(--color-green)",
              color: done ? "var(--color-muted)" : "#06121a",
              borderColor: "var(--color-green)",
            }}
          >
            run ▸
          </button>
          <button
            onClick={() => reset(k)}
            className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted transition-colors hover:text-text"
          >
            reset
          </button>
          <button
            onClick={() => setShowLines((s) => !s)}
            className="mono text-xs rounded px-3 py-1.5 border transition-colors"
            style={{
              background: showLines ? "var(--color-surface)" : "transparent",
              color: showLines ? "var(--color-text)" : "var(--color-faint)",
              borderColor: "var(--color-border)",
            }}
            title="toggle point→centroid lines"
          >
            {showLines ? "hide links" : "show links"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mono text-xs rounded px-3 py-2 border"
          style={{
            color: "#f85149",
            borderColor: "#f8514955",
            background: "#f8514914",
          }}
        >
          {error}
        </div>
      )}

      {/* scatter plot */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="mono text-[10px] uppercase tracking-widest text-faint">
            2-d scatter · {POINTS.length} points
          </span>
          <span
            className="mono text-[11px] rounded px-2.5 py-0.5 border"
            style={{
              color: statusColor,
              borderColor: statusColor + "55",
              background: statusColor + "14",
            }}
          >
            {statusText}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            className="mx-auto block"
            style={{ width: "100%", maxWidth: VIEW, height: "auto" }}
            role="img"
            aria-label="k-means scatter plot"
          >
            {/* grid */}
            {Array.from({ length: 11 }, (_, i) => i * 10).map((g) => (
              <g key={`grid-${g}`}>
                <line
                  x1={sx(g)}
                  y1={sy(0)}
                  x2={sx(g)}
                  y2={sy(WORLD)}
                  stroke="#1e2630"
                  strokeWidth={g % 50 === 0 ? 1 : 0.5}
                />
                <line
                  x1={sx(0)}
                  y1={sy(g)}
                  x2={sx(WORLD)}
                  y2={sy(g)}
                  stroke="#1e2630"
                  strokeWidth={g % 50 === 0 ? 1 : 0.5}
                />
              </g>
            ))}

            {/* axes border */}
            <rect
              x={sx(0)}
              y={sy(WORLD)}
              width={sx(WORLD) - sx(0)}
              height={sy(0) - sy(WORLD)}
              fill="none"
              stroke="#1e2630"
              strokeWidth={1}
            />

            {/* point -> centroid links */}
            {showLines &&
              assignedYet &&
              POINTS.map((p, i) => {
                const c = frame.assign[i];
                if (c < 0 || c >= frame.centroids.length) return null;
                const cen = frame.centroids[c];
                const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length];
                return (
                  <line
                    key={`link-${i}`}
                    x1={sx(p.x)}
                    y1={sy(p.y)}
                    x2={sx(cen.x)}
                    y2={sy(cen.y)}
                    stroke={color}
                    strokeWidth={0.6}
                    strokeOpacity={0.35}
                  />
                );
              })}

            {/* points */}
            {POINTS.map((p, i) => {
              const c = frame.assign[i];
              const color =
                c >= 0 ? CLUSTER_COLORS[c % CLUSTER_COLORS.length] : "#5b6b7d";
              return (
                <circle
                  key={`pt-${i}`}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={5}
                  fill={color}
                  fillOpacity={c >= 0 ? 0.85 : 0.45}
                  stroke="#07090d"
                  strokeWidth={1}
                />
              );
            })}

            {/* centroids — larger ringed markers, animated move via CSS */}
            {frame.centroids.map((c, i) => {
              const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
              return (
                <g
                  key={`cen-${i}`}
                  style={{ transition: "transform 350ms ease" }}
                  transform={`translate(${sx(c.x)} ${sy(c.y)})`}
                >
                  <circle
                    r={11}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={0.7}
                  />
                  <circle r={6} fill={color} stroke="#07090d" strokeWidth={1.5} />
                  <line x1={-3} y1={0} x2={3} y2={0} stroke="#07090d" strokeWidth={1.4} />
                  <line x1={0} y1={-3} x2={0} y2={3} stroke="#07090d" strokeWidth={1.4} />
                </g>
              );
            })}
          </svg>
        </div>

        <p className="mt-3 text-center text-xs text-faint">
          ringed markers are centroids · press{" "}
          <span className="text-cyan">step</span> to assign &amp; move once, or{" "}
          <span className="text-green">run</span> to iterate until the clusters
          settle
        </p>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Cell label="iteration" value={String(frame.iteration)} color="#39c5e0" />
        <Cell
          label="reassigned"
          value={assignedYet ? String(frame.changed) : "—"}
          color="#e3a93c"
        />
        <Cell
          label="inertia (wcss)"
          value={assignedYet ? fmt(score) : "—"}
          color="#bc8cff"
        />
        <Cell
          label="status"
          value={frame.converged ? "stable" : atCap ? "capped" : "moving"}
          color={statusColor}
        />
      </div>

      {/* per-cluster sizes */}
      <div className="card p-4">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-3 mono">
          cluster membership
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: k }, (_, i) => {
            const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
            const cen = frame.centroids[i];
            return (
              <div
                key={`size-${i}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2"
              >
                <span className="flex items-center gap-2 mono text-xs">
                  <span
                    className="inline-block rounded-full"
                    style={{ width: 10, height: 10, background: color }}
                  />
                  <span style={{ color }}>C{i + 1}</span>
                </span>
                <span className="mono text-[11px] text-faint truncate">
                  {cen ? `(${cen.x.toFixed(1)}, ${cen.y.toFixed(1)})` : "—"}
                </span>
                <span className="mono text-sm text-text font-bold">
                  {assignedYet ? String(sizes[i] ?? 0) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* explainer */}
      <div className="card p-4 mono text-xs text-muted leading-relaxed">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
          how one iteration works
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-cyan">1 · assign</span> — every point is
            coloured by its <span className="text-text">nearest</span> centroid
            (squared Euclidean distance).
          </div>
          <div>
            <span className="text-cyan">2 · update</span> — each centroid jumps
            to the <span className="text-text">mean</span> of the points that
            chose it.
          </div>
        </div>
        <p className="mt-3 text-faint">
          {frame.converged
            ? "Converged: a full pass reassigned zero points, so the means stopped moving — this k-partition is a fixed point (a local optimum). Try a different k to compare the inertia."
            : atCap
              ? "Hit the iteration cap before settling. In practice k-means almost always converges fast, but the cap guards against the rare oscillation."
              : assignedYet
                ? `Last step reassigned ${frame.changed} point${frame.changed === 1 ? "" : "s"}. Keep stepping — once a pass changes nothing, the algorithm has converged.`
                : "Centroids are seeded deterministically (spread across the points, k-means++ style), so this run is identical every time. Press step to begin."}
        </p>
      </div>
    </div>
  );
}

// ---- small presentational helpers ---------------------------------------

function fmt(x: number): string {
  if (!Number.isFinite(x)) return "—";
  if (x >= 10000) return x.toExponential(2);
  return String(Number(x.toFixed(1)));
}

function Cell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">
        {label}
      </div>
      <div
        className="mono text-base font-bold mt-1 truncate"
        style={{ color }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
