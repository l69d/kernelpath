"use client";

import { useMemo, useState } from "react";

/* ---------------- cs0-06 Discrete probability — two-dice sample space ---------------- */

type EventKey = "sum7" | "doubles" | "gt9";

const EVENTS: { key: EventKey; label: string; desc: string; color: string }[] = [
  { key: "sum7", label: "sum = 7", desc: "the two faces add up to 7", color: "#3fb950" },
  { key: "doubles", label: "doubles", desc: "both dice show the same number", color: "#39c5e0" },
  { key: "gt9", label: "sum > 9", desc: "the two faces add up to 10, 11 or 12", color: "#bc8cff" },
];

function inEvent(ev: EventKey, a: number, b: number): boolean {
  if (ev === "sum7") return a + b === 7;
  if (ev === "doubles") return a === b;
  return a + b > 9;
}

// greatest common divisor for reducing the fraction
function gcd(x: number, y: number): number {
  return y === 0 ? x : gcd(y, x % y);
}

export default function ProbabilityViz() {
  const [evKey, setEvKey] = useState<EventKey>("sum7");
  const [hover, setHover] = useState<{ a: number; b: number } | null>(null);

  const ev = EVENTS.find((e) => e.key === evKey)!;

  const favourable = useMemo(() => {
    let n = 0;
    for (let a = 1; a <= 6; a++)
      for (let b = 1; b <= 6; b++) if (inEvent(evKey, a, b)) n++;
    return n;
  }, [evKey]);

  const total = 36;
  const g = gcd(favourable, total);
  const reducedN = favourable / g;
  const reducedD = total / g;
  const pct = ((favourable / total) * 100).toFixed(1);

  const hoverFav = hover ? inEvent(evKey, hover.a, hover.b) : false;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* event picker */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          <span className="mono text-[10px] uppercase tracking-widest text-faint mr-1">
            event
          </span>
          {EVENTS.map((e) => (
            <button
              key={e.key}
              onClick={() => setEvKey(e.key)}
              className="grid place-items-center rounded-lg px-3 py-1.5 transition-all"
              style={{
                background: e.key === evKey ? e.color : "#10151d",
                border: `1px solid ${e.key === evKey ? e.color : "#1e2630"}`,
                color: e.key === evKey ? "#06121a" : "#8a97a8",
                boxShadow: e.key === evKey ? `0 0 22px -6px ${e.color}` : undefined,
              }}
            >
              <span className="mono text-[11px] font-bold whitespace-nowrap">
                {e.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col lg:flex-row items-center gap-6">
          {/* 6x6 sample space */}
          <div className="shrink-0">
            <svg
              viewBox="0 0 252 252"
              className="w-full"
              style={{ maxHeight: 252, maxWidth: 252 }}
            >
              {Array.from({ length: 6 }).map((_, ri) =>
                Array.from({ length: 6 }).map((__, ci) => {
                  const a = ri + 1; // row = die A
                  const b = ci + 1; // col = die B
                  const fav = inEvent(evKey, a, b);
                  const isHover = hover?.a === a && hover?.b === b;
                  const x = ci * 42;
                  const y = ri * 42;
                  return (
                    <g
                      key={`${a}-${b}`}
                      onMouseEnter={() => setHover({ a, b })}
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={38}
                        height={38}
                        rx={5}
                        fill={fav ? `${ev.color}26` : "#10151d"}
                        stroke={
                          isHover ? ev.color : fav ? ev.color : "#1e2630"
                        }
                        strokeWidth={isHover ? 2 : 1}
                        style={{
                          filter: isHover
                            ? `drop-shadow(0 0 6px ${ev.color})`
                            : undefined,
                        }}
                      />
                      <text
                        x={x + 21}
                        y={y + 25}
                        textAnchor="middle"
                        className="mono"
                        fontSize="11"
                        fontWeight={fav ? 700 : 400}
                        fill={fav ? ev.color : "#5b6b7d"}
                      >
                        {a}·{b}
                      </text>
                    </g>
                  );
                }),
              )}
            </svg>
            <div className="mono text-[10px] text-faint text-center mt-1">
              rows = die&nbsp;A · cols = die&nbsp;B
            </div>
          </div>

          {/* readouts */}
          <div className="flex-1 w-full space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="card py-2">
                <div className="mono text-[10px] uppercase tracking-widest text-faint">
                  favourable
                </div>
                <div
                  className="mono text-2xl font-bold mt-0.5"
                  style={{ color: ev.color }}
                >
                  {favourable}
                </div>
              </div>
              <div className="card py-2">
                <div className="mono text-[10px] uppercase tracking-widest text-faint">
                  total outcomes
                </div>
                <div className="mono text-2xl font-bold mt-0.5 text-text">
                  {total}
                </div>
              </div>
            </div>

            {/* the fraction = counting */}
            <div className="card p-3 flex items-center justify-center gap-3">
              <span className="mono text-xs text-muted">P({ev.label})</span>
              <span className="mono text-lg text-faint">=</span>
              <span className="inline-flex flex-col items-center leading-none">
                <span
                  className="mono text-lg font-bold"
                  style={{ color: ev.color }}
                >
                  {favourable}
                </span>
                <span className="block h-px w-8 my-1 bg-border" />
                <span className="mono text-lg font-bold text-text">{total}</span>
              </span>
              {g > 1 && (
                <>
                  <span className="mono text-lg text-faint">=</span>
                  <span className="inline-flex flex-col items-center leading-none">
                    <span
                      className="mono text-lg font-bold"
                      style={{ color: ev.color }}
                    >
                      {reducedN}
                    </span>
                    <span className="block h-px w-6 my-1 bg-border" />
                    <span className="mono text-lg font-bold text-text">
                      {reducedD}
                    </span>
                  </span>
                </>
              )}
              <span className="mono text-lg text-faint">≈</span>
              <span
                className="mono text-lg font-bold"
                style={{ color: ev.color }}
              >
                {pct}%
              </span>
            </div>

            {/* probability bar */}
            <div>
              <div className="h-5 w-full rounded overflow-hidden border border-border bg-[#10151d]">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(favourable / total) * 100}%`,
                    background: ev.color,
                    boxShadow: `0 0 16px -4px ${ev.color}`,
                  }}
                />
              </div>
              <div className="mono text-[10px] text-faint mt-1 flex justify-between">
                <span>0</span>
                <span>P = {pct}%</span>
                <span>1</span>
              </div>
            </div>

            {/* live hover readout */}
            <div className="card p-3 min-h-[54px] flex items-center gap-2">
              {hover ? (
                <>
                  <span className="mono text-xs text-muted">
                    A={hover.a}, B={hover.b} · sum={hover.a + hover.b}
                  </span>
                  <span
                    className="mono text-[11px] font-bold rounded px-2 py-0.5 ml-auto"
                    style={{
                      background: hoverFav ? `${ev.color}22` : "#161c26",
                      color: hoverFav ? ev.color : "#5b6b7d",
                      border: `1px solid ${hoverFav ? `${ev.color}55` : "#1e2630"}`,
                    }}
                  >
                    {hoverFav ? "in event ✓" : "not in event"}
                  </span>
                </>
              ) : (
                <span className="mono text-xs text-muted">
                  Hover a cell. Each of the {total} cells is one equally-likely
                  outcome — <b className="text-text">{ev.desc}</b> covers{" "}
                  <b style={{ color: ev.color }}>{favourable}</b> of them.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Probability is just counting: P(event) = favourable outcomes ÷ 36 equally
        likely outcomes.
      </p>
    </div>
  );
}