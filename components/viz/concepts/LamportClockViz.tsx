"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs10-03 — Time, Clocks & Ordering (Lamport logical clocks)
 *  Three processes as vertical timelines. Local events tick the clock;
 *  messages carry a timestamp so receive = max(local, msg) + 1.
 *  Step the events, watch the clocks update, trace happens-before,
 *  and see a genuinely CONCURRENT pair that no clock can order.
 * ================================================================== */

type Ev = {
  id: string;
  p: number; // process index 0..2
  row: number; // vertical slot (time tick within the diagram)
  send?: string; // id of the matching receive event
  recvFrom?: string; // id of the matching send event
};

// Deterministic scenario. row = vertical position (top → bottom).
const EVENTS: Ev[] = [
  { id: "a", p: 0, row: 0 },
  { id: "b", p: 1, row: 0 },
  { id: "c", p: 0, row: 1, send: "d" },
  { id: "d", p: 1, row: 2, recvFrom: "c" },
  { id: "e", p: 2, row: 1, send: "f" },
  { id: "f", p: 1, row: 3, recvFrom: "e" },
  { id: "g", p: 0, row: 3 },
  { id: "h", p: 1, row: 4, send: "i" },
  { id: "i", p: 2, row: 5, recvFrom: "h" },
  { id: "j", p: 2, row: 6, send: "k" },
  { id: "k", p: 0, row: 6, recvFrom: "j" },
];

const PCOLORS = ["#39c5e0", "#bc8cff", "#e3a93c"]; // P0 cyan, P1 purple, P2 amber
const PNAMES = ["P0", "P1", "P2"];

// Lamport clock scan, evaluated up to (and including) `upto` events revealed.
function computeClocks(revealed: number): {
  ts: Record<string, number>;
  order: string[];
} {
  const ts: Record<string, number> = {};
  const last: Record<number, number> = { 0: 0, 1: 0, 2: 0 }; // last clock per process
  // process events in their true causal order: sort by row, then send-before-recv.
  const order = [...EVENTS].sort((x, y) => {
    if (x.row !== y.row) return x.row - y.row;
    return x.id < y.id ? -1 : 1;
  });
  const visible = order.slice(0, revealed);
  for (const ev of visible) {
    if (ev.recvFrom && ts[ev.recvFrom] !== undefined) {
      ts[ev.id] = Math.max(last[ev.p], ts[ev.recvFrom]) + 1;
    } else {
      ts[ev.id] = last[ev.p] + 1;
    }
    last[ev.p] = ts[ev.id];
  }
  return { ts, order: visible.map((e) => e.id) };
}

// Build the transitive happens-before predecessor set for an event.
function predecessors(id: string): Set<string> {
  const byId: Record<string, Ev> = {};
  for (const e of EVENTS) byId[e.id] = e;
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop() as string;
    const ev = byId[cur];
    if (!ev) continue;
    // program order: same process, lower row
    for (const o of EVENTS) {
      if (o.p === ev.p && o.row < ev.row && !seen.has(o.id)) {
        seen.add(o.id);
        stack.push(o.id);
      }
    }
    // message order: a receive happens-after its send
    if (ev.recvFrom && !seen.has(ev.recvFrom)) {
      seen.add(ev.recvFrom);
      stack.push(ev.recvFrom);
    }
  }
  return seen;
}

export default function LamportClockViz() {
  const total = EVENTS.length;
  const [revealed, setRevealed] = useState(total);
  const [hover, setHover] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setRevealed((r) => {
        if (r >= total) {
          setPlaying(false);
          return r;
        }
        return r + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, [playing, total]);

  const { ts } = useMemo(() => computeClocks(revealed), [revealed]);
  const visibleIds = useMemo(() => new Set(Object.keys(ts)), [ts]);

  // The highlighted chain: a → c → d → f → h → i (a causal path).
  const causalChain = ["a", "c", "d", "f"];
  // The concurrent pair: g (P0, row3) and f (P1, row3) — neither precedes the other.
  const concPair: [string, string] = ["g", "e"];

  const hoverPreds = useMemo(
    () => (hover ? predecessors(hover) : new Set<string>()),
    [hover],
  );

  // SVG geometry
  const W = 720;
  const rows = 7;
  const rowH = 52;
  const topPad = 56;
  const H = topPad + rows * rowH + 28;
  const laneX = [140, 360, 580];
  const yOf = (row: number) => topPad + row * rowH + rowH / 2;
  const byId: Record<string, Ev> = {};
  for (const e of EVENTS) byId[e.id] = e;

  const concSet = new Set(concPair);

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-wrap items-center justify-center gap-2 pb-3">
          <button
            onClick={() => {
              setPlaying(false);
              setRevealed(0);
            }}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ↺ reset
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setRevealed((r) => Math.max(0, r - 1));
            }}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ‹ step back
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setRevealed((r) => Math.min(total, r + 1));
            }}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            step ›
          </button>
          <button
            onClick={() => {
              if (revealed >= total) setRevealed(0);
              setPlaying((p) => !p);
            }}
            className="mono text-[11px] rounded px-3 py-1"
            style={{
              border: "1px solid #3fb950",
              color: playing ? "#06121a" : "#56d364",
              background: playing ? "#3fb950" : "transparent",
            }}
          >
            {playing ? "❚❚ pause" : "▶ play"}
          </button>
          <span className="mono text-[11px] text-faint pl-1">
            {revealed}/{total} events
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 460 }}
          role="img"
          aria-label="Three process timelines with Lamport timestamps"
        >
          {/* process lanes + headers */}
          {laneX.map((x, p) => (
            <g key={p}>
              <line
                x1={x}
                y1={topPad - 18}
                x2={x}
                y2={H - 16}
                stroke="#1e2630"
                strokeWidth={2}
              />
              <rect
                x={x - 30}
                y={18}
                width={60}
                height={24}
                rx={5}
                fill="#10151d"
                stroke={PCOLORS[p]}
              />
              <text
                x={x}
                y={34}
                textAnchor="middle"
                className="mono"
                fontSize={12}
                fontWeight={700}
                fill={PCOLORS[p]}
              >
                {PNAMES[p]}
              </text>
              <polygon
                points={`${x - 5},${H - 16} ${x + 5},${H - 16} ${x},${H - 8}`}
                fill="#1e2630"
              />
            </g>
          ))}

          {/* message arrows (diagonal) */}
          {EVENTS.filter((e) => e.send).map((e) => {
            const r = byId[e.send as string];
            const shown = visibleIds.has(e.id) && visibleIds.has(r.id);
            const onChain =
              hover === null &&
              causalChain.includes(e.id) &&
              causalChain.includes(r.id);
            const onHover = hover
              ? (hoverPreds.has(e.id) || hover === e.id) &&
                (hoverPreds.has(r.id) || hover === r.id)
              : false;
            const lit = onChain || onHover;
            const x1 = laneX[e.p];
            const y1 = yOf(e.row);
            const x2 = laneX[r.p];
            const y2 = yOf(r.row);
            const dir = x2 > x1 ? 1 : -1;
            return (
              <line
                key={e.id + "-msg"}
                x1={x1 + dir * 8}
                y1={y1}
                x2={x2 - dir * 12}
                y2={y2}
                stroke={lit ? "#56d364" : shown ? "#3a4655" : "#222b36"}
                strokeWidth={lit ? 2.4 : 1.6}
                strokeDasharray={shown ? undefined : "3 4"}
                markerEnd={
                  lit ? "url(#arrowLit)" : shown ? "url(#arrow)" : "url(#arrowDim)"
                }
                opacity={shown ? 1 : 0.45}
              />
            );
          })}

          {/* events */}
          {EVENTS.map((e) => {
            const shown = visibleIds.has(e.id);
            const x = laneX[e.p];
            const y = yOf(e.row);
            const t = ts[e.id];
            const isConc = concSet.has(e.id);
            const onChain = hover === null && causalChain.includes(e.id);
            const isHover = hover === e.id;
            const isPred = hover ? hoverPreds.has(e.id) : false;
            const dim = hover ? !isHover && !isPred : false;

            let stroke = PCOLORS[e.p];
            let fill = "#10151d";
            if (!shown) {
              stroke = "#222b36";
              fill = "#0b0f15";
            } else if (isHover) {
              stroke = "#56d364";
              fill = "#3fb950";
            } else if (isPred) {
              stroke = "#56d364";
              fill = "#10151d";
            } else if (onChain) {
              stroke = "#56d364";
              fill = "#10151d";
            } else if (isConc) {
              stroke = "#f778ba";
            }

            return (
              <g
                key={e.id}
                onMouseEnter={() => shown && setHover(e.id)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: shown ? "pointer" : "default" }}
                opacity={dim ? 0.32 : 1}
              >
                {isConc && shown && (
                  <circle
                    cx={x}
                    cy={y}
                    r={17}
                    fill="none"
                    stroke="#f778ba"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={13}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHover || isPred ? 2.4 : 1.8}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  className="mono"
                  fontSize={12}
                  fontWeight={700}
                  fill={
                    !shown
                      ? "#3a4655"
                      : isHover
                        ? "#06121a"
                        : "#d6dee8"
                  }
                >
                  {shown ? t : "·"}
                </text>
                {/* event letter tag */}
                <text
                  x={x + (e.p === 2 ? -24 : 20)}
                  y={y + 4}
                  textAnchor={e.p === 2 ? "end" : "start"}
                  className="mono"
                  fontSize={10}
                  fill={shown ? "#5b6b7d" : "#2b3a49"}
                >
                  {e.id}
                </text>
              </g>
            );
          })}

          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#3a4655" />
            </marker>
            <marker id="arrowLit" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#56d364" />
            </marker>
            <marker id="arrowDim" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#222b36" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* readout cards */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="card p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-faint">
            update rule
          </div>
          <p className="mono text-[11px] text-cyan mt-1 leading-relaxed">
            send: <span className="text-green">C = C + 1</span>
            <br />
            recv: <span className="text-green">C = max(C, msg) + 1</span>
          </p>
        </div>
        <div className="card p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-faint">
            <span style={{ color: "#56d364" }}>happens-before chain</span>
          </div>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">
            a → c ⇢ d → f. Each link forces a strictly larger clock, so
            <b className="text-text"> A → B implies C(A) &lt; C(B)</b>.
          </p>
        </div>
        <div className="card p-3">
          <div className="mono text-[10px] uppercase tracking-widest text-faint">
            <span style={{ color: "#f778ba" }}>concurrent pair</span>
          </div>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">
            e ∥ g — no message or program-order path connects them. Lamport
            can&apos;t order them; equal-ish clocks don&apos;t imply causality.
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Step the events, or hover any node to light up everything that
        happened-before it. Numbers inside circles are Lamport timestamps.
      </p>
    </div>
  );
}