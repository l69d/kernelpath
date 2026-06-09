"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ---- loss functions ------------------------------------------------------
type Preset = {
  id: string;
  label: string;
  f: (x: number) => number;
  df: (x: number) => number;
  // x-range to render the curve over
  xMin: number;
  xMax: number;
  // a sensible default starting position
  startX: number;
  // y-range used to scale the curve in the SVG
  yMax: number;
  note: string;
};

const PRESETS: Preset[] = [
  {
    id: "parabola",
    label: "x²",
    f: (x) => x * x,
    df: (x) => 2 * x,
    xMin: -5,
    xMax: 5,
    startX: 4.2,
    yMax: 25,
    note: "A clean convex bowl: one global minimum at x = 0. Any small learning rate converges straight to the bottom.",
  },
  {
    id: "bumpy",
    label: "x²/10 + sin(x)",
    f: (x) => (x * x) / 10 + Math.sin(x),
    df: (x) => x / 5 + Math.cos(x),
    xMin: -10,
    xMax: 10,
    startX: 6.5,
    yMax: 11,
    note: "A wavy bowl with several local minima. Where the ball settles now depends on where it started — gradient descent only sees the slope right under it.",
  },
];

// A loss above this is treated as "exploded" — clamped so it never breaks the SVG.
const DIVERGE_LOSS = 1e6;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function fmt(x: number): string {
  if (Number.isNaN(x)) return "NaN";
  if (!Number.isFinite(x)) return x > 0 ? "+∞" : "−∞";
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return x.toExponential(2);
  return String(Number(x.toPrecision(4)));
}

export default function GradientDescent() {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0],
    [presetId],
  );

  const [lr, setLr] = useState<number>(0.1);
  const [x, setX] = useState<number>(PRESETS[0].startX);
  // history of x positions, most recent last; [0] is the start
  const [trail, setTrail] = useState<number[]>([PRESETS[0].startX]);
  const [running, setRunning] = useState<boolean>(false);
  const [startInput, setStartInput] = useState<string>(String(PRESETS[0].startX));
  const [inputErr, setInputErr] = useState<string>("");

  const { f, df } = preset;
  const loss = f(x);
  const grad = df(x);
  const next = x - lr * grad;
  const diverged =
    !Number.isFinite(loss) || Math.abs(loss) > DIVERGE_LOSS || Math.abs(x) > 1e6;
  const converged = !diverged && Math.abs(grad) < 1e-3 && trail.length > 1;

  // ---- reset everything when the function changes -------------------------
  const resetTo = (startX: number) => {
    setX(startX);
    setTrail([startX]);
    setRunning(false);
    setStartInput(String(Number(startX.toPrecision(4))));
    setInputErr("");
  };

  useEffect(() => {
    resetTo(preset.startX);
    setLr((cur) => clamp(cur, 0.01, 1.2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  // ---- one gradient-descent step -----------------------------------------
  // trail's last element always equals the live x (they are written together
  // in step / resetTo / drag), so we can derive the next position at the top
  // level and keep both updater functions pure (StrictMode-safe).
  const step = () => {
    const nx = clamp(x - lr * grad, -1e7, 1e7);
    setX(nx);
    setTrail((t) => {
      const nt = [...t, nx];
      return nt.length > 80 ? nt.slice(nt.length - 80) : nt;
    });
  };

  // ---- run loop (deterministic interval, not used for core math) ---------
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (!running) return;
    if (diverged || converged) {
      setRunning(false);
      return;
    }
    const id = setInterval(() => stepRef.current(), 220);
    return () => clearInterval(id);
  }, [running, diverged, converged]);

  // ---- apply a typed / dragged start position ----------------------------
  const applyStart = (raw: string) => {
    setStartInput(raw);
    if (raw.trim() === "") {
      setInputErr("enter a number");
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setInputErr("not a valid number");
      return;
    }
    setInputErr("");
    resetTo(clamp(n, preset.xMin, preset.xMax));
  };

  // ---- SVG geometry -------------------------------------------------------
  const W = 560;
  const H = 240;
  const PAD = 28;
  const { xMin, xMax, yMax } = preset;

  const sx = (xv: number) =>
    PAD + ((xv - xMin) / (xMax - xMin)) * (W - 2 * PAD);
  const sy = (yv: number) =>
    H - PAD - (clamp(yv, 0, yMax) / yMax) * (H - 2 * PAD);

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    const N = 160;
    for (let i = 0; i <= N; i++) {
      const xv = xMin + ((xMax - xMin) * i) / N;
      const yv = f(xv);
      pts.push(`${i === 0 ? "M" : "L"}${sx(xv).toFixed(1)},${sy(yv).toFixed(1)}`);
    }
    return pts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  // the trail dots, clamped into the rendered window so divergence is visible
  const trailDots = useMemo(
    () => trail.map((tx) => clamp(tx, xMin, xMax)),
    [trail, xMin, xMax],
  );

  // ---- dragging the start point on the SVG -------------------------------
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);

  const xFromClient = (clientX: number): number => {
    const el = svgRef.current;
    if (!el) return x;
    const rect = el.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const xv = xMin + ((px - PAD) / (W - 2 * PAD)) * (xMax - xMin);
    return clamp(xv, xMin, xMax);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => resetTo(Number(xFromClient(e.clientX).toFixed(3)));
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, presetId]);

  // ---- loss-vs-iteration sparkline ---------------------------------------
  const lossSeries = useMemo(
    () => trail.map((tx) => f(tx)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trail, presetId],
  );
  const lossPlot = useMemo(() => {
    const LW = 560;
    const LH = 90;
    const lp = 8;
    const finite = lossSeries.map((v) =>
      Number.isFinite(v) ? clamp(v, 0, DIVERGE_LOSS) : DIVERGE_LOSS,
    );
    const top = Math.max(0.001, ...finite);
    const n = finite.length;
    const px = (i: number) =>
      lp + (n <= 1 ? 0 : (i / (n - 1)) * (LW - 2 * lp));
    const py = (v: number) => LH - lp - (v / top) * (LH - 2 * lp);
    const path = finite
      .map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`)
      .join(" ");
    return { LW, LH, path, top, dots: finite.map((v, i) => ({ x: px(i), y: py(v) })) };
  }, [lossSeries]);

  const statusColor = diverged ? "#f85149" : converged ? "#3fb950" : "#39c5e0";
  const statusLabel = diverged ? "diverging" : converged ? "converged" : "descending";

  return (
    <div className="space-y-5">
      {/* function presets + status */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          loss
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPresetId(p.id)}
            className="mono text-xs rounded px-3 py-1 border transition-colors"
            style={{
              background: presetId === p.id ? "var(--color-green)" : "transparent",
              color: presetId === p.id ? "#06121a" : "var(--color-muted)",
              borderColor:
                presetId === p.id ? "var(--color-green)" : "var(--color-border)",
            }}
          >
            {p.label}
          </button>
        ))}
        <span
          className="ml-auto mono text-xs rounded px-2.5 py-1 border"
          style={{
            color: statusColor,
            borderColor: statusColor + "55",
            background: statusColor + "14",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* the curve */}
      <div className="card p-4 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          style={{ touchAction: "none", maxHeight: 260 }}
        >
          {/* axes */}
          <line
            x1={PAD}
            y1={H - PAD}
            x2={W - PAD}
            y2={H - PAD}
            stroke="#1e2630"
            strokeWidth={1}
          />
          <line
            x1={sx(0)}
            y1={PAD}
            x2={sx(0)}
            y2={H - PAD}
            stroke="#1e2630"
            strokeWidth={1}
          />
          {/* curve */}
          <path d={curvePath} fill="none" stroke="#39c5e0" strokeWidth={2} />

          {/* trail of past points */}
          {trailDots.slice(0, -1).map((tx, i) => (
            <circle
              key={i}
              cx={sx(tx)}
              cy={sy(f(tx))}
              r={2.5}
              fill="#56d364"
              opacity={0.12 + 0.45 * (i / Math.max(1, trailDots.length - 1))}
            />
          ))}

          {/* tangent (gradient) line at the current point */}
          {!diverged && Number.isFinite(grad) && (
            <line
              x1={sx(clamp(x - 0.9, xMin, xMax))}
              y1={sy(loss - grad * 0.9)}
              x2={sx(clamp(x + 0.9, xMin, xMax))}
              y2={sy(loss + grad * 0.9)}
              stroke="#e3a93c"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.85}
            />
          )}

          {/* current point — draggable */}
          <circle
            cx={sx(clamp(x, xMin, xMax))}
            cy={sy(loss)}
            r={7}
            fill={statusColor}
            stroke="#07090d"
            strokeWidth={2}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.preventDefault();
              setRunning(false);
              setDragging(true);
            }}
          />
          {/* off-screen indicator when the ball overshoots the window */}
          {diverged && (
            <text
              x={W / 2}
              y={PAD + 6}
              textAnchor="middle"
              className="mono"
              fill="#f85149"
              fontSize={12}
            >
              ↯ overshot the window — loss exploded
            </text>
          )}
        </svg>
        <p className="mt-1 text-center text-xs text-faint">
          drag the dot to set the start · the dashed line is the gradient (slope) under it
        </p>
      </div>

      {/* controls */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="mono text-xs text-muted flex items-center gap-3 flex-1 min-w-[220px]">
            <span className="whitespace-nowrap">
              learning rate ={" "}
              <span className="text-text font-bold">{lr.toFixed(3)}</span>
            </span>
            <input
              type="range"
              min={0.01}
              max={1.2}
              step={0.01}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="flex-1 accent-[#3fb950]"
            />
          </label>
          <label className="mono text-xs text-muted flex items-center gap-2">
            start x =
            <input
              value={startInput}
              onChange={(e) => applyStart(e.target.value)}
              className="w-24 bg-surface border border-border rounded px-2 py-1 mono text-sm text-text outline-none focus:border-faint/50"
              placeholder={String(preset.startX)}
            />
          </label>
        </div>

        {inputErr && (
          <div
            className="mono text-xs rounded px-2.5 py-1.5 border"
            style={{ color: "#f85149", borderColor: "#f8514955", background: "#f8514914" }}
          >
            {inputErr}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={step}
            disabled={diverged || converged}
            className="mono text-xs rounded px-4 py-1.5 border border-border bg-surface text-text hover:bg-green hover:text-[#06121a] hover:border-green transition-colors disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-text"
          >
            Step
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={diverged || converged}
            className="mono text-xs rounded px-4 py-1.5 border transition-colors disabled:opacity-40"
            style={{
              background: running ? "var(--color-green)" : "transparent",
              color: running ? "#06121a" : "var(--color-text)",
              borderColor: running ? "var(--color-green)" : "var(--color-border)",
            }}
          >
            {running ? "Pause" : "Run"}
          </button>
          <button
            onClick={() => resetTo(preset.startX)}
            className="mono text-xs rounded px-4 py-1.5 border border-border bg-surface text-muted hover:text-text transition-colors"
          >
            Reset
          </button>
          <span className="mono text-xs text-faint self-center ml-auto">
            iteration {trail.length - 1}
          </span>
        </div>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Cell label="current x" value={fmt(x)} color="#3fb950" />
        <Cell label="loss f(x)" value={diverged ? "exploded" : fmt(loss)} color="#39c5e0" />
        <Cell label="gradient f′(x)" value={fmt(grad)} color="#e3a93c" />
        <Cell label="next x" value={fmt(next)} color="#bc8cff" />
      </div>

      {/* update equation */}
      <div className="card p-4 mono text-xs text-muted leading-relaxed">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
          the update rule
        </div>
        <div className="space-y-1 break-words">
          <div>
            x<sub>new</sub> = x − η · f′(x)
          </div>
          <div>
            = <span className="text-green">{fmt(x)}</span> −{" "}
            <span className="text-text">{lr.toFixed(3)}</span> ×{" "}
            <span className="text-amber">{fmt(grad)}</span> ={" "}
            <span className="text-purple">{fmt(next)}</span>
          </div>
        </div>
        <p className="mt-3 text-faint">
          {diverged
            ? "Diverging: the learning rate η is too large, so each step overshoots the minimum by more than it started — the loss blows up to infinity. Lower the slider and reset."
            : converged
              ? "Converged: the gradient is ≈ 0, so the update barely moves x. The ball is sitting in a minimum (which may be local, not global)."
              : preset.note}
        </p>
      </div>

      {/* loss vs iteration */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="mono text-[10px] uppercase tracking-widest text-faint">
            loss vs iteration
          </span>
          <span className="mono text-[10px] text-faint">
            peak {fmt(lossPlot.top)}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${lossPlot.LW} ${lossPlot.LH}`}
          className="w-full"
          style={{ maxHeight: 100 }}
        >
          <line
            x1={8}
            y1={lossPlot.LH - 8}
            x2={lossPlot.LW - 8}
            y2={lossPlot.LH - 8}
            stroke="#1e2630"
            strokeWidth={1}
          />
          <path
            d={lossPlot.path}
            fill="none"
            stroke={diverged ? "#f85149" : "#56d364"}
            strokeWidth={2}
          />
          {lossPlot.dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={2} fill={diverged ? "#f85149" : "#56d364"} />
          ))}
        </svg>
        <p className="mt-1 text-xs text-faint">
          A healthy run drops fast then flattens. A run that climbs (or spikes off the top) is
          diverging.
        </p>
      </div>
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-base font-bold mt-1 truncate" style={{ color }} title={value}>
        {value}
      </div>
    </div>
  );
}
