"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs10-07 — The CAP Theorem & Tradeoffs
 *  A triangle of Consistency / Availability / Partition-tolerance.
 *  Toggle a network partition, then pick CP or AP and watch the
 *  consequence land on each replica.
 * ================================================================== */

type Choice = "CP" | "AP";

interface ReplicaState {
  value: string;
  serving: boolean;
  note: string;
  color: string;
}

const C = {
  green: "#3fb950",
  greenBright: "#56d364",
  cyan: "#39c5e0",
  blue: "#58a6ff",
  amber: "#e3a93c",
  purple: "#bc8cff",
  red: "#f85149",
  border: "#1e2630",
  surface: "#10151d",
  ink: "#06121a",
};

const VERTICES = [
  {
    k: "C",
    name: "Consistency",
    x: 150,
    y: 30,
    c: C.cyan,
    desc: "Every read sees the most recent write — all replicas agree.",
  },
  {
    k: "A",
    name: "Availability",
    x: 30,
    y: 200,
    c: C.amber,
    desc: "Every request gets a (non-error) response, even mid-failure.",
  },
  {
    k: "P",
    name: "Partition tolerance",
    x: 270,
    y: 200,
    c: C.purple,
    desc: "The system keeps working when the network drops messages between nodes.",
  },
] as const;

export default function CapTheoremViz() {
  const [partition, setPartition] = useState(false);
  const [choice, setChoice] = useState<Choice>("CP");
  const [pulse, setPulse] = useState(0);

  // animate the broken link when a partition is active
  useEffect(() => {
    if (!partition) {
      setPulse(0);
      return;
    }
    const t = setInterval(() => setPulse((p) => (p + 1) % 100), 60);
    return () => clearInterval(t);
  }, [partition]);

  // Which two corners are "kept". Without a partition you keep all three.
  const kept = useMemo<Set<string>>(() => {
    if (!partition) return new Set(["C", "A", "P"]);
    return choice === "CP" ? new Set(["C", "P"]) : new Set(["A", "P"]);
  }, [partition, choice]);

  // The client wrote X=42 to replica A. Replica B is across the partition.
  const replicas = useMemo<[ReplicaState, ReplicaState]>(() => {
    if (!partition) {
      return [
        { value: "42", serving: true, note: "write replicated", color: C.green },
        { value: "42", serving: true, note: "in sync", color: C.green },
      ];
    }
    if (choice === "CP") {
      return [
        {
          value: "42",
          serving: false,
          note: "rejects write — can't confirm B agrees",
          color: C.red,
        },
        {
          value: "—",
          serving: false,
          note: "unreachable, refuses to answer",
          color: C.red,
        },
      ];
    }
    // AP
    return [
      { value: "42", serving: true, note: "accepts write locally", color: C.amber },
      {
        value: "7",
        serving: true,
        note: "serves STALE old value",
        color: C.amber,
      },
    ];
  }, [partition, choice]);

  const dash = partition ? `${(pulse % 20) - 10}` : "0";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-6 py-1">
          {/* ---- Triangle ---- */}
          <div className="shrink-0 mx-auto md:mx-0">
            <svg viewBox="0 0 300 240" className="w-full" style={{ maxHeight: 230, width: 300 }}>
              {/* edges */}
              {[
                [0, 1],
                [1, 2],
                [2, 0],
              ].map(([a, b], i) => {
                const va = VERTICES[a];
                const vb = VERTICES[b];
                const bothKept = kept.has(va.k) && kept.has(vb.k);
                return (
                  <line
                    key={i}
                    x1={va.x}
                    y1={va.y}
                    x2={vb.x}
                    y2={vb.y}
                    stroke={bothKept ? C.green : C.border}
                    strokeWidth={bothKept ? 2 : 1.5}
                    strokeOpacity={bothKept ? 0.9 : 0.5}
                    strokeDasharray={bothKept ? "0" : "4 4"}
                  />
                );
              })}
              {/* "pick 2" sash across the dropped corner */}
              {partition && (
                <text
                  x="150"
                  y="148"
                  textAnchor="middle"
                  className="mono"
                  fill={C.greenBright}
                  fontSize="11"
                  fontWeight="700"
                >
                  pick 2 → {choice}
                </text>
              )}
              {/* vertices */}
              {VERTICES.map((v) => {
                const on = kept.has(v.k);
                return (
                  <g key={v.k}>
                    <circle
                      cx={v.x}
                      cy={v.y}
                      r={on ? 22 : 18}
                      fill={on ? v.c : C.surface}
                      stroke={on ? v.c : C.border}
                      strokeWidth={2}
                      opacity={on ? 1 : 0.45}
                    />
                    <text
                      x={v.x}
                      y={v.y + 5}
                      textAnchor="middle"
                      className="mono"
                      fill={on ? C.ink : "#5b6b7d"}
                      fontSize="15"
                      fontWeight="700"
                    >
                      {v.k}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ---- Controls + replicas ---- */}
          <div className="flex-1 space-y-3">
            {/* partition toggle */}
            <button
              onClick={() => setPartition((p) => !p)}
              className="w-full text-left rounded-lg p-3 transition-all"
              style={{
                background: partition ? `${C.red}1a` : C.surface,
                border: `1px solid ${partition ? C.red : C.border}`,
                boxShadow: partition ? `0 0 20px -8px ${C.red}` : undefined,
              }}
            >
              <div className="mono text-[11px] font-bold" style={{ color: partition ? C.red : "#8a97a8" }}>
                {partition ? "⚡ NETWORK PARTITION — replicas can't talk" : "network healthy — click to cut the link"}
              </div>
            </button>

            {/* CP / AP choice */}
            <div className="grid grid-cols-2 gap-2">
              {(["CP", "AP"] as Choice[]).map((opt) => {
                const sel = choice === opt;
                const col = opt === "CP" ? C.cyan : C.amber;
                return (
                  <button
                    key={opt}
                    onClick={() => setChoice(opt)}
                    disabled={!partition}
                    className="rounded-lg px-3 py-2 transition-all"
                    style={{
                      background: sel && partition ? col : C.surface,
                      border: `1px solid ${sel && partition ? col : C.border}`,
                      color: sel && partition ? C.ink : "#8a97a8",
                      opacity: partition ? 1 : 0.4,
                      cursor: partition ? "pointer" : "not-allowed",
                    }}
                  >
                    <div className="mono text-xs font-bold">{opt}</div>
                    <div className="mono text-[10px] mt-0.5">
                      {opt === "CP" ? "stay consistent" : "stay available"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* replica cards */}
            <div className="grid grid-cols-2 gap-2">
              {replicas.map((rep, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 transition-all"
                  style={{
                    background: C.surface,
                    border: `1px solid ${rep.color}`,
                    boxShadow: `0 0 16px -10px ${rep.color}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-[10px] uppercase tracking-widest text-faint">
                      replica {i === 0 ? "A" : "B"}
                    </span>
                    <span
                      className="mono text-[9px] rounded px-1.5 py-0.5"
                      style={{
                        background: `${rep.color}22`,
                        color: rep.color,
                        border: `1px solid ${rep.color}55`,
                      }}
                    >
                      {rep.serving ? "serving" : "blocked"}
                    </span>
                  </div>
                  <div className="mono text-lg font-bold mt-1" style={{ color: rep.color }}>
                    x = {rep.value}
                  </div>
                  <div className="mono text-[10px] text-muted mt-1 leading-snug">{rep.note}</div>
                </div>
              ))}
            </div>

            {/* link between replicas */}
            <svg viewBox="0 0 300 14" className="w-full" style={{ maxHeight: 14 }}>
              <line
                x1="20"
                y1="7"
                x2="280"
                y2="7"
                stroke={partition ? C.red : C.green}
                strokeWidth="2"
                strokeDasharray={partition ? "6 6" : "0"}
                strokeDashoffset={dash}
                opacity={partition ? 0.85 : 0.7}
              />
              {partition && (
                <text x="150" y="5" textAnchor="middle" className="mono" fill={C.red} fontSize="9">
                  ✂ messages lost
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* verdict line */}
        <div
          className="card mt-1 p-3"
          style={{ borderColor: partition ? (choice === "CP" ? C.cyan : C.amber) : C.green }}
        >
          <p className="text-sm text-muted">
            {!partition ? (
              <>
                With a healthy network you appear to get all three — <b className="text-cyan">C</b>,{" "}
                <b className="text-amber">A</b> and <b className="text-purple">P</b>. The trap is that{" "}
                <b className="text-text">partitions are inevitable</b> in any real distributed system.
              </>
            ) : choice === "CP" ? (
              <>
                You chose <b className="text-cyan">CP</b>: drop <b className="text-amber">availability</b>. The
                cluster refuses writes (and stale reads) so no client ever sees disagreeing data — correctness over
                uptime. Think bank ledgers, etcd, ZooKeeper.
              </>
            ) : (
              <>
                You chose <b className="text-amber">AP</b>: drop <b className="text-cyan">consistency</b>. Both sides
                keep answering, so replica B hands out a <b className="text-text">stale value</b> until the link heals
                and they reconcile — uptime over freshness. Think DNS, Cassandra, shopping carts.
              </>
            )}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Toggle the partition, then pick CP or AP. Under a partition you can only keep <b>two</b> of the three.
      </p>
    </div>
  );
}