"use client";

import { useEffect, useState } from "react";

/* ---------------- cs9-04 TCP 3-way handshake & teardown ---------------- */

type Dir = "c2s" | "s2c" | null;

type Step = {
  /** packet label shown on the arrow, e.g. "SYN" */
  flag: string;
  /** arrow direction; null = local state transition, no packet */
  dir: Dir;
  /** sequence / ack annotation under the flag */
  detail: string;
  /** client connection state AFTER this step */
  cState: string;
  /** server connection state AFTER this step */
  sState: string;
  /** colour for the packet / highlight */
  c: string;
  /** one-line teaching note */
  note: string;
};

// Fixed initial sequence numbers (deterministic — no RNG, SSR-safe).
const X = 1000; // client ISN
const Y = 5000; // server ISN

const STEPS: Step[] = [
  {
    flag: "—",
    dir: null,
    detail: "server opens a passive socket",
    cState: "CLOSED",
    sState: "LISTEN",
    c: "#5b6b7d",
    note: "The server calls listen() and waits. The client hasn't sent anything yet.",
  },
  {
    flag: "SYN",
    dir: "c2s",
    detail: `seq=${X}`,
    cState: "SYN-SENT",
    sState: "LISTEN",
    c: "#39c5e0",
    note: `Client sends SYN with its initial sequence number x=${X}, asking to synchronize.`,
  },
  {
    flag: "SYN-ACK",
    dir: "s2c",
    detail: `seq=${Y}  ack=${X + 1}`,
    cState: "SYN-SENT",
    sState: "SYN-RECEIVED",
    c: "#bc8cff",
    note: `Server replies: SYN with its own y=${Y}, and ACK=${X + 1} to acknowledge the client's byte.`,
  },
  {
    flag: "ACK",
    dir: "c2s",
    detail: `seq=${X + 1}  ack=${Y + 1}`,
    cState: "ESTABLISHED",
    sState: "SYN-RECEIVED",
    c: "#3fb950",
    note: `Client acknowledges the server's SYN with ACK=${Y + 1}. Its side is now ESTABLISHED.`,
  },
  {
    flag: "data",
    dir: "c2s",
    detail: "connection ready · bytes flow",
    cState: "ESTABLISHED",
    sState: "ESTABLISHED",
    c: "#56d364",
    note: "The server sees the ACK and is ESTABLISHED too. Reliable, ordered bytes can now flow.",
  },
  {
    flag: "FIN",
    dir: "c2s",
    detail: `seq=${X + 1}`,
    cState: "FIN-WAIT",
    sState: "CLOSE-WAIT",
    c: "#e3a93c",
    note: "Teardown: the client is done and sends FIN. TCP closes each direction independently.",
  },
  {
    flag: "FIN-ACK",
    dir: "s2c",
    detail: `ack=${X + 2}  seq=${Y + 1}`,
    cState: "TIME-WAIT",
    sState: "LAST-ACK",
    c: "#f778ba",
    note: "Server ACKs, sends its own FIN, then the client's final ACK closes the connection.",
  },
];

const ST_COLORS: Record<string, string> = {
  CLOSED: "#5b6b7d",
  LISTEN: "#58a6ff",
  "SYN-SENT": "#39c5e0",
  "SYN-RECEIVED": "#bc8cff",
  ESTABLISHED: "#3fb950",
  "FIN-WAIT": "#e3a93c",
  "CLOSE-WAIT": "#e3a93c",
  "TIME-WAIT": "#f778ba",
  "LAST-ACK": "#f778ba",
};

// SVG geometry
const CX = 90; // client timeline x
const SX = 470; // server timeline x
const TOP = 64; // y of first packet row
const ROW = 40; // vertical gap between packet rows
const H = TOP + ROW * (STEPS.length - 1) + 40;

export default function TcpHandshakeViz() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      1600,
    );
    return () => clearInterval(t);
  }, [auto]);

  const cur = STEPS[step];

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* state badges */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StateCard side="CLIENT (active open)" state={cur.cState} />
          <StateCard side="SERVER (passive open)" state={cur.sState} />
        </div>

        <svg viewBox={`0 0 560 ${H}`} className="w-full" style={{ maxHeight: 360 }}>
          {/* timelines */}
          {[CX, SX].map((x) => (
            <line
              key={x}
              x1={x}
              y1={TOP - 28}
              x2={x}
              y2={H - 8}
              stroke="#1e2630"
              strokeWidth={2}
            />
          ))}
          <text x={CX} y={TOP - 38} textAnchor="middle" className="mono" fontSize={11} fill="#39c5e0">
            client
          </text>
          <text x={SX} y={TOP - 38} textAnchor="middle" className="mono" fontSize={11} fill="#3fb950">
            server
          </text>

          {/* packet rows */}
          {STEPS.map((s, i) => {
            const y = TOP + ROW * i;
            const done = i <= step;
            const isNow = i === step;
            const col = isNow ? s.c : done ? "#2b3a49" : "#161c26";
            const txtCol = isNow ? s.c : done ? "#8a97a8" : "#3a4654";

            // arrow endpoints
            const fromX = s.dir === "c2s" ? CX : SX;
            const toX = s.dir === "c2s" ? SX : CX;
            const ay = y; // arrow y (slanted slightly for travel feel)
            const ay2 = y + 14;

            return (
              <g key={i} opacity={i > step ? 0.4 : 1}>
                {s.dir && (
                  <>
                    <line
                      x1={fromX + (s.dir === "c2s" ? 6 : -6)}
                      y1={ay}
                      x2={toX + (s.dir === "c2s" ? -10 : 10)}
                      y2={ay2}
                      stroke={col}
                      strokeWidth={isNow ? 2.5 : 1.5}
                    />
                    {/* arrowhead */}
                    <polygon
                      points={
                        s.dir === "c2s"
                          ? `${toX - 10},${ay2} ${toX - 19},${ay2 - 4} ${toX - 19},${ay2 + 4}`
                          : `${toX + 10},${ay2} ${toX + 19},${ay2 - 4} ${toX + 19},${ay2 + 4}`
                      }
                      fill={col}
                    />
                  </>
                )}
                {/* flag label */}
                <text
                  x={280}
                  y={ay - 3}
                  textAnchor="middle"
                  className="mono"
                  fontSize={isNow ? 13 : 11}
                  fontWeight={isNow ? 700 : 500}
                  fill={txtCol}
                >
                  {s.flag}
                </text>
                {/* seq/ack detail */}
                <text
                  x={280}
                  y={ay + 11}
                  textAnchor="middle"
                  className="mono"
                  fontSize={9.5}
                  fill={isNow ? "#d6dee8" : "#3a4654"}
                >
                  {s.detail}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* explanation card */}
      <div className="card mt-2 p-4 min-h-[60px] flex items-start gap-3">
        <span
          className="mono text-xs font-bold shrink-0"
          style={{ color: cur.c }}
        >
          {String(step + 1).padStart(2, "0")}/{STEPS.length}
        </span>
        <p className="text-sm text-muted">{cur.note}</p>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            setAuto(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          prev
        </button>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setAuto(false);
                setStep(i);
              }}
              aria-label={`step ${i + 1}`}
              className="h-1.5 w-5 rounded-full transition-all"
              style={{ background: i === step ? s.c : "#1e2630" }}
            />
          ))}
        </div>
        <button
          onClick={() => {
            setAuto(false);
            setStep((s) => Math.min(STEPS.length - 1, s + 1));
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          next
        </button>
        <button
          onClick={() => setAuto((a) => !a)}
          className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text ml-1"
        >
          {auto ? "❚❚ pause" : "▶ play"}
        </button>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        SYN → SYN-ACK → ACK opens the pipe; ack = peer&apos;s seq + 1. Each side tracks its own state machine.
      </p>
    </div>
  );
}

function StateCard({ side, state }: { side: string; state: string }) {
  const c = ST_COLORS[state] ?? "#8a97a8";
  return (
    <div
      className="rounded-lg p-3 text-center transition-all"
      style={{
        background: `${c}1a`,
        border: `1px solid ${c}`,
        boxShadow: `0 0 20px -8px ${c}`,
      }}
    >
      <div className="mono text-[10px] uppercase tracking-widest text-faint">
        {side}
      </div>
      <div className="mono text-sm font-bold mt-1" style={{ color: c }}>
        {state}
      </div>
    </div>
  );
}