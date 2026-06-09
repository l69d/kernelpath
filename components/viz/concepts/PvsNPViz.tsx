"use client";

import { useEffect, useMemo, useState } from "react";

/* cs5-07 — Time Complexity: P and NP
 * Nested complexity classes as an Euler diagram. Hover a region for examples;
 * toggle "P = NP?" to collapse P and NP-complete down into P. */

type RegionKey = "P" | "NPC" | "NP" | "NPH";

type Region = {
  key: RegionKey;
  name: string;
  color: string;
  blurb: string;
  examples: string[];
};

const REGIONS: Record<RegionKey, Region> = {
  P: {
    key: "P",
    name: "P",
    color: "#3fb950",
    blurb: "Solvable in polynomial time. A fast algorithm exists.",
    examples: ["Sorting (merge sort)", "Shortest path (Dijkstra)", "Primality (AKS)"],
  },
  NPC: {
    key: "NPC",
    name: "NP-complete",
    color: "#e3a93c",
    blurb: "In NP and at least as hard as every NP problem. The hardest problems still in NP.",
    examples: ["SAT (Cook–Levin)", "Travelling Salesman (decision)", "Graph colouring"],
  },
  NP: {
    key: "NP",
    name: "NP",
    color: "#39c5e0",
    blurb: "A claimed YES answer can be verified in polynomial time, even if finding it is slow.",
    examples: ["Sudoku check", "Subset sum", "Hamiltonian cycle"],
  },
  NPH: {
    key: "NPH",
    name: "NP-hard",
    color: "#f85149",
    blurb: "At least as hard as NP — but need not be in NP. Some aren't even decidable.",
    examples: ["Halting problem", "TSP (optimization)", "Go on an n×n board"],
  },
};

const ORDER: RegionKey[] = ["P", "NPC", "NP", "NPH"];

export default function PvsNPViz() {
  const [hover, setHover] = useState<RegionKey>("NPC");
  const [collapsed, setCollapsed] = useState(false);
  const [pulse, setPulse] = useState(0);

  // subtle ambient glow on the active region
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 60), 50);
    return () => clearInterval(t);
  }, []);

  const glow = useMemo(() => 0.5 + 0.5 * Math.sin((pulse / 60) * Math.PI * 2), [pulse]);

  // When collapsed (P = NP), P swells to fill NP and NP-complete vanishes into P.
  const active = REGIONS[hover];
  const npR = collapsed ? 118 : 118;
  const pR = collapsed ? 116 : 60;
  const npcVisible = !collapsed;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col md:flex-row items-center gap-6 py-2">
          {/* diagram */}
          <svg
            viewBox="0 0 280 280"
            className="w-full shrink-0"
            style={{ maxHeight: 280, maxWidth: 280 }}
            role="img"
            aria-label="Euler diagram of P, NP, NP-complete and NP-hard"
          >
            {/* NP-hard halo: a band reaching beyond NP */}
            <circle
              cx={140}
              cy={150}
              r={collapsed ? 150 : 134}
              fill={hover === "NPH" ? `${REGIONS.NPH.color}14` : "transparent"}
              stroke={REGIONS.NPH.color}
              strokeWidth={hover === "NPH" ? 2.4 : 1.4}
              strokeDasharray="5 4"
              style={{
                cursor: "pointer",
                filter: hover === "NPH" ? `drop-shadow(0 0 ${6 + glow * 8}px ${REGIONS.NPH.color})` : "none",
                transition: "r 0.5s ease, stroke-width 0.2s",
              }}
              onMouseEnter={() => setHover("NPH")}
            />
            <text x={140} y={32} textAnchor="middle" className="mono"
              fill={hover === "NPH" ? REGIONS.NPH.color : "#5b6b7d"}
              style={{ fontSize: 11, fontWeight: 700 }}>
              NP-hard
            </text>

            {/* NP region */}
            <circle
              cx={140}
              cy={150}
              r={npR}
              fill={hover === "NP" ? `${REGIONS.NP.color}1f` : `${REGIONS.NP.color}10`}
              stroke={REGIONS.NP.color}
              strokeWidth={hover === "NP" ? 2.6 : 1.6}
              style={{
                cursor: "pointer",
                filter: hover === "NP" ? `drop-shadow(0 0 ${6 + glow * 8}px ${REGIONS.NP.color})` : "none",
                transition: "r 0.5s ease, stroke-width 0.2s",
              }}
              onMouseEnter={() => setHover("NP")}
            />
            {!collapsed && (
              <text x={140} y={62} textAnchor="middle" className="mono"
                fill={hover === "NP" ? REGIONS.NP.color : "#8a97a8"}
                style={{ fontSize: 12, fontWeight: 700 }}>
                NP
              </text>
            )}

            {/* P region (grows to fill NP when collapsed) */}
            <circle
              cx={140}
              cy={collapsed ? 150 : 180}
              r={pR}
              fill={hover === "P" ? `${REGIONS.P.color}33` : `${REGIONS.P.color}1f`}
              stroke={REGIONS.P.color}
              strokeWidth={hover === "P" ? 2.6 : 1.8}
              style={{
                cursor: "pointer",
                filter: hover === "P" ? `drop-shadow(0 0 ${6 + glow * 8}px ${REGIONS.P.color})` : "none",
                transition: "r 0.5s ease, cy 0.5s ease, stroke-width 0.2s",
              }}
              onMouseEnter={() => setHover("P")}
            />
            <text x={140} y={collapsed ? 154 : 184} textAnchor="middle" className="mono"
              fill={REGIONS.P.color}
              style={{ fontSize: 13, fontWeight: 700 }}>
              P
            </text>

            {/* NP-complete: a node sitting ON the outer boundary of NP */}
            {npcVisible && (
              <g
                style={{
                  cursor: "pointer",
                  transition: "opacity 0.4s ease",
                  opacity: collapsed ? 0 : 1,
                }}
                onMouseEnter={() => setHover("NPC")}
              >
                <circle
                  cx={140}
                  cy={92}
                  r={hover === "NPC" ? 22 : 19}
                  fill={`${REGIONS.NPC.color}26`}
                  stroke={REGIONS.NPC.color}
                  strokeWidth={hover === "NPC" ? 2.6 : 1.8}
                  style={{
                    filter: hover === "NPC" ? `drop-shadow(0 0 ${6 + glow * 8}px ${REGIONS.NPC.color})` : "none",
                    transition: "r 0.2s",
                  }}
                />
                <text x={140} y={96} textAnchor="middle" className="mono"
                  fill={REGIONS.NPC.color} style={{ fontSize: 10, fontWeight: 700 }}>
                  NPC
                </text>
              </g>
            )}
          </svg>

          {/* readout + controls */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ORDER.map((k) => (
                <button
                  key={k}
                  onMouseEnter={() => setHover(k)}
                  onFocus={() => setHover(k)}
                  className="mono text-[11px] rounded px-2.5 py-1 transition-all"
                  style={{
                    background: hover === k ? REGIONS[k].color : "#10151d",
                    color: hover === k ? "#06121a" : "#8a97a8",
                    border: `1px solid ${hover === k ? REGIONS[k].color : "#1e2630"}`,
                    fontWeight: 700,
                  }}
                >
                  {REGIONS[k].name}
                </button>
              ))}
            </div>

            <div className="card p-4 min-h-[150px]">
              <div className="mono text-sm font-bold" style={{ color: active.color }}>
                {active.name}
              </div>
              <p className="text-sm text-muted mt-1.5">{active.blurb}</p>
              <div className="mono text-[10px] uppercase tracking-widest text-faint mt-3 mb-1.5">
                examples
              </div>
              <div className="flex flex-wrap gap-1.5">
                {active.examples.map((ex) => (
                  <span
                    key={ex}
                    className="mono text-[11px] rounded px-2 py-0.5"
                    style={{
                      background: `${active.color}1a`,
                      color: active.color,
                      border: `1px solid ${active.color}44`,
                    }}
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCollapsed((c) => !c)}
              className="mono text-xs rounded px-3 py-2 mt-3 w-full transition-all"
              style={{
                background: collapsed ? `${REGIONS.P.color}1f` : "#10151d",
                color: collapsed ? REGIONS.P.color : "#8a97a8",
                border: `1px solid ${collapsed ? REGIONS.P.color : "#1e2630"}`,
                fontWeight: 700,
              }}
            >
              {collapsed ? "◀ restore: P ≠ NP (what we believe)" : "what if  P = NP ?  ▶"}
            </button>

            <p className="text-xs text-muted mt-2 leading-relaxed">
              {collapsed ? (
                <>
                  If <b className="text-green">P = NP</b>, every problem we can
                  quickly <i>check</i> we could also quickly <i>solve</i>. The
                  NP-complete boundary collapses inward — SAT, TSP and friends
                  fall into <b className="text-green">P</b>. Most theorists bet
                  this is <i>false</i>, but no one has proved it.
                </>
              ) : (
                <>
                  <b className="text-green">P</b> sits inside{" "}
                  <b className="text-cyan">NP</b>. The{" "}
                  <b style={{ color: REGIONS.NPC.color }}>NP-complete</b> problems
                  hug NP&apos;s outer rim, while{" "}
                  <b className="text-red">NP-hard</b> reaches beyond NP entirely.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-faint mono text-center">
        Hover a region for examples. Toggle the button to collapse the picture into the P = NP world.
      </p>
    </div>
  );
}