"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------- cs9-05 Congestion Control · AIMD sawtooth ---------------- */

type Phase = "slow-start" | "congestion-avoidance";

interface Point {
  t: number;
  cwnd: number;
  ssthresh: number;
  phase: Phase;
  loss: boolean;
}

const W = 640;
const H = 280;
const PAD_L = 40;
const PAD_B = 28;
const PAD_T = 16;
const PAD_R = 12;
const T_MAX = 60; // round-trips visible on the x axis (rolling window)
const CWND_MAX = 34; // segments on the y axis
const INIT_SSTHRESH = 16;

// advance the simulated TCP sender by one round-trip
function step(cur: Point, loss: boolean): Point {
  const t = cur.t + 1;
  if (loss) {
    const next = Math.max(2, Math.round(cur.cwnd / 2));
    return { t, cwnd: next, ssthresh: next, phase: "congestion-avoidance", loss: true };
  }
  if (cur.phase === "slow-start") {
    const doubled = cur.cwnd * 2;
    if (doubled >= cur.ssthresh) {
      return { t, cwnd: cur.ssthresh, ssthresh: cur.ssthresh, phase: "congestion-avoidance", loss: false };
    }
    return { t, cwnd: doubled, ssthresh: cur.ssthresh, phase: "slow-start", loss: false };
  }
  // additive increase: +1 MSS per RTT
  return { t, cwnd: cur.cwnd + 1, ssthresh: cur.ssthresh, phase: "congestion-avoidance", loss: false };
}

const START: Point = { t: 0, cwnd: 1, ssthresh: INIT_SSTHRESH, phase: "slow-start", loss: false };

export default function CongestionViz() {
  const [points, setPoints] = useState<Point[]>([START]);
  const [playing, setPlaying] = useState(true);
  const [lossRate, setLossRate] = useState(0); // % chance of spontaneous loss per RTT
  const lossReq = useRef(false); // user-triggered loss flag

  const last = points[points.length - 1];

  const advance = (forceLoss: boolean) => {
    setPoints((prev) => {
      const cur = prev[prev.length - 1];
      const spontaneous = !forceLoss && lossRate > 0 && Math.random() * 100 < lossRate;
      const next = step(cur, forceLoss || spontaneous);
      const grown = [...prev, next];
      return grown.length > T_MAX + 1 ? grown.slice(grown.length - (T_MAX + 1)) : grown;
    });
  };

  // animation loop — RNG only runs inside the effect (SSR-safe)
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const forced = lossReq.current;
      lossReq.current = false;
      advance(forced);
    }, 280);
    return () => clearInterval(id);
    // advance closes over lossRate; re-arm when it changes
  }, [playing, lossRate]);

  // --- scales ---
  const t0 = points[0]?.t ?? 0;
  const x = (t: number) => PAD_L + ((t - t0) / T_MAX) * (W - PAD_L - PAD_R);
  const y = (c: number) => H - PAD_B - (Math.min(c, CWND_MAX) / CWND_MAX) * (H - PAD_T - PAD_B);

  const path = useMemo(
    () =>
      points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.cwnd).toFixed(1)}`)
        .join(" "),
    // recompute when the series changes; x/y are pure of state besides t0
    [points],
  );

  const triggerLoss = () => {
    if (playing) {
      lossReq.current = true; // applied on the next tick
    } else {
      advance(true); // apply immediately so a paused user sees the drop
    }
  };

  const reset = () => setPoints([START]);

  const phaseColor = last.phase === "slow-start" ? "#39c5e0" : "#3fb950";
  const yTicks = [0, 8, 16, 24, 32];

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <Readout label="cwnd" value={`${last.cwnd} MSS`} color={phaseColor} />
          <Readout label="ssthresh" value={`${last.ssthresh} MSS`} color="#e3a93c" />
          <Readout
            label="phase"
            value={last.phase === "slow-start" ? "slow-start ×2" : "AIMD +1"}
            color={phaseColor}
          />
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 300 }}>
          {/* ssthresh guide line */}
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(last.ssthresh)}
            y2={y(last.ssthresh)}
            stroke="#e3a93c"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.7}
          />
          <text x={W - PAD_R} y={y(last.ssthresh) - 4} textAnchor="end" className="mono" fontSize={9} fill="#e3a93c">
            ssthresh
          </text>

          {/* y grid + labels */}
          {yTicks.map((c) => (
            <g key={c}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(c)} y2={y(c)} stroke="#1e2630" strokeWidth={1} />
              <text x={PAD_L - 6} y={y(c) + 3} textAnchor="end" className="mono" fontSize={9} fill="#5b6b7d">
                {c}
              </text>
            </g>
          ))}

          {/* axis labels */}
          <text
            x={12}
            y={H / 2}
            transform={`rotate(-90 12 ${H / 2})`}
            textAnchor="middle"
            className="mono"
            fontSize={9}
            fill="#8a97a8"
          >
            cwnd (MSS)
          </text>
          <text x={(W + PAD_L) / 2} y={H - 6} textAnchor="middle" className="mono" fontSize={9} fill="#8a97a8">
            round-trips →
          </text>

          {/* filled area under the curve */}
          {points.length > 1 && (
            <path
              d={`${path} L ${x(last.t).toFixed(1)} ${(H - PAD_B).toFixed(1)} L ${x(t0).toFixed(1)} ${(H - PAD_B).toFixed(1)} Z`}
              fill={phaseColor}
              opacity={0.08}
            />
          )}

          {/* the cwnd curve */}
          <path d={path} fill="none" stroke={phaseColor} strokeWidth={2} strokeLinejoin="round" />

          {/* loss markers */}
          {points.map((p) =>
            p.loss ? (
              <g key={`loss-${p.t}`}>
                <line x1={x(p.t)} x2={x(p.t)} y1={PAD_T} y2={H - PAD_B} stroke="#f85149" strokeWidth={1} opacity={0.35} />
                <circle cx={x(p.t)} cy={y(p.cwnd)} r={4} fill="#f85149" />
              </g>
            ) : null,
          )}

          {/* leading-edge dot */}
          <circle cx={x(last.t)} cy={y(last.cwnd)} r={4} fill={phaseColor}>
            {playing && <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />}
          </circle>
        </svg>

        {/* controls */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="mono text-[11px] rounded border border-border px-3 py-1.5 text-faint hover:text-text"
          >
            {playing ? "❚❚ pause" : "▶ play"}
          </button>
          <button
            onClick={triggerLoss}
            className="mono text-[11px] rounded px-3 py-1.5 font-bold"
            style={{ background: "#f85149", color: "#06121a", border: "1px solid #f85149" }}
          >
            ✦ drop a packet
          </button>
          <button
            onClick={reset}
            className="mono text-[11px] rounded border border-border px-3 py-1.5 text-faint hover:text-text"
          >
            ↺ reset
          </button>
          <label className="mono text-[10px] text-faint flex items-center gap-2 ml-1">
            loss rate
            <input
              type="range"
              min={0}
              max={20}
              value={lossRate}
              onChange={(e) => setLossRate(Number(e.target.value))}
              className="w-24 accent-[#f85149]"
            />
            <span className="text-amber w-7 text-right">{lossRate}%</span>
          </label>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Slow-start doubles cwnd each RTT until it hits ssthresh; then additive-increase adds +1 per RTT. A loss halves
        cwnd (multiplicative decrease) — that&apos;s the AIMD sawtooth.
      </p>
    </div>
  );
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}