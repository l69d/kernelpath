"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs11-03 — Adversarial Search & Games: Minimax + Alpha-Beta pruning
 *  A 3-level game tree (MAX root, MIN middle, MAX-evaluated leaves).
 *  Step through the alpha-beta depth-first walk: nodes back up their
 *  value, the chosen child lights up, and branches that can't change
 *  the result are crossed out.
 * ================================================================== */

const COL = {
  bg: "#07090d",
  surface: "#10151d",
  surface2: "#161c26",
  border: "#1e2630",
  text: "#d6dee8",
  muted: "#8a97a8",
  faint: "#5b6b7d",
  green: "#3fb950",
  greenB: "#56d364",
  cyan: "#39c5e0",
  blue: "#58a6ff",
  amber: "#e3a93c",
  purple: "#bc8cff",
  red: "#f85149",
} as const;

// Fixed leaf values, left-to-right. 3 MIN nodes × 3 leaves each.
const LEAVES = [3, 12, 8, 2, 4, 6, 14, 5, 2];

type Kind = "MAX" | "MIN" | "LEAF";
interface Node {
  id: number;
  kind: Kind;
  depth: number;
  x: number;
  y: number;
  children: number[];
  value: number; // minimax-backed value (precomputed)
}

// ---- build the tree geometry + true minimax values (deterministic) ----
function buildTree(): Node[] {
  const W = 720;
  const nodes: Node[] = [];
  // leaves
  const leafIds: number[] = [];
  LEAVES.forEach((v, i) => {
    const id = nodes.length;
    leafIds.push(id);
    nodes.push({
      id,
      kind: "LEAF",
      depth: 2,
      x: 70 + (i * (W - 140)) / (LEAVES.length - 1),
      y: 250,
      children: [],
      value: v,
    });
  });
  // MIN nodes (depth 1) — each takes the min of its 3 leaves
  const minIds: number[] = [];
  for (let g = 0; g < 3; g++) {
    const kids = [leafIds[g * 3], leafIds[g * 3 + 1], leafIds[g * 3 + 2]];
    const cx = (nodes[kids[0]].x + nodes[kids[2]].x) / 2;
    const id = nodes.length;
    minIds.push(id);
    nodes.push({
      id,
      kind: "MIN",
      depth: 1,
      x: cx,
      y: 140,
      children: kids,
      value: Math.min(...kids.map((k) => nodes[k].value)),
    });
  }
  // MAX root (depth 0) — max of the MIN nodes
  const rootX = (nodes[minIds[0]].x + nodes[minIds[2]].x) / 2;
  nodes.push({
    id: nodes.length,
    kind: "MAX",
    depth: 0,
    x: rootX,
    y: 40,
    children: minIds,
    value: Math.max(...minIds.map((k) => nodes[k].value)),
  });
  return nodes;
}

interface Frame {
  visited: number; // node id being finalised / leaf inspected
  backed: number; // value backed up to that node (after inspecting)
  pruned: number[]; // ids pruned at this point
  alpha: number;
  beta: number;
  note: string;
}

// ---- generate the alpha-beta walk as discrete frames ----
function buildFrames(nodes: Node[]): Frame[] {
  const frames: Frame[] = [];
  const pruned: number[] = [];
  const root = nodes[nodes.length - 1];

  function ab(id: number, alpha: number, beta: number): number {
    const n = nodes[id];
    if (n.kind === "LEAF") {
      frames.push({
        visited: id,
        backed: n.value,
        pruned: [...pruned],
        alpha,
        beta,
        note: `Leaf evaluated → ${n.value}.`,
      });
      return n.value;
    }
    if (n.kind === "MAX") {
      let best = -Infinity;
      for (let i = 0; i < n.children.length; i++) {
        const c = n.children[i];
        const v = ab(c, alpha, beta);
        best = Math.max(best, v);
        alpha = Math.max(alpha, best);
        if (alpha >= beta) {
          for (let j = i + 1; j < n.children.length; j++) markPruned(n.children[j]);
          frames.push({
            visited: id,
            backed: best,
            pruned: [...pruned],
            alpha,
            beta,
            note: `MAX cutoff: α(${alpha}) ≥ β(${beta}). Remaining siblings pruned.`,
          });
          return best;
        }
      }
      frames.push({
        visited: id,
        backed: best,
        pruned: [...pruned],
        alpha,
        beta,
        note: `MAX backs up max of children → ${best}.`,
      });
      return best;
    }
    // MIN
    let best = Infinity;
    for (let i = 0; i < n.children.length; i++) {
      const c = n.children[i];
      const v = ab(c, alpha, beta);
      best = Math.min(best, v);
      beta = Math.min(beta, best);
      if (alpha >= beta) {
        for (let j = i + 1; j < n.children.length; j++) markPruned(n.children[j]);
        frames.push({
          visited: id,
          backed: best,
          pruned: [...pruned],
          alpha,
          beta,
          note: `MIN cutoff: β(${beta}) ≤ α(${alpha}). Remaining siblings pruned.`,
        });
        return best;
      }
    }
    frames.push({
      visited: id,
      backed: best,
      pruned: [...pruned],
      alpha,
      beta,
      note: `MIN backs up min of children → ${best}.`,
    });
    return best;
  }

  function markPruned(id: number) {
    if (!pruned.includes(id)) pruned.push(id);
    nodes[id].children.forEach(markPruned);
  }

  ab(root.id, -Infinity, Infinity);
  return frames;
}

function fmt(n: number): string {
  if (n === Infinity) return "+∞";
  if (n === -Infinity) return "−∞";
  return String(n);
}

export default function MinimaxViz() {
  const nodes = useMemo(() => buildTree(), []);
  const frames = useMemo(() => buildFrames(buildTree()), []);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [prune, setPrune] = useState(true);

  const maxStep = frames.length;
  const cur = step === 0 ? null : frames[step - 1];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setStep((s) => (s >= maxStep ? 0 : s + 1));
    }, 950);
    return () => clearInterval(t);
  }, [auto, maxStep]);

  // node-id -> backed value once revealed at/after this step
  const revealed: Record<number, number> = {};
  const prunedNow = new Set<number>();
  for (let i = 0; i < step; i++) {
    revealed[frames[i].visited] = frames[i].backed;
    if (prune) frames[i].pruned.forEach((p) => prunedNow.add(p));
  }
  const activeId = cur ? cur.visited : -1;
  const root = nodes[nodes.length - 1];
  const solved = step >= maxStep;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-3">
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ‹ prev
          </button>
          <button
            onClick={() => setAuto((a) => !a)}
            className="mono text-[11px] rounded px-3 py-1"
            style={{
              background: auto ? COL.green : COL.surface,
              border: `1px solid ${auto ? COL.green : COL.border}`,
              color: auto ? COL.bg : COL.faint,
            }}
          >
            {auto ? "❚❚ pause" : "▶ play"}
          </button>
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => Math.min(maxStep, s + 1));
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            next ›
          </button>
          <button
            onClick={() => {
              setAuto(false);
              setStep(0);
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ↺ reset
          </button>
          <label
            className="mono text-[11px] flex items-center gap-1.5 rounded px-2 py-1 cursor-pointer select-none"
            style={{
              border: `1px solid ${prune ? COL.red : COL.border}`,
              color: prune ? COL.red : COL.faint,
            }}
          >
            <input
              type="checkbox"
              checked={prune}
              onChange={(e) => setPrune(e.target.checked)}
              className="accent-[#f85149]"
            />
            α-β pruning
          </label>
        </div>

        {/* tree */}
        <svg
          viewBox="0 0 760 290"
          className="w-full"
          style={{ maxHeight: 320 }}
          role="img"
          aria-label="Minimax game tree"
        >
          {/* edges */}
          {nodes.map((n) =>
            n.children.map((cid) => {
              const c = nodes[cid];
              const isPruned = prune && prunedNow.has(cid);
              // is this the chosen (winning) edge once both ends revealed?
              const chosen =
                revealed[n.id] !== undefined &&
                revealed[cid] !== undefined &&
                revealed[n.id] === revealed[cid];
              return (
                <line
                  key={`${n.id}-${cid}`}
                  x1={n.x + 20}
                  y1={n.y + 20}
                  x2={c.x + 20}
                  y2={c.y}
                  stroke={
                    isPruned
                      ? COL.red
                      : chosen
                        ? COL.greenB
                        : COL.border
                  }
                  strokeWidth={chosen ? 2.5 : 1.5}
                  strokeDasharray={isPruned ? "5 4" : undefined}
                  opacity={isPruned ? 0.55 : chosen ? 1 : 0.7}
                />
              );
            }),
          )}

          {/* pruned X marks on edges */}
          {prune &&
            nodes.map((n) =>
              n.children.map((cid) => {
                if (!prunedNow.has(cid)) return null;
                const c = nodes[cid];
                const mx = (n.x + 20 + c.x + 20) / 2;
                const my = (n.y + 20 + c.y) / 2;
                return (
                  <text
                    key={`x-${n.id}-${cid}`}
                    x={mx}
                    y={my + 4}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={700}
                    fill={COL.red}
                  >
                    ✕
                  </text>
                );
              }),
            )}

          {/* nodes */}
          {nodes.map((n) => {
            const isPruned = prune && prunedNow.has(n.id);
            const isActive = n.id === activeId;
            const shown = revealed[n.id];
            const isLeaf = n.kind === "LEAF";
            const accent =
              n.kind === "MAX"
                ? COL.greenB
                : n.kind === "MIN"
                  ? COL.purple
                  : COL.cyan;
            const display =
              isLeaf ? n.value : shown !== undefined ? shown : "?";
            return (
              <g key={n.id} opacity={isPruned ? 0.4 : 1}>
                {isLeaf ? (
                  <rect
                    x={n.x}
                    y={n.y}
                    width={40}
                    height={32}
                    rx={6}
                    fill={isActive ? accent : COL.surface}
                    stroke={isActive ? accent : isPruned ? COL.red : COL.border}
                    strokeWidth={isActive ? 2 : 1.4}
                  />
                ) : (
                  <circle
                    cx={n.x + 20}
                    cy={n.y + 20}
                    r={20}
                    fill={isActive ? accent : COL.surface}
                    stroke={isActive ? accent : shown !== undefined ? accent : COL.border}
                    strokeWidth={isActive ? 2.5 : 1.6}
                  />
                )}
                <text
                  x={n.x + 20}
                  y={n.y + (isLeaf ? 21 : 25)}
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize={13}
                  fontWeight={700}
                  fill={
                    isActive
                      ? COL.bg
                      : shown !== undefined || isLeaf
                        ? COL.text
                        : COL.faint
                  }
                >
                  {display}
                </text>
                {!isLeaf && (
                  <text
                    x={n.x + 20}
                    y={n.y - 8}
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    fontSize={9}
                    fontWeight={700}
                    letterSpacing={1}
                    fill={accent}
                  >
                    {n.kind}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* readout */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="card py-2 text-center">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">α (MAX floor)</div>
            <div className="mono text-sm font-bold mt-0.5" style={{ color: COL.green }}>
              {cur ? fmt(cur.alpha) : "−∞"}
            </div>
          </div>
          <div className="card py-2 text-center">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">β (MIN ceiling)</div>
            <div className="mono text-sm font-bold mt-0.5" style={{ color: COL.purple }}>
              {cur ? fmt(cur.beta) : "+∞"}
            </div>
          </div>
          <div className="card py-2 text-center">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              {prune ? "leaves skipped" : "root value"}
            </div>
            <div className="mono text-sm font-bold mt-0.5" style={{ color: prune ? COL.red : COL.greenB }}>
              {prune
                ? [...prunedNow].filter((id) => nodes[id].kind === "LEAF").length
                : solved
                  ? root.value
                  : "—"}
            </div>
          </div>
        </div>

        <div className="card p-3 mt-3 min-h-[52px] flex items-center gap-3">
          <span
            className="mono text-xs font-bold shrink-0"
            style={{ color: solved ? COL.greenB : activeId === -1 ? COL.faint : COL.cyan }}
          >
            {solved ? "DONE" : String(step).padStart(2, "0")}
          </span>
          <p className="text-sm text-muted">
            {solved
              ? `Optimal play: MAX secures a guaranteed value of ${root.value} (the highlighted path). With α-β, ${[...prunedNow].filter((id) => nodes[id].kind === "LEAF").length} of ${LEAVES.length} leaves never had to be looked at.`
              : cur
                ? cur.note
                : "Depth-first search. MAX wants to maximise; MIN, the adversary, wants to minimise. Press play to back values up the tree."}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Toggle α-β pruning to see which branches the search proves it can ignore — same answer, fewer leaves.
      </p>
    </div>
  );
}