"use client";

import { useEffect, useState } from "react";

/* ---------------- cs9-01 Packet encapsulation ---------------- */

type Layer = {
  name: string;
  hdr: string;
  pdu: string;
  c: string;
  note: string;
};

// Top (Application) -> bottom (Link). Headers are added top-to-bottom.
const LAYERS: Layer[] = [
  { name: "Application", hdr: "HTTP", pdu: "Message", c: "#bc8cff", note: "Your data — an HTTP request, an email, a chat line." },
  { name: "Transport", hdr: "TCP", pdu: "Segment", c: "#39c5e0", note: "TCP header adds ports + sequence numbers for reliable, ordered delivery." },
  { name: "Network", hdr: "IP", pdu: "Packet", c: "#3fb950", note: "IP header adds source + destination addresses to route across networks." },
  { name: "Link", hdr: "Eth", pdu: "Frame", c: "#e3a93c", note: "Ethernet adds MAC addresses + a trailer (FCS) for the local hop." },
];

const PAYLOAD = "DATA";

// 9 phases: 0 = top of stack (send), 1..4 wrap each layer, 4 = on the wire,
// 5..8 unwrap each layer on the receiver, 8 = delivered.
const TOTAL = 9;

function phaseDepth(p: number): number {
  // how many headers are currently wrapped around the payload
  if (p <= 4) return p; // send: 0..4 headers added
  return 4 - (p - 4); // receive: peel back to 0
}

const SIDE_HEX = "#1e2630";

export default function EncapsulationViz() {
  const [phase, setPhase] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setPhase((p) => (p + 1) % TOTAL), 1100);
    return () => clearInterval(t);
  }, [auto]);

  const depth = phaseDepth(phase);
  const sending = phase < 4;
  const onWire = phase === 4;
  const receiving = phase > 4;

  // which layer is being acted on this phase (added when sending, removed when receiving)
  const activeLayer =
    phase >= 1 && phase <= 4 ? 4 - phase : phase >= 5 && phase <= 8 ? phase - 5 : -1;

  // Visible wrapping headers, innermost (Application) to outermost (Link).
  // depth headers means LAYERS[3] (Link) outermost down to LAYERS[4-depth].
  const wraps: Layer[] = [];
  for (let i = 4 - depth; i < 4; i++) wraps.push(LAYERS[i]);

  const status = onWire
    ? "On the wire — a stream of bits crosses the physical medium."
    : sending
    ? activeLayer === -1
      ? "Sender hands the raw message to the stack."
      : `Wrapping: ${LAYERS[activeLayer].name} adds its ${LAYERS[activeLayer].hdr} header → ${LAYERS[activeLayer].pdu}.`
    : phase === 8
    ? "Delivered — the receiving app gets the exact original message."
    : `Unwrapping: ${LAYERS[activeLayer].name} reads & strips its ${LAYERS[activeLayer].hdr} header.`;

  const statusColor = onWire ? "#58a6ff" : activeLayer === -1 ? "#8a97a8" : LAYERS[activeLayer].c;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="py-2">
          {/* Stack legend: which layer is active */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {LAYERS.map((l, i) => {
              const wrapped = i >= 4 - depth;
              const isActive = i === activeLayer;
              return (
                <button
                  key={l.name}
                  onClick={() => {
                    setAuto(false);
                    // jump to the wrap-phase for this layer
                    setPhase(4 - i);
                  }}
                  className="rounded-lg px-2 py-2 text-center transition-all"
                  style={{
                    background: isActive ? l.c : wrapped ? `${l.c}1f` : "#10151d",
                    border: `1px solid ${isActive ? l.c : wrapped ? `${l.c}66` : "#1e2630"}`,
                    color: isActive ? "#06121a" : wrapped ? l.c : "#5b6b7d",
                    boxShadow: isActive ? `0 0 20px -6px ${l.c}` : undefined,
                  }}
                >
                  <div className="mono text-[11px] font-bold">{l.name}</div>
                  <div className="mono text-[9px] opacity-80">[{l.hdr}]</div>
                </button>
              );
            })}
          </div>

          {/* The nested-box visualization */}
          <svg viewBox="0 0 420 200" className="w-full" style={{ maxHeight: 240 }}>
            {/* host labels */}
            <text x="6" y="14" className="mono" fontSize="9" fill="#5b6b7d">
              {sending ? "▼ SENDER (down the stack)" : onWire ? "↔ WIRE" : "▲ RECEIVER (up the stack)"}
            </text>

            {/* wire dashes when on the wire */}
            {onWire && (
              <line
                x1="10"
                y1="105"
                x2="410"
                y2="105"
                stroke="#58a6ff"
                strokeWidth="2"
                strokeDasharray="6 5"
              >
                <animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.7s" repeatCount="indefinite" />
              </line>
            )}

            {/* nested boxes: outermost first so inner ones paint on top */}
            {wraps.map((l, idx) => {
              const total = wraps.length;
              const inset = idx; // 0 = outermost
              const boxW = 360 - inset * 56;
              const boxH = 150 - inset * 28;
              const x = (420 - boxW) / 2;
              const y = 30 + inset * 14;
              const isActive = activeLayer >= 0 && LAYERS[activeLayer].name === l.name;
              const hdrW = 38;
              return (
                <g key={l.name} opacity={onWire ? 0.55 : 1}>
                  <rect
                    x={x}
                    y={y}
                    width={boxW}
                    height={boxH}
                    rx="6"
                    fill={`${l.c}14`}
                    stroke={isActive ? l.c : `${l.c}99`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {/* header tab on the left edge */}
                  <rect x={x} y={y} width={hdrW} height={boxH} rx="6" fill={`${l.c}33`} stroke="none" />
                  <line x1={x + hdrW} y1={y} x2={x + hdrW} y2={y + boxH} stroke={`${l.c}99`} strokeWidth="1" />
                  <text
                    x={x + hdrW / 2}
                    y={y + boxH / 2}
                    fontSize="9"
                    className="mono"
                    fill={l.c}
                    textAnchor="middle"
                    transform={`rotate(-90 ${x + hdrW / 2} ${y + boxH / 2})`}
                    fontWeight={700}
                  >
                    {l.hdr}
                  </text>
                  {/* layer name on top edge */}
                  <text x={x + hdrW + 6} y={y - 3 + (idx === 0 ? 0 : 12)} fontSize="8" className="mono" fill={`${l.c}cc`}>
                    {idx === total - 1 ? "" : l.pdu}
                  </text>
                </g>
              );
            })}

            {/* the payload core */}
            <g opacity={onWire ? 0.7 : 1}>
              <rect
                x={420 / 2 - 30}
                y={100 - 16}
                width="60"
                height="32"
                rx="4"
                fill={depth === 0 ? "#bc8cff33" : "#10151d"}
                stroke={depth === 0 ? "#bc8cff" : SIDE_HEX}
                strokeWidth="1.5"
              />
              <text x="210" y="105" fontSize="11" className="mono" fill="#d6dee8" textAnchor="middle" fontWeight={700}>
                {PAYLOAD}
              </text>
            </g>

            {/* growing/shrinking byte tally */}
            <text x="414" y="194" fontSize="9" className="mono" fill="#5b6b7d" textAnchor="end">
              headers: {depth}
            </text>
          </svg>

          {/* status readout */}
          <div className="card p-3 mt-3 min-h-[58px] flex items-start gap-3">
            <span className="mono text-[10px] font-bold rounded px-2 py-0.5 shrink-0" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}66` }}>
              {phase + 1}/{TOTAL}
            </span>
            <p className="text-sm text-muted">{status}</p>
          </div>

          {/* on-wire serialized view */}
          <div className="card p-2 mt-2">
            <div className="mono text-[9px] uppercase tracking-widest text-faint mb-1 text-center">what travels on the wire</div>
            <div className="flex justify-center items-stretch gap-0.5 flex-wrap">
              {LAYERS.slice().reverse().map((l) => {
                const present = onWire; // full stack only exists on the wire
                return (
                  <span
                    key={l.name}
                    className="mono text-[10px] rounded px-2 py-1"
                    style={{
                      background: present ? `${l.c}26` : "#10151d",
                      color: present ? l.c : "#5b6b7d",
                      border: `1px solid ${present ? `${l.c}66` : "#1e2630"}`,
                      opacity: present ? 1 : 0.4,
                    }}
                  >
                    {l.hdr}
                  </span>
                );
              })}
              <span className="mono text-[10px] rounded px-2 py-1" style={{ background: "#bc8cff26", color: "#bc8cff", border: "1px solid #bc8cff66" }}>
                {PAYLOAD}
              </span>
              <span className="mono text-[10px] rounded px-2 py-1" style={{ background: onWire ? "#e3a93c26" : "#10151d", color: onWire ? "#e3a93c" : "#5b6b7d", border: `1px solid ${onWire ? "#e3a93c66" : "#1e2630"}`, opacity: onWire ? 1 : 0.4 }}>
                FCS
              </span>
            </div>
          </div>

          {/* controls */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => { setAuto(false); setPhase((p) => (p - 1 + TOTAL) % TOTAL); }}
              className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              prev
            </button>
            <button
              onClick={() => setAuto((a) => !a)}
              className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              {auto ? "❚❚ pause" : "▶ play"}
            </button>
            <button
              onClick={() => { setAuto(false); setPhase((p) => (p + 1) % TOTAL); }}
              className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              next
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Each layer wraps the payload in its own header going down, then the peer layer strips it going up — a layer never reads another&apos;s header.
      </p>
    </div>
  );
}