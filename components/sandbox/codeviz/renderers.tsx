"use client";

import type {
  ArrayState,
  GraphState,
  GridState,
  NodeState,
  RenderKind,
  StackState,
  TableState,
  TreeState,
  VizState,
} from "./types";

const C = {
  bg: "#07090d",
  surface: "#10151d",
  border: "#1e2630",
  faint: "#5b6b7d",
  muted: "#8a97a8",
  text: "#d6dee8",
  green: "#3fb950",
  cyan: "#39c5e0",
  amber: "#e3a93c",
  purple: "#bc8cff",
  red: "#f85149",
};

function nodeFill(state?: NodeState): { fill: string; stroke: string; text: string } {
  switch (state) {
    case "current":
      return { fill: C.amber, stroke: C.amber, text: "#06121a" };
    case "frontier":
      return { fill: "rgba(57,197,224,0.18)", stroke: C.cyan, text: C.cyan };
    case "visited":
      return { fill: "rgba(63,185,80,0.18)", stroke: C.green, text: C.green };
    case "path":
      return { fill: C.purple, stroke: C.purple, text: "#06121a" };
    default:
      return { fill: C.surface, stroke: "#2b3a49", text: C.muted };
  }
}

/* ============================ CODE PANEL ========================== */
export function CodePanel({
  code,
  active,
}: {
  code: string[];
  active: number[];
}) {
  const set = new Set(active);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.red }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.amber }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.green }} />
        <span className="ml-2 mono text-[10px] uppercase tracking-widest text-faint">
          source
        </span>
      </div>
      <pre className="mono text-[12.5px] leading-[1.6] overflow-x-auto p-0 m-0">
        {code.map((ln, i) => {
          const on = set.has(i);
          return (
            <div
              key={i}
              className="flex"
              style={{
                background: on ? "rgba(227,169,60,0.13)" : "transparent",
                borderLeft: `2px solid ${on ? C.amber : "transparent"}`,
              }}
            >
              <span
                className="select-none px-2 text-right"
                style={{ color: on ? C.amber : "#3a4654", minWidth: 34 }}
              >
                {i + 1}
              </span>
              <code
                className="pr-4 whitespace-pre"
                style={{ color: on ? C.text : "#aeb9c7" }}
              >
                {ln.length ? ln : " "}
              </code>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/* ============================== ARRAY ============================= */
function ArrayViz({ state }: { state: ArrayState }) {
  const { array, active = [], pointers = [], done = [], marks = {}, window } = state;
  const max = Math.max(1, ...array.map((v) => Math.abs(v)));
  const activeSet = new Set(active);
  const doneSet = new Set(done);

  // group pointers by index so multiple share a column
  const byIndex: Record<number, typeof pointers> = {};
  pointers.forEach((p) => {
    if (p.index < 0) return;
    (byIndex[p.index] ??= []).push(p);
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end justify-center gap-1.5 h-56 min-w-max px-2">
        {array.map((v, i) => {
          const inWindow = window && i >= window[0] && i <= window[1];
          let color = C.cyan;
          if (doneSet.has(i)) color = C.green;
          if (activeSet.has(i)) color = C.amber;
          if (marks[i]) color = marks[i];
          const h = 14 + (Math.abs(v) / max) * 78;
          return (
            <div key={i} className="flex flex-col items-center" style={{ minWidth: 26 }}>
              <div
                className="w-full rounded-t flex items-end justify-center pb-1"
                style={{
                  height: `${h}%`,
                  background: color,
                  opacity: inWindow || !window ? 1 : 0.32,
                  boxShadow: activeSet.has(i) ? `0 0 12px -2px ${color}` : undefined,
                  transition: "height 120ms ease, background 120ms ease",
                }}
              >
                <span className="mono text-[10px] font-bold" style={{ color: "#06121a" }}>
                  {v}
                </span>
              </div>
              <span className="mono text-[9px] mt-1" style={{ color: C.faint }}>
                {i}
              </span>
            </div>
          );
        })}
      </div>
      {/* pointers row */}
      {pointers.length > 0 && (
        <div className="flex justify-center gap-1.5 min-w-max px-2 mt-1">
          {array.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5" style={{ minWidth: 26 }}>
              {(byIndex[i] ?? []).map((p) => (
                <span
                  key={p.name}
                  className="mono text-[9px] font-bold leading-none rounded px-1 py-0.5"
                  style={{
                    color: "#06121a",
                    background: p.color ?? C.cyan,
                  }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== GRAPH ============================= */
function GraphViz({ state }: { state: GraphState }) {
  const { nodes, edges } = state;
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => (pos[n.id] = { x: n.x, y: n.y }));
  return (
    <svg viewBox="0 0 100 62" className="w-full" style={{ maxHeight: 340 }}>
      <defs>
        <marker id="cv-arrow" markerWidth="6" markerHeight="6" refX="5.4" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.faint} />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = pos[e.from];
        const b = pos[e.to];
        if (!a || !b) return null;
        const stroke =
          e.state === "path"
            ? C.purple
            : e.state === "tree"
              ? C.green
              : e.state === "considered"
                ? C.amber
                : "#2b3a49";
        const w = e.state === "idle" || !e.state ? 0.5 : 0.9;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={i}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={w}
              markerEnd={e.directed ? "url(#cv-arrow)" : undefined}
            />
            {e.weight !== undefined && (
              <text
                x={mx}
                y={my - 0.8}
                fontSize={2.8}
                textAnchor="middle"
                fill={C.muted}
                className="mono"
              >
                {e.weight}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const c = nodeFill(n.state);
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={4.2} fill={c.fill} stroke={c.stroke} strokeWidth={0.7} />
            <text
              x={n.x}
              y={n.y + 1.3}
              fontSize={3.6}
              textAnchor="middle"
              fill={c.text}
              className="mono"
              fontWeight="bold"
            >
              {n.label ?? n.id}
            </text>
            {n.badge !== undefined && n.badge !== "" && (
              <text
                x={n.x + 5}
                y={n.y - 3.4}
                fontSize={2.8}
                textAnchor="middle"
                fill={C.cyan}
                className="mono"
              >
                {n.badge}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ============================== TREE ============================== */
function TreeViz({ state }: { state: TreeState }) {
  const { nodes, edges } = state;
  const pos: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n) => (pos[n.id] = { x: n.x, y: n.y }));
  return (
    <svg viewBox="0 0 100 62" className="w-full" style={{ maxHeight: 340 }}>
      {edges.map((e, i) => {
        const a = pos[e.from];
        const b = pos[e.to];
        if (!a || !b) return null;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2b3a49" strokeWidth={0.6} />;
      })}
      {nodes.map((n) => {
        const c = nodeFill(n.state);
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={4.4} fill={c.fill} stroke={c.stroke} strokeWidth={0.7} />
            <text
              x={n.x}
              y={n.y + 1.3}
              fontSize={3.6}
              textAnchor="middle"
              fill={c.text}
              className="mono"
              fontWeight="bold"
            >
              {n.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================== TABLE ============================ */
function TableViz({ state }: { state: TableState }) {
  const { cells, rowLabels, colLabels, active = [], reads = [], filled = [], result, caption } = state;
  const key = (r: number, c: number) => `${r},${c}`;
  const activeSet = new Set(active.map(([r, c]) => key(r, c)));
  const readSet = new Set(reads.map(([r, c]) => key(r, c)));
  const filledSet = new Set(filled.map(([r, c]) => key(r, c)));
  const resKey = result ? key(result[0], result[1]) : null;
  return (
    <div className="overflow-auto">
      <table className="border-collapse mx-auto mono text-[11px]">
        {colLabels && (
          <thead>
            <tr>
              <th className="p-1" />
              {colLabels.map((cl, c) => (
                <th key={c} className="p-1 text-center" style={{ color: C.faint }}>
                  {cl}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {cells.map((row, r) => (
            <tr key={r}>
              {rowLabels && (
                <th className="p-1 text-right pr-2" style={{ color: C.faint }}>
                  {rowLabels[r]}
                </th>
              )}
              {row.map((val, c) => {
                const k = key(r, c);
                let bg = "transparent";
                let col = "#4a5765";
                if (filledSet.has(k)) {
                  bg = "rgba(138,151,168,0.07)";
                  col = C.muted;
                }
                if (readSet.has(k)) {
                  bg = "rgba(57,197,224,0.18)";
                  col = C.cyan;
                }
                if (activeSet.has(k)) {
                  bg = C.amber;
                  col = "#06121a";
                }
                if (resKey === k) {
                  bg = C.green;
                  col = "#06121a";
                }
                return (
                  <td
                    key={c}
                    className="text-center font-bold"
                    style={{
                      width: 30,
                      height: 28,
                      border: `1px solid ${C.border}`,
                      background: bg,
                      color: col,
                      transition: "background 120ms",
                    }}
                  >
                    {val === null || val === undefined ? "" : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && (
        <p className="text-center mono text-[11px] mt-3" style={{ color: C.muted }}>
          {caption}
        </p>
      )}
    </div>
  );
}

/* ============================== STACK =========================== */
function StackViz({ state }: { state: StackState }) {
  const { frames, tree } = state;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: tree ? "auto 1fr" : "1fr" }}>
      {/* call stack column */}
      <div className="flex flex-col-reverse gap-1.5 justify-end min-w-[150px]">
        <div className="mono text-[9px] uppercase tracking-widest text-center" style={{ color: C.faint }}>
          call stack ↑
        </div>
        {frames.map((f, i) => {
          const c =
            f.state === "active"
              ? { b: C.amber, t: "#06121a", br: C.amber }
              : f.state === "returning"
                ? { b: "rgba(63,185,80,0.16)", t: C.green, br: C.green }
                : { b: C.surface, t: C.muted, br: "#2b3a49" };
          return (
            <div
              key={i}
              className="rounded-md px-3 py-1.5 mono text-xs flex items-center justify-between gap-2"
              style={{ background: c.b, color: c.t, border: `1px solid ${c.br}` }}
            >
              <span className="font-bold">{f.label}</span>
              {f.returnValue !== undefined && (
                <span style={{ color: f.state === "returning" ? C.green : c.t }}>
                  → {f.returnValue}
                </span>
              )}
              {f.detail && f.returnValue === undefined && (
                <span style={{ color: c.t, opacity: 0.7 }}>{f.detail}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* recursion tree */}
      {tree && (
        <svg viewBox="0 0 100 62" className="w-full" style={{ maxHeight: 300 }}>
          {(() => {
            const maxDepth = Math.max(1, ...tree.nodes.map((n) => n.depth));
            const xOf = (order: number) => ((order + 0.5) / tree.width) * 100;
            const yOf = (depth: number) => 6 + (depth / maxDepth) * 50;
            const posOf: Record<string, { x: number; y: number }> = {};
            tree.nodes.forEach((n) => (posOf[n.id] = { x: xOf(n.order), y: yOf(n.depth) }));
            return (
              <>
                {tree.edges.map((e, i) => {
                  const a = posOf[e.from];
                  const b = posOf[e.to];
                  if (!a || !b) return null;
                  return (
                    <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2b3a49" strokeWidth={0.5} />
                  );
                })}
                {tree.nodes.map((n) => {
                  const c = nodeFill(n.state);
                  const p = posOf[n.id];
                  return (
                    <g key={n.id}>
                      <circle cx={p.x} cy={p.y} r={3.6} fill={c.fill} stroke={c.stroke} strokeWidth={0.6} />
                      <text
                        x={p.x}
                        y={p.y + 1.1}
                        fontSize={2.7}
                        textAnchor="middle"
                        fill={c.text}
                        className="mono"
                      >
                        {n.label}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      )}
    </div>
  );
}

/* ============================== GRID ============================ */
function GridViz({ state }: { state: GridState }) {
  const { cells } = state;
  const rows = cells.length;
  const cols = cells[0]?.length ?? 0;
  const palette: Record<string, string> = {
    empty: C.surface,
    wall: "#2b3a49",
    frontier: "rgba(57,197,224,0.45)",
    visited: "rgba(63,185,80,0.30)",
    path: C.purple,
    start: C.green,
    goal: C.red,
  };
  return (
    <div className="flex justify-center">
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, width: Math.min(cols * 26, 460) }}
      >
        {cells.flatMap((row, r) =>
          row.map((kind, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                aspectRatio: "1",
                background: palette[kind] ?? C.surface,
                borderRadius: 2,
                transition: "background 120ms",
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}

/* ========================== DISPATCHER ========================== */
export function Viz({ kind, state }: { kind: RenderKind; state: VizState }) {
  switch (kind) {
    case "array":
      return <ArrayViz state={state as ArrayState} />;
    case "graph":
      return <GraphViz state={state as GraphState} />;
    case "tree":
      return <TreeViz state={state as TreeState} />;
    case "table":
      return <TableViz state={state as TableState} />;
    case "stack":
      return <StackViz state={state as StackState} />;
    case "grid":
      return <GridViz state={state as GridState} />;
    default:
      return null;
  }
}
