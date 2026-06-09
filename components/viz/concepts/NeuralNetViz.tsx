"use client";

import { useEffect, useMemo, useState } from "react";

/* cs12-07 — Neural Networks & Backpropagation
 * A 2-3-1 MLP. Forward: inputs flow along weighted edges through a sigmoid
 * to the output. Backward: gradients flow back, lighting each edge by how
 * much its weight is to blame for the error. Step forward, then backward. */

type Phase = "idle" | "fwd-hidden" | "fwd-out" | "loss" | "bwd-out" | "bwd-hidden";

const COL = {
  surface: "#10151d",
  border: "#1e2630",
  text: "#d6dee8",
  muted: "#8a97a8",
  faint: "#5b6b7d",
  green: "#3fb950",
  cyan: "#39c5e0",
  blue: "#58a6ff",
  amber: "#e3a93c",
  purple: "#bc8cff",
  pink: "#f778ba",
  red: "#f85149",
};

// fixed weights (deterministic) — w1: 2 inputs x 3 hidden, w2: 3 hidden x 1 out
const W1: number[][] = [
  [0.9, -1.4, 0.6],
  [-1.1, 0.8, 1.5],
];
const W2: number[] = [1.2, -1.6, 0.7];

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// node screen coordinates
const IN_Y = [70, 170];
const HID_Y = [40, 120, 200];
const IN_X = 70;
const HID_X = 230;
const OUT_X = 400;
const OUT_Y = 120;

const PHASES: Phase[] = ["idle", "fwd-hidden", "fwd-out", "loss", "bwd-out", "bwd-hidden"];

const PHASE_LABEL: Record<Phase, string> = {
  idle: "ready — press Step to run the forward pass",
  "fwd-hidden": "FORWARD · inputs → hidden (weighted sum, then squash)",
  "fwd-out": "FORWARD · hidden → output (weighted sum, then squash)",
  loss: "LOSS · compare prediction to target — this error is what we send back",
  "bwd-out": "BACKWARD · blame the output weights for the error",
  "bwd-hidden": "BACKWARD · push blame further back to the input weights",
};

export default function NeuralNetViz() {
  const [x0, setX0] = useState(0.8);
  const [x1, setX1] = useState(0.3);
  const [target, setTarget] = useState(1);
  const [pi, setPi] = useState(0);
  const phase = PHASES[pi];

  // deterministic forward + backward pass
  const net = useMemo(() => {
    const inputs = [x0, x1];
    const hPre = [0, 1, 2].map((j) => W1[0][j] * inputs[0] + W1[1][j] * inputs[1]);
    const hAct = hPre.map(sigmoid);
    const oPre = W2[0] * hAct[0] + W2[1] * hAct[1] + W2[2] * hAct[2];
    const oAct = sigmoid(oPre);
    const err = oAct - target; // dLoss/dOut for 1/2 (y-t)^2
    const dOPre = err * oAct * (1 - oAct); // delta at output
    // grad of each w2 = dOPre * hAct[j]
    const gW2 = hAct.map((h) => Math.abs(dOPre * h));
    // delta at each hidden = dOPre * W2[j] * sigmoid'(hPre)
    const dH = [0, 1, 2].map((j) => dOPre * W2[j] * hAct[j] * (1 - hAct[j]));
    // grad of each w1[i][j] = dH[j] * input[i]
    const gW1 = [0, 1].map((i) => [0, 1, 2].map((j) => Math.abs(dH[j] * inputs[i])));
    return { inputs, hAct, oAct, err, gW2, gW1 };
  }, [x0, x1, target]);

  // auto-advance ticker (optional play loop)
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setPi((p) => (p + 1) % PHASES.length), 1300);
    return () => clearInterval(t);
  }, [auto]);

  const fwdActive = phase === "fwd-hidden" || phase === "fwd-out";
  const bwdActive = phase === "bwd-out" || phase === "bwd-hidden";

  // edge styling helper: weight -> width/colour; blame mode -> red glow by gradient
  const edgeWidth = (w: number) => 1 + Math.min(4, Math.abs(w) * 2.2);
  const wColor = (w: number) => (w >= 0 ? COL.cyan : COL.pink);
  const blameWidth = (g: number) => 1.2 + Math.min(6.5, g * 14);

  const showInToHid = phase === "fwd-hidden" || phase === "bwd-hidden";
  const showHidToOut = phase === "fwd-out" || phase === "loss" || phase === "bwd-out";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* phase rail */}
        <div className="flex items-center justify-center gap-1.5 py-1 flex-wrap">
          {(["FORWARD", "LOSS", "BACKWARD"] as const).map((g) => {
            const on =
              (g === "FORWARD" && fwdActive) ||
              (g === "LOSS" && phase === "loss") ||
              (g === "BACKWARD" && bwdActive);
            const c = g === "BACKWARD" ? COL.red : g === "LOSS" ? COL.amber : COL.green;
            return (
              <span
                key={g}
                className="mono text-[11px] font-bold rounded px-3 py-1 transition-all"
                style={{
                  background: on ? c : COL.surface,
                  border: `1px solid ${on ? c : COL.border}`,
                  color: on ? "#06121a" : COL.faint,
                  boxShadow: on ? `0 0 18px -6px ${c}` : undefined,
                }}
              >
                {g}
              </span>
            );
          })}
        </div>

        {/* network */}
        <svg viewBox="0 0 460 260" className="w-full mt-2" style={{ maxHeight: 320 }}>
          {/* input -> hidden edges */}
          {[0, 1].map((i) =>
            [0, 1, 2].map((j) => {
              const lit = showInToHid;
              const blame = phase === "bwd-hidden";
              const g = net.gW1[i][j];
              const stroke = blame ? COL.red : wColor(W1[i][j]);
              const width = blame ? blameWidth(g) : edgeWidth(W1[i][j]);
              return (
                <line
                  key={`a${i}-${j}`}
                  x1={IN_X}
                  y1={IN_Y[i]}
                  x2={HID_X}
                  y2={HID_Y[j]}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeOpacity={lit ? (blame ? 0.45 + Math.min(0.5, g * 12) : 0.85) : 0.16}
                  style={{ transition: "all 0.4s" }}
                />
              );
            })
          )}
          {/* hidden -> output edges */}
          {[0, 1, 2].map((j) => {
            const lit = showHidToOut;
            const blame = phase === "bwd-out";
            const g = net.gW2[j];
            const stroke = blame ? COL.red : wColor(W2[j]);
            const width = blame ? blameWidth(g) : edgeWidth(W2[j]);
            return (
              <line
                key={`b${j}`}
                x1={HID_X}
                y1={HID_Y[j]}
                x2={OUT_X}
                y2={OUT_Y}
                stroke={stroke}
                strokeWidth={width}
                strokeOpacity={lit ? (blame ? 0.45 + Math.min(0.5, g * 12) : 0.85) : 0.16}
                style={{ transition: "all 0.4s" }}
              />
            );
          })}

          {/* input nodes */}
          {[0, 1].map((i) => (
            <Node
              key={`in${i}`}
              x={IN_X}
              y={IN_Y[i]}
              label={net.inputs[i].toFixed(2)}
              sub={`x${i}`}
              color={COL.green}
              active={fwdActive}
            />
          ))}
          {/* hidden nodes */}
          {[0, 1, 2].map((j) => (
            <Node
              key={`h${j}`}
              x={HID_X}
              y={HID_Y[j]}
              label={net.hAct[j].toFixed(2)}
              sub={`h${j}`}
              color={COL.purple}
              active={phase === "fwd-hidden" || phase === "bwd-hidden"}
            />
          ))}
          {/* output node */}
          <Node
            x={OUT_X}
            y={OUT_Y}
            label={net.oAct.toFixed(2)}
            sub="ŷ"
            color={bwdActive || phase === "loss" ? COL.amber : COL.blue}
            active={phase === "fwd-out" || phase === "loss" || bwdActive}
            r={22}
          />
          {/* target tag */}
          <text x={OUT_X} y={OUT_Y + 48} textAnchor="middle" className="mono" fontSize="10" fill={COL.faint}>
            target {target.toFixed(0)}
          </text>
        </svg>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-3 gap-3 mt-3 text-center">
        <Stat label="prediction ŷ" value={net.oAct.toFixed(3)} color={COL.blue} />
        <Stat
          label="error (ŷ − t)"
          value={net.err.toFixed(3)}
          color={Math.abs(net.err) < 0.15 ? COL.green : COL.red}
        />
        <Stat label="loss ½(ŷ−t)²" value={(0.5 * net.err * net.err).toFixed(3)} color={COL.amber} />
      </div>

      <p className="text-center text-xs mt-3" style={{ color: COL.muted }}>
        {PHASE_LABEL[phase]}
      </p>

      {/* controls */}
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div className="card p-3 space-y-2">
          <Slider label="input x0" value={x0} onChange={setX0} color={COL.green} />
          <Slider label="input x1" value={x1} onChange={setX1} color={COL.green} />
          <div className="flex items-center justify-between">
            <span className="mono text-[10px] uppercase tracking-widest" style={{ color: COL.faint }}>
              target
            </span>
            <div className="flex gap-1">
              {[0, 1].map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className="mono text-[11px] rounded px-3 py-1 transition-all"
                  style={{
                    background: target === t ? COL.amber : COL.surface,
                    border: `1px solid ${target === t ? COL.amber : COL.border}`,
                    color: target === t ? "#06121a" : COL.faint,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-3 flex flex-col justify-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setAuto(false);
                setPi((p) => (p + 1) % PHASES.length);
              }}
              className="mono text-xs rounded px-4 py-1.5 font-bold transition-all"
              style={{ background: COL.green, color: "#06121a", border: `1px solid ${COL.green}` }}
            >
              Step ▸
            </button>
            <button
              onClick={() => {
                setAuto(false);
                setPi(0);
              }}
              className="mono text-xs rounded border px-3 py-1.5"
              style={{ borderColor: COL.border, color: COL.faint }}
            >
              reset
            </button>
            <button
              onClick={() => setAuto((a) => !a)}
              className="mono text-xs rounded border px-3 py-1.5"
              style={{ borderColor: COL.border, color: auto ? COL.green : COL.faint }}
            >
              {auto ? "❚❚ pause" : "▶ play"}
            </button>
          </div>
          <div className="flex justify-center gap-1">
            {PHASES.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-6 rounded-full transition-all"
                style={{ background: i === pi ? (bwdActive ? COL.red : COL.green) : COL.border }}
              />
            ))}
          </div>
          <p className="mono text-[10px] text-center" style={{ color: COL.faint }}>
            <span style={{ color: COL.cyan }}>cyan</span>=positive weight ·{" "}
            <span style={{ color: COL.pink }}>pink</span>=negative · width=|weight|
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs mono text-center" style={{ color: COL.faint }}>
        In BACKWARD, edges glow <span style={{ color: COL.red }}>red</span> in proportion to their gradient — how much
        nudging that weight would shrink the loss. That is backprop assigning blame.
      </p>
    </div>
  );
}

function Node({
  x,
  y,
  label,
  sub,
  color,
  active,
  r = 18,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  color: string;
  active: boolean;
  r?: number;
}) {
  return (
    <g style={{ transition: "all 0.4s" }}>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={active ? color : COL.surface}
        stroke={active ? color : COL.border}
        strokeWidth={active ? 2 : 1}
        style={{ filter: active ? `drop-shadow(0 0 8px ${color})` : undefined, transition: "all 0.4s" }}
      />
      <text x={x} y={y + 3.5} textAnchor="middle" className="mono" fontSize="10" fontWeight={700} fill={active ? "#06121a" : color}>
        {label}
      </text>
      <text x={x} y={y - r - 5} textAnchor="middle" className="mono" fontSize="9" fill={COL.faint}>
        {sub}
      </text>
    </g>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest" style={{ color: COL.faint }}>
        {label}
      </div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-[10px] uppercase tracking-widest w-16" style={{ color: COL.faint }}>
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
        style={{ accentColor: color }}
      />
      <span className="mono text-[11px] w-8 text-right" style={{ color }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}
