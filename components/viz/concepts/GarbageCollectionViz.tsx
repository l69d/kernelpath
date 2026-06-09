"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs6-06 — Mark & Sweep garbage collection.
 *  A heap of objects with reference arrows + a root set. Step the
 *  collector: MARK (traverse from roots, colour reachable) then SWEEP
 *  (free the unmarked). An unreachable island (D⇄E) gets collected.
 * ================================================================== */

type NodeId = "R1" | "R2" | "A" | "B" | "C" | "D" | "E" | "F";

interface HeapNode {
  id: NodeId;
  label: string;
  root?: boolean;
  x: number;
  y: number;
}

// Deterministic layout. Roots on the left, heap objects to the right.
const NODES: HeapNode[] = [
  { id: "R1", label: "stack", root: true, x: 60, y: 70 },
  { id: "R2", label: "global", root: true, x: 60, y: 185 },
  { id: "A", label: "A", x: 215, y: 50 },
  { id: "B", label: "B", x: 215, y: 160 },
  { id: "C", label: "C", x: 360, y: 105 },
  { id: "F", label: "F", x: 505, y: 105 },
  { id: "D", label: "D", x: 360, y: 235 },
  { id: "E", label: "E", x: 505, y: 235 },
];

// Directed references (from → to).
const EDGES: [NodeId, NodeId][] = [
  ["R1", "A"],
  ["R2", "B"],
  ["A", "C"],
  ["B", "C"],
  ["C", "F"],
  ["D", "E"],
  ["E", "D"], // the unreachable island references itself
];

type Phase =
  | { kind: "idle" }
  | { kind: "mark"; frontier: NodeId[] }
  | { kind: "sweep"; index: number }
  | { kind: "done" };

const COL = {
  border: "#1e2630",
  surface: "#10151d",
  surface2: "#161c26",
  muted: "#8a97a8",
  faint: "#5b6b7d",
  text: "#d6dee8",
  green: "#3fb950",
  greenB: "#56d364",
  cyan: "#39c5e0",
  amber: "#e3a93c",
  purple: "#bc8cff",
  red: "#f85149",
};

// Build the full mark order (BFS from roots) once — deterministic.
function computeMarkOrder(): NodeId[] {
  const adj = new Map<NodeId, NodeId[]>();
  for (const [from, to] of EDGES) {
    const list = adj.get(from) ?? [];
    list.push(to);
    adj.set(from, list);
  }
  const order: NodeId[] = [];
  const seen = new Set<NodeId>();
  const queue: NodeId[] = NODES.filter((n) => n.root).map((n) => n.id);
  for (const r of queue) seen.add(r);
  while (queue.length) {
    const cur = queue.shift() as NodeId;
    order.push(cur);
    for (const nxt of adj.get(cur) ?? []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        queue.push(nxt);
      }
    }
  }
  return order;
}

const SWEEP_ORDER: NodeId[] = NODES.filter((n) => !n.root).map((n) => n.id);

export default function GarbageCollectionViz() {
  const markOrder = useMemo(computeMarkOrder, []);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [marked, setMarked] = useState<Set<NodeId>>(new Set());
  const [freed, setFreed] = useState<Set<NodeId>>(new Set());
  const [auto, setAuto] = useState(false);

  // Object currently being visited (highlighted), for narration.
  const cursor: NodeId | null =
    phase.kind === "mark" && phase.frontier.length
      ? phase.frontier[phase.frontier.length - 1]
      : phase.kind === "sweep"
        ? SWEEP_ORDER[phase.index] ?? null
        : null;

  function reset() {
    setPhase({ kind: "idle" });
    setMarked(new Set());
    setFreed(new Set());
  }

  function step() {
    setPhase((p): Phase => {
      // idle → start marking from the roots
      if (p.kind === "idle") {
        const roots = NODES.filter((n) => n.root).map((n) => n.id);
        setMarked(new Set(roots));
        return { kind: "mark", frontier: roots };
      }
      if (p.kind === "mark") {
        const nextCount = p.frontier.length;
        // Reveal the next object in BFS order, or move to sweep.
        if (nextCount >= markOrder.length) {
          return { kind: "sweep", index: 0 };
        }
        const nextId = markOrder[nextCount];
        setMarked((m) => new Set(m).add(nextId));
        return { kind: "mark", frontier: [...p.frontier, nextId] };
      }
      if (p.kind === "sweep") {
        const id = SWEEP_ORDER[p.index];
        if (id !== undefined) {
          setFreed((f) => {
            const next = new Set(f);
            if (!marked.has(id)) next.add(id);
            return next;
          });
        }
        if (p.index + 1 >= SWEEP_ORDER.length) return { kind: "done" };
        return { kind: "sweep", index: p.index + 1 };
      }
      return p; // done — no-op
    });
  }

  // Auto-play through the whole collection, then stop.
  useEffect(() => {
    if (!auto) return;
    if (phase.kind === "done") {
      setAuto(false);
      return;
    }
    const t = setInterval(step, 750);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, phase, marked]);

  const stateOf = (id: NodeId): "freed" | "marked" | "scanning" | "unmarked" => {
    if (freed.has(id)) return "freed";
    if (cursor === id) return "scanning";
    if (marked.has(id)) return "marked";
    return "unmarked";
  };

  const nodeColor = (s: ReturnType<typeof stateOf>) =>
    s === "freed"
      ? COL.red
      : s === "scanning"
        ? COL.amber
        : s === "marked"
          ? COL.green
          : COL.faint;

  const nodeById = (id: NodeId) => NODES.find((n) => n.id === id) as HeapNode;
  const R = 24;

  const phaseLabel =
    phase.kind === "idle"
      ? "READY"
      : phase.kind === "mark"
        ? "MARK"
        : phase.kind === "sweep"
          ? "SWEEP"
          : "DONE";

  const narration =
    phase.kind === "idle"
      ? "Roots = the stack & globals the program can reach right now. Step to traverse the heap from them."
      : phase.kind === "mark"
        ? cursor
          ? `MARK: reached ${nodeById(cursor).label} from a root — colour it live, then follow its references.`
          : "MARK: colouring every object reachable from the roots."
        : phase.kind === "sweep"
          ? cursor
            ? marked.has(cursor)
              ? `SWEEP: ${nodeById(cursor).label} is marked → keep it.`
              : `SWEEP: ${nodeById(cursor).label} was never marked → free it.`
            : "SWEEP: scanning the heap, freeing everything unmarked."
          : "DONE: D and E referenced each other but no root could reach them — collected as garbage.";

  const aliveCount = NODES.filter((n) => !n.root && !freed.has(n.id)).length;
  const freedCount = freed.size;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* phase + controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <span
              className="mono text-[11px] font-bold rounded px-2 py-1"
              style={{
                background:
                  phaseLabel === "MARK"
                    ? COL.green
                    : phaseLabel === "SWEEP"
                      ? COL.red
                      : COL.surface,
                color:
                  phaseLabel === "MARK" || phaseLabel === "SWEEP"
                    ? "#06121a"
                    : COL.muted,
                border: `1px solid ${COL.border}`,
              }}
            >
              {phaseLabel}
            </span>
            <span className="mono text-[11px] text-faint">
              live {aliveCount} · freed {freedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAuto(false);
                step();
              }}
              disabled={phase.kind === "done"}
              className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text disabled:opacity-40"
            >
              step ▸
            </button>
            <button
              onClick={() => setAuto((a) => !a)}
              disabled={phase.kind === "done"}
              className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text disabled:opacity-40"
            >
              {auto ? "❚❚ pause" : "▶ run"}
            </button>
            <button
              onClick={reset}
              className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
            >
              ↻ reset
            </button>
          </div>
        </div>

        {/* heap graph */}
        <svg
          viewBox="0 0 580 300"
          className="w-full"
          style={{ maxHeight: 340 }}
          role="img"
          aria-label="Heap object graph for mark-and-sweep garbage collection"
        >
          <defs>
            <marker
              id="gc-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={COL.faint} />
            </marker>
            <marker
              id="gc-arrow-live"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={COL.green} />
            </marker>
          </defs>

          {/* island label */}
          <rect
            x="332"
            y="200"
            width="218"
            height="78"
            rx="8"
            fill="none"
            stroke={COL.border}
            strokeDasharray="4 4"
          />
          <text
            x="441"
            y="294"
            textAnchor="middle"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fill={COL.faint}
          >
            unreachable island
          </text>

          {/* edges */}
          {EDGES.map(([from, to]) => {
            const a = nodeById(from);
            const b = nodeById(to);
            const live = marked.has(from) && marked.has(to);
            const dim = freed.has(from) || freed.has(to);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            // shorten so arrows sit on circle edges
            const x1 = a.x + ux * (R + 2);
            const y1 = a.y + uy * (R + 2);
            const x2 = b.x - ux * (R + 8);
            const y2 = b.y - uy * (R + 8);
            return (
              <line
                key={`${from}-${to}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={dim ? "#2a313c" : live ? COL.green : COL.faint}
                strokeWidth={live ? 2 : 1.4}
                markerEnd={`url(#${live ? "gc-arrow-live" : "gc-arrow"})`}
                opacity={dim ? 0.4 : 1}
              />
            );
          })}

          {/* nodes */}
          {NODES.map((n) => {
            const s = stateOf(n.id);
            const c = n.root ? COL.cyan : nodeColor(s);
            const filled = s === "marked" || s === "scanning";
            return (
              <g key={n.id}>
                {n.root ? (
                  <rect
                    x={n.x - 30}
                    y={n.y - 18}
                    width={60}
                    height={36}
                    rx={6}
                    fill={COL.surface2}
                    stroke={COL.cyan}
                    strokeWidth={1.6}
                  />
                ) : (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={R}
                    fill={filled ? c : COL.surface}
                    stroke={c}
                    strokeWidth={s === "scanning" ? 3 : 2}
                    opacity={s === "freed" ? 0.5 : 1}
                    strokeDasharray={s === "freed" ? "3 3" : undefined}
                  />
                )}
                <text
                  x={n.x}
                  y={n.y + (n.root ? 4 : 5)}
                  textAnchor="middle"
                  fontSize={n.root ? 10 : 13}
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                  fill={
                    n.root
                      ? COL.cyan
                      : filled
                        ? "#06121a"
                        : s === "freed"
                          ? COL.red
                          : c
                  }
                >
                  {n.root ? n.label : s === "freed" ? "·" : n.label}
                </text>
              </g>
            );
          })}

          {/* roots bracket label */}
          <text
            x="60"
            y="248"
            textAnchor="middle"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fill={COL.cyan}
          >
            ROOT SET
          </text>
        </svg>

        {/* narration */}
        <div
          className="card p-3 mt-3 min-h-[52px] flex items-center"
          style={{
            borderColor:
              phase.kind === "sweep"
                ? COL.red
                : phase.kind === "mark"
                  ? COL.green
                  : COL.border,
          }}
        >
          <p className="text-sm text-muted">{narration}</p>
        </div>

        {/* legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] mono">
          <Legend color={COL.cyan} label="root" />
          <Legend color={COL.amber} label="scanning" />
          <Legend color={COL.green} label="marked / live" />
          <Legend color={COL.red} label="swept / freed" />
          <Legend color={COL.faint} label="unmarked" />
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Reachability, not reference counting, decides life: cyclic garbage (D ⇄ E)
        still gets collected because no root can reach it.
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-faint">{label}</span>
    </span>
  );
}
