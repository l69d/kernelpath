"use client";

import { useEffect, useMemo, useState } from "react";

/* t0-04 — Number Systems & Two's Complement
 * A 4-bit circular odometer (16 positions). Step the value and watch
 * unsigned wrap 15->0; the top half is shaded as the negative range.
 * Toggle bits, and watch negate(x) = ~x + 1 light up on the wheel. */

const BITS = 4;
const N = 1 << BITS; // 16
const RED = "#f85149";
const GREEN = "#3fb950";
const CYAN = "#39c5e0";
const AMBER = "#e3a93c";
const PURPLE = "#bc8cff";

const signedOf = (v: number): number => (v < N / 2 ? v : v - N);
const negate = (v: number): number => (~v + 1) & (N - 1);
const toBits = (v: number): number[] =>
  Array.from({ length: BITS }, (_, i) => (v >> (BITS - 1 - i)) & 1);

export default function TwosComplementViz() {
  const [val, setVal] = useState(5);
  const [auto, setAuto] = useState(false);
  const [hoverNeg, setHoverNeg] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setVal((v) => (v + 1) % N), 700);
    return () => clearInterval(t);
  }, [auto]);

  const bits = useMemo(() => toBits(val), [val]);
  const signed = signedOf(val);
  const neg = negate(val);
  const inverted = (~val) & (N - 1);

  // wheel geometry
  const cx = 130;
  const cy = 130;
  const R = 90;
  const tickXY = (v: number, r: number): [number, number] => {
    const ang = (v / N) * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };
  // the highlighted "negate" target when hovering
  const focus = hoverNeg ? neg : val;
  const [px, py] = tickXY(focus, R);

  const step = (d: number) => {
    setAuto(false);
    setVal((v) => (v + d + N) % N);
  };
  const toggleBit = (i: number) => {
    setAuto(false);
    setVal((v) => v ^ (1 << (BITS - 1 - i)));
  };

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col md:flex-row items-center gap-6 py-2">
          {/* ---- the odometer wheel ---- */}
          <svg
            viewBox="0 0 260 260"
            className="w-full shrink-0"
            style={{ maxWidth: 250, maxHeight: 250 }}
          >
            {/* top-half negative shading */}
            <path
              d={`M ${cx} ${cy} L ${tickXY(0, R + 18)[0]} ${tickXY(0, R + 18)[1]} A ${R + 18} ${R + 18} 0 0 0 ${tickXY(N / 2, R + 18)[0]} ${tickXY(N / 2, R + 18)[1]} Z`}
              fill={`${RED}14`}
              stroke="none"
            />
            <circle cx={cx} cy={cy} r={R + 18} fill="none" stroke="#1e2630" strokeWidth={1} />
            <circle cx={cx} cy={cy} r={R - 18} fill="none" stroke="#1e2630" strokeWidth={1} />

            {/* needle */}
            <line
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke={hoverNeg ? PURPLE : signed < 0 ? RED : GREEN}
              strokeWidth={2}
            />
            <circle cx={cx} cy={cy} r={3} fill="#8a97a8" />

            {/* 16 positions */}
            {Array.from({ length: N }).map((_, v) => {
              const [x, y] = tickXY(v, R);
              const isNeg = v >= N / 2;
              const on = v === val;
              const isNegTarget = hoverNeg && v === neg;
              const col = isNeg ? RED : GREEN;
              return (
                <g key={v}>
                  <circle
                    cx={x}
                    cy={y}
                    r={on || isNegTarget ? 13 : 10}
                    fill={on ? col : isNegTarget ? `${PURPLE}` : `${col}1a`}
                    stroke={on ? col : isNegTarget ? PURPLE : `${col}55`}
                    strokeWidth={on || isNegTarget ? 2 : 1}
                    style={{ cursor: "pointer", transition: "all .15s" }}
                    onClick={() => {
                      setAuto(false);
                      setVal(v);
                    }}
                  />
                  <text
                    x={x}
                    y={y + 3.5}
                    textAnchor="middle"
                    className="mono"
                    fontSize={9}
                    fontWeight={on || isNegTarget ? 700 : 400}
                    fill={on || isNegTarget ? "#06121a" : isNeg ? RED : "#8a97a8"}
                    style={{ pointerEvents: "none" }}
                  >
                    {v}
                  </text>
                </g>
              );
            })}

            {/* wrap seam between 15 and 0 */}
            <text x={cx} y={cy - R - 24} textAnchor="middle" className="mono" fontSize={8} fill="#5b6b7d">
              15 ↺ 0
            </text>
            <text x={cx} y={cy + 50} textAnchor="middle" className="mono" fontSize={9} fill={GREEN}>
              positive
            </text>
            <text x={cx} y={cy - 38} textAnchor="middle" className="mono" fontSize={9} fill={RED}>
              negative (8…15)
            </text>
          </svg>

          {/* ---- right column ---- */}
          <div className="flex-1 w-full space-y-3">
            {/* readout */}
            <div className="grid grid-cols-2 gap-2">
              <Read label="unsigned" value={String(val)} color={CYAN} />
              <Read
                label="signed (two's comp)"
                value={signed > 0 ? `+${signed}` : String(signed)}
                color={signed < 0 ? RED : GREEN}
              />
            </div>

            {/* bit toggles */}
            <div className="card p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
                toggle bits · weights {`8 4 2 1`} (top bit = sign)
              </div>
              <div className="flex justify-center gap-1.5">
                {bits.map((b, i) => {
                  const weight = 1 << (BITS - 1 - i);
                  const isSign = i === 0;
                  return (
                    <button
                      key={i}
                      onClick={() => toggleBit(i)}
                      className="grid place-items-center rounded mono transition-all"
                      style={{
                        width: 40,
                        height: 46,
                        background: b ? (isSign ? RED : GREEN) : "#10151d",
                        border: `1px solid ${b ? (isSign ? RED : GREEN) : "#1e2630"}`,
                        color: b ? "#06121a" : "#5b6b7d",
                      }}
                    >
                      <span className="text-base font-bold leading-none">{b}</span>
                      <span className="text-[8px] opacity-80 mt-0.5">{isSign ? `−${weight}` : weight}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* negate panel */}
            <div
              className="card p-3"
              onMouseEnter={() => setHoverNeg(true)}
              onMouseLeave={() => setHoverNeg(false)}
            >
              <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 text-center">
                negate(x) = ~x + 1
              </div>
              <div className="flex items-center justify-center gap-2 mono text-xs flex-wrap">
                <Cell bits={toBits(val)} label={`x = ${val}`} color={CYAN} />
                <span className="text-faint">~</span>
                <Cell bits={toBits(inverted)} label={`~x = ${inverted}`} color={AMBER} />
                <span className="text-faint">+1</span>
                <span className="text-green">→</span>
                <Cell bits={toBits(neg)} label={`= ${signedOf(neg) >= 0 ? "+" : ""}${signedOf(neg)}`} color={PURPLE} />
              </div>
              <p className="text-[11px] text-muted text-center mt-2">
                {val === 8
                  ? "−8 is its own negation — there's no +8 in 4 bits (one extra negative)."
                  : val === 0
                    ? "0 negates to 0 (the carry wraps off the top)."
                    : "Hover here: the wheel shows where the negative lands."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button onClick={() => step(-1)} className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text">
          − step
        </button>
        <button
          onClick={() => setAuto((a) => !a)}
          className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          {auto ? "❚❚ pause" : "▶ play"}
        </button>
        <button onClick={() => step(1)} className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text">
          + step
        </button>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Step past 15 and it wraps to 0 — the wheel has no edge. The top half (8…15) is read as −8…−1, so the high bit is the sign.
      </p>
    </div>
  );
}

function Read({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-xl font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Cell({ bits, label, color }: { bits: number[]; label: string; color: string }) {
  return (
    <div className="grid place-items-center gap-1">
      <div className="flex gap-0.5">
        {bits.map((b, i) => (
          <span
            key={i}
            className="grid place-items-center rounded-sm"
            style={{
              width: 14,
              height: 16,
              fontSize: 10,
              background: b ? `${color}33` : "#10151d",
              border: `1px solid ${b ? color : "#1e2630"}`,
              color: b ? color : "#5b6b7d",
            }}
          >
            {b}
          </span>
        ))}
      </div>
      <span className="text-[9px]" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
