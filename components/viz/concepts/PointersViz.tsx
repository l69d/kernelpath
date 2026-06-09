"use client";

import { useMemo, useState } from "react";

/* ================================================================== *
 *  t1-04 — Pointers: The Heart of C
 *  Memory boxes at addresses; pointer variables hold an address and
 *  draw an arrow to their target. Click a variable to chase the chain
 *  ( p -> *p -> **p ) and see the address-vs-value distinction.
 * ================================================================== */

type Cell = {
  name: string;
  decl: string;
  addr: number;
  value: number; // a literal value, OR an address it points to
  isPointer: boolean;
  color: string;
};

const HEX = (n: number) => "0x" + n.toString(16).padStart(4, "0").toUpperCase();

// Toy stack. Pointers store the address of their target.
const A_X = 0x1000;
const A_Y = 0x1008;
const A_P = 0x1010;
const A_PP = 0x1018;

const CELLS: Cell[] = [
  { name: "x", decl: "int x = 42", addr: A_X, value: 42, isPointer: false, color: "#39c5e0" },
  { name: "y", decl: "int y = 7", addr: A_Y, value: 7, isPointer: false, color: "#e3a93c" },
  { name: "p", decl: "int *p = &x", addr: A_P, value: A_X, isPointer: true, color: "#3fb950" },
  { name: "pp", decl: "int **pp = &p", addr: A_PP, value: A_P, isPointer: true, color: "#bc8cff" },
];

const byAddr = (addr: number): Cell | undefined => CELLS.find((c) => c.addr === addr);

export default function PointersViz() {
  const [sel, setSel] = useState<string>("p");

  const selected = useMemo(() => CELLS.find((c) => c.name === sel)!, [sel]);

  // Dereference chain: follow value -> cell-at-that-address until non-pointer.
  const chain = useMemo(() => {
    const path: Cell[] = [selected];
    let cur: Cell | undefined = selected;
    const seen = new Set<number>([selected.addr]);
    while (cur && cur.isPointer) {
      const next = byAddr(cur.value);
      if (!next || seen.has(next.addr)) break;
      seen.add(next.addr);
      path.push(next);
      cur = next;
    }
    return path;
  }, [selected]);

  const highlighted = new Set(chain.map((c) => c.addr));
  const finalCell = chain[chain.length - 1];

  // Geometry: one row per cell, vertically stacked.
  const ROW_H = 64;
  const BOX_X = 250;
  const BOX_W = 250;
  const SVG_W = 640;
  const SVG_H = CELLS.length * ROW_H + 24;
  const rowY = (i: number) => 12 + i * ROW_H + ROW_H / 2;
  const idxOf = (addr: number) => CELLS.findIndex((c) => c.addr === addr);

  const stars = "*".repeat(chain.length - 1);
  const accessExpr = `${stars}${selected.name}`;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* Variable selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
          {CELLS.map((c) => (
            <button
              key={c.name}
              onClick={() => setSel(c.name)}
              className="grid place-items-center rounded-lg px-3 py-2 transition-all"
              style={{
                background: c.name === sel ? c.color : "#10151d",
                border: `1px solid ${c.name === sel ? c.color : "#1e2630"}`,
                color: c.name === sel ? "#06121a" : "#8a97a8",
                boxShadow: c.name === sel ? `0 0 22px -6px ${c.color}` : undefined,
              }}
            >
              <span className="mono text-[11px] font-bold">{c.decl}</span>
            </button>
          ))}
        </div>

        {/* Memory diagram */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full mt-3"
          style={{ maxHeight: 320 }}
        >
          <defs>
            <marker
              id="ptr-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="#56d364" />
            </marker>
          </defs>

          {/* Arrows: each pointer draws to the cell it addresses */}
          {CELLS.map((c, i) => {
            if (!c.isPointer) return null;
            const target = byAddr(c.value);
            if (!target) return null;
            const ti = idxOf(target.addr);
            const active = highlighted.has(c.addr) && highlighted.has(target.addr);
            const y1 = rowY(i);
            const y2 = rowY(ti);
            const startX = BOX_X - 4;
            const bend = BOX_X - 60 - Math.abs(i - ti) * 26;
            return (
              <path
                key={`arr-${c.name}`}
                d={`M ${startX} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${startX} ${y2}`}
                fill="none"
                stroke={active ? "#56d364" : "#2b3a49"}
                strokeWidth={active ? 2.2 : 1.4}
                markerEnd="url(#ptr-arrow)"
                strokeDasharray={active ? undefined : "4 4"}
                opacity={active ? 1 : 0.6}
              />
            );
          })}

          {/* Memory cells */}
          {CELLS.map((c, i) => {
            const y = 12 + i * ROW_H + 8;
            const lit = highlighted.has(c.addr);
            const isFinal = c.addr === finalCell.addr && chain.length > 1;
            const showVal = c.isPointer ? HEX(c.value) : String(c.value);
            return (
              <g key={c.name} onClick={() => setSel(c.name)} style={{ cursor: "pointer" }}>
                {/* address label, to the right */}
                <text
                  x={BOX_X + BOX_W + 14}
                  y={rowY(i) + 4}
                  className="mono"
                  fontSize="11"
                  fill={lit ? c.color : "#5b6b7d"}
                >
                  {HEX(c.addr)}
                </text>

                {/* the box */}
                <rect
                  x={BOX_X}
                  y={y}
                  width={BOX_W}
                  height={ROW_H - 16}
                  rx="7"
                  fill={lit ? `${c.color}1f` : "#10151d"}
                  stroke={lit ? c.color : "#1e2630"}
                  strokeWidth={isFinal ? 2.4 : 1.4}
                  style={{ filter: isFinal ? `drop-shadow(0 0 10px ${c.color})` : undefined }}
                />
                {/* variable name */}
                <text
                  x={BOX_X + 14}
                  y={rowY(i) - 4}
                  className="mono"
                  fontSize="13"
                  fontWeight="700"
                  fill={lit ? c.color : "#8a97a8"}
                >
                  {c.name}
                </text>
                <text
                  x={BOX_X + 14}
                  y={rowY(i) + 13}
                  className="mono"
                  fontSize="9"
                  fill="#5b6b7d"
                >
                  {c.isPointer ? "pointer" : "int"}
                </text>
                {/* stored value / address */}
                <text
                  x={BOX_X + BOX_W - 14}
                  y={rowY(i) + 5}
                  textAnchor="end"
                  className="mono"
                  fontSize="15"
                  fontWeight="700"
                  fill={lit ? (c.isPointer ? "#56d364" : c.color) : "#8a97a8"}
                >
                  {showVal}
                </text>
              </g>
            );
          })}

          {/* column captions */}
          <text x={BOX_X + 6} y={8} className="mono" fontSize="9" fill="#5b6b7d">
            variable
          </text>
          <text
            x={BOX_X + BOX_W - 6}
            y={8}
            textAnchor="end"
            className="mono"
            fontSize="9"
            fill="#5b6b7d"
          >
            stored bits
          </text>
          <text x={BOX_X + BOX_W + 14} y={8} className="mono" fontSize="9" fill="#5b6b7d">
            address
          </text>
        </svg>
      </div>

      {/* Readout: what the chosen access evaluates to */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Read
          label={`&${selected.name} — its address`}
          big={HEX(selected.addr)}
          sub="where this variable lives"
          color={selected.color}
        />
        <Read
          label={`${accessExpr} — dereference`}
          big={finalCell.isPointer ? HEX(finalCell.value) : String(finalCell.value)}
          sub={
            chain.length === 1
              ? "no stars: just the value"
              : `follow ${chain.length - 1} arrow${chain.length - 1 > 1 ? "s" : ""} to ${finalCell.name}`
          }
          color={finalCell.color}
        />
        <Read
          label="chain"
          big={chain.map((c) => c.name).join(" → ")}
          sub={chain.map((c) => (c.isPointer ? HEX(c.value) : c.value)).join("  →  ")}
          color="#56d364"
        />
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Click a variable. A pointer just stores another box&apos;s{" "}
        <span className="text-cyan">address</span>; each{" "}
        <span className="text-green">*</span> follows one arrow.{" "}
        <span className="text-purple">**pp</span> walks two hops to reach{" "}
        <span className="text-cyan">x = 42</span>.
      </p>
    </div>
  );
}

function Read({
  label,
  big,
  sub,
  color,
}: {
  label: string;
  big: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="card py-2 px-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint truncate">
        {label}
      </div>
      <div className="mono text-base font-bold mt-1" style={{ color }}>
        {big}
      </div>
      <div className="mono text-[10px] text-muted mt-0.5">{sub}</div>
    </div>
  );
}
