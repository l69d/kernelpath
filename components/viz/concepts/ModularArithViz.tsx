"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------------- cs0-08 Modular arithmetic clock ---------------- */
/* A clock with N positions. Pick a, b and an operation; watch the hand
 * wrap around the face and land on the result mod N. The congruence row
 * shows which integers are equivalent to that result mod N.            */

type Op = "add" | "mul";

const OP_COLOR: Record<Op, string> = { add: "#3fb950", mul: "#bc8cff" };
const OP_SIGN: Record<Op, string> = { add: "+", mul: "×" };

export default function ModularArithViz() {
  const [n, setN] = useState(12);
  const [a, setA] = useState(7);
  const [b, setB] = useState(8);
  const [op, setOp] = useState<Op>("add");
  const [playing, setPlaying] = useState(true);

  // raw (un-wrapped) value and final landing position
  const raw = op === "add" ? a + b : a * b;
  const result = ((raw % n) + n) % n;
  const wraps = Math.floor(raw / n);

  // animate the hand stepping around the face, one tick at a time
  const [tick, setTick] = useState(raw);
  useEffect(() => {
    setTick(0);
  }, [a, b, n, op]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTick((t) => (t >= raw ? 0 : t + 1));
    }, raw > 36 ? 45 : 130);
    return () => clearInterval(id);
  }, [playing, raw]);

  const handPos = ((tick % n) + n) % n;
  const handWraps = Math.floor(tick / n);
  const done = tick >= raw;

  const color = OP_COLOR[op];

  // geometry of the clock face
  const R = 92;
  const cx = 110;
  const cy = 110;
  const angle = (pos: number) => (pos / n) * 2 * Math.PI - Math.PI / 2;
  const pt = (pos: number, r: number) => ({
    x: cx + r * Math.cos(angle(pos)),
    y: cy + r * Math.sin(angle(pos)),
  });

  const tip = pt(handPos, R - 14);

  // integers congruent to the result mod N (the equivalence class)
  const congruent = useMemo(
    () => Array.from({ length: 5 }, (_, k) => result + (k - 2) * n),
    [result, n],
  );

  // arc the hand has swept so far, as a fraction (for the trailing trace)
  const swept = raw === 0 ? 0 : Math.min(tick, raw) / n;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* operation toggle */}
        <div className="flex justify-center gap-2 py-1">
          {(["add", "mul"] as Op[]).map((o) => (
            <button
              key={o}
              onClick={() => setOp(o)}
              className="mono text-[11px] font-bold rounded px-3 py-1 transition-all"
              style={{
                background: op === o ? OP_COLOR[o] : "#10151d",
                border: `1px solid ${op === o ? OP_COLOR[o] : "#1e2630"}`,
                color: op === o ? "#06121a" : "#8a97a8",
              }}
            >
              (a {OP_SIGN[o]} b) mod N
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-5 py-3">
          {/* clock face */}
          <svg
            viewBox="0 0 220 220"
            className="w-full shrink-0"
            style={{ maxHeight: 240, maxWidth: 240 }}
          >
            <circle cx={cx} cy={cy} r={R} fill="#10151d" stroke="#1e2630" strokeWidth={2} />
            {/* swept arc trace */}
            {swept > 0 && (
              <circle
                cx={cx}
                cy={cy}
                r={R - 14}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * (R - 14)}`}
                strokeDashoffset={`${2 * Math.PI * (R - 14) * (1 - Math.min(swept, 1))}`}
                transform={`rotate(-90 ${cx} ${cy})`}
                opacity={0.35}
              />
            )}
            {/* tick positions */}
            {Array.from({ length: n }, (_, i) => {
              const p = pt(i, R - 14);
              const isResult = done && i === result;
              const isHand = i === handPos;
              const fill = isResult
                ? color
                : isHand
                  ? "#161c26"
                  : "#161c26";
              const stroke = isResult || isHand ? color : "#1e2630";
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={11}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isResult || isHand ? 2 : 1}
                  />
                  <text
                    x={p.x}
                    y={p.y + 3.5}
                    textAnchor="middle"
                    className="mono"
                    fontSize={10}
                    fontWeight={isResult ? 700 : 400}
                    fill={isResult ? "#06121a" : isHand ? color : "#8a97a8"}
                  >
                    {i}
                  </text>
                </g>
              );
            })}
            {/* hand */}
            <line
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={4} fill={color} />
            {/* wrap counter at center */}
            <text
              x={cx}
              y={cy + 34}
              textAnchor="middle"
              className="mono"
              fontSize={9}
              fill="#5b6b7d"
            >
              {handWraps > 0 ? `↻ ${handWraps}` : ""}
            </text>
          </svg>

          {/* controls + readout */}
          <div className="flex-1 w-full space-y-3">
            <Slider label="N (clock size)" value={n} min={2} max={20} color="#39c5e0"
              onChange={(v) => { setN(v); if (a >= v) setA(v - 1); if (b >= v) setB(v - 1); }} />
            <Slider label="a" value={a} min={0} max={n - 1} color="#e3a93c" onChange={setA} />
            <Slider label="b" value={b} min={0} max={n - 1} color="#f778ba" onChange={setB} />

            <div className="card p-3 text-center">
              <div className="mono text-sm" style={{ color: "#d6dee8" }}>
                ({a} {OP_SIGN[op]} {b}) mod {n} ={" "}
                <span className="font-bold" style={{ color }}>{result}</span>
              </div>
              <div className="mono text-[11px] text-faint mt-1">
                raw = {raw}{wraps > 0 && <> = {wraps}×{n} + {result} &nbsp;(wrapped {wraps}×)</>}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
              >
                {playing ? "❚❚ pause hand" : "▶ run hand"}
              </button>
            </div>
          </div>
        </div>

        {/* congruence class */}
        <div className="card p-3 mt-1">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
            all integers ≡ {result} (mod {n})
          </div>
          <div className="flex justify-center gap-1.5 flex-wrap">
            {congruent.map((m) => (
              <span
                key={m}
                className="mono text-[11px] rounded px-2 py-1"
                style={{
                  background: m === result ? color : "#10151d",
                  color: m === result ? "#06121a" : "#8a97a8",
                  border: `1px solid ${m === result ? color : "#1e2630"}`,
                  fontWeight: m === result ? 700 : 400,
                }}
              >
                {m}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-muted mt-2">
            Two numbers are <b className="text-text">congruent mod {n}</b> when they land on the
            same clock position — they differ by a whole number of full turns.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-faint mono text-center">
        Drag a, b, or N. The hand steps {OP_SIGN[op]} units around the face; each lap of {n} is one wrap.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="mono text-[11px] w-24 shrink-0" style={{ color }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
      <span className="mono text-xs font-bold w-7 text-right" style={{ color }}>
        {value}
      </span>
    </div>
  );
}