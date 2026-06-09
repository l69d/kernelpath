"use client";

import { useEffect, useMemo, useState } from "react";

/* ----------------------------------------------------------------- *
 *  cs3-04 — B-tree (order 3) insertion stepper.
 *  Each node holds at most 3 keys. Inserting a 4th overflows the node:
 *  it SPLITS, the median key is pushed up into the parent, and the
 *  remaining keys become two children. A split can cascade up to the
 *  root, which is the only way the tree grows TALLER. Few levels +
 *  many keys per node = very few disk reads — why databases love them.
 *  All state is precomputed deterministically; no randomness anywhere.
 * ----------------------------------------------------------------- */

const MAX_KEYS = 3;
const SEQ = [10, 20, 5, 6, 12, 30, 7, 17, 3, 25, 40, 8, 1, 2];

type BNode = { keys: number[]; children: BNode[]; leaf: boolean };

const node = (keys: number[], children: BNode[], leaf: boolean): BNode => ({
  keys,
  children,
  leaf,
});

/* deep clone so each step keeps an immutable snapshot */
function clone(n: BNode): BNode {
  return node([...n.keys], n.children.map(clone), n.leaf);
}

/* insert one key; returns the (possibly new) root + the median that split */
function insert(root: BNode, key: number): { root: BNode; splitKey: number | null } {
  const r = clone(root);
  const path: { parent: BNode; idx: number }[] = [];
  let cur = r;
  while (!cur.leaf) {
    let i = 0;
    while (i < cur.keys.length && key > cur.keys[i]) i += 1;
    path.push({ parent: cur, idx: i });
    cur = cur.children[i];
  }
  let j = 0;
  while (j < cur.keys.length && key > cur.keys[j]) j += 1;
  cur.keys.splice(j, 0, key);

  let splitKey: number | null = null;
  let newRoot = r;
  while (cur.keys.length > MAX_KEYS) {
    const mid = Math.floor(cur.keys.length / 2);
    const median = cur.keys[mid];
    splitKey = median;
    const left = node(cur.keys.slice(0, mid), cur.children.slice(0, mid + 1), cur.leaf);
    const right = node(cur.keys.slice(mid + 1), cur.children.slice(mid + 1), cur.leaf);
    const up = path.pop();
    if (!up) {
      newRoot = node([median], [left, right], false);
      cur = newRoot;
      break;
    }
    up.parent.keys.splice(up.idx, 0, median);
    up.parent.children.splice(up.idx, 1, left, right);
    cur = up.parent;
  }
  return { root: newRoot, splitKey };
}

type Snapshot = { root: BNode; inserted: number; splitKey: number | null };

/* build every snapshot once, deterministically */
function buildFrames(): Snapshot[] {
  const frames: Snapshot[] = [];
  let root = node([], [], true);
  for (const k of SEQ) {
    const res = insert(root, k);
    root = res.root;
    frames.push({ root: clone(root), inserted: k, splitKey: res.splitKey });
  }
  return frames;
}

/* ---- layout: assign x by in-order leaf slots, y by depth ---- */
type Placed = { n: BNode; x: number; depth: number };

function layout(root: BNode): { placed: Placed[]; edges: [Placed, Placed][]; cols: number } {
  const placed: Placed[] = [];
  const edges: [Placed, Placed][] = [];
  let col = 0;
  const walk = (n: BNode, depth: number): Placed => {
    if (n.leaf) {
      const p: Placed = { n, x: col, depth };
      col += 1;
      placed.push(p);
      return p;
    }
    const kids = n.children.map((c) => walk(c, depth + 1));
    const x = kids.reduce((s, k) => s + k.x, 0) / kids.length;
    const p: Placed = { n, x, depth };
    placed.push(p);
    kids.forEach((k) => edges.push([p, k]));
    return p;
  };
  walk(root, 0);
  return { placed, edges, cols: Math.max(col, 1) };
}

function height(n: BNode): number {
  return n.leaf ? 1 : 1 + height(n.children[0]);
}
function countNodes(n: BNode): number {
  return n.leaf ? 1 : 1 + n.children.reduce((s, c) => s + countNodes(c), 0);
}

export default function BTreeViz() {
  const frames = useMemo(buildFrames, []);
  const [step, setStep] = useState(3); // start just after the first split (height 2)
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= frames.length - 1) {
          setAuto(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
    return () => clearInterval(t);
  }, [auto, frames.length]);

  const frame = frames[step];
  const { placed, edges, cols } = useMemo(() => layout(frame.root), [frame.root]);

  const W = 720;
  const slot = W / (cols + 1);
  const ROW = 92;
  const h = height(frame.root);
  const H = (h - 1) * ROW + 80;
  const keyW = 30;
  const nodeY = (d: number) => 34 + d * ROW;
  const nodeX = (x: number) => (x + 1) * slot;
  const grew =
    frame.splitKey !== null && step > 0 && height(frames[step].root) > height(frames[step - 1].root);

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* readout cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Stat label="keys inserted" value={`${step + 1} / ${SEQ.length}`} color="#39c5e0" />
          <Stat label="tree height" value={`${h} level${h > 1 ? "s" : ""}`} color="#bc8cff" />
          <Stat label="nodes" value={String(countNodes(frame.root))} color="#e3a93c" />
          <Stat label="reads / lookup" value={`≤ ${h}`} color="#3fb950" />
        </div>

        {/* tree */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 320, background: "#07090d" }}
          role="img"
          aria-label="B-tree structure"
        >
          {edges.map(([p, c], i) => (
            <line
              key={i}
              x1={nodeX(p.x)}
              y1={nodeY(p.depth) + 13}
              x2={nodeX(c.x)}
              y2={nodeY(c.depth) - 13}
              stroke="#1e2630"
              strokeWidth={1.5}
            />
          ))}
          {placed.map((p, i) => {
            const total = p.n.keys.length * keyW;
            const startX = nodeX(p.x) - total / 2;
            const justSplit =
              frame.splitKey !== null && !p.n.leaf && p.n.keys.includes(frame.splitKey);
            return (
              <g key={i}>
                <rect
                  x={startX - 3}
                  y={nodeY(p.depth) - 13}
                  width={total + 6}
                  height={26}
                  rx={5}
                  fill="#10151d"
                  stroke={justSplit ? "#f778ba" : "#1e2630"}
                  strokeWidth={justSplit ? 2 : 1}
                />
                {p.n.keys.map((k, ki) => {
                  const isNew = k === frame.inserted;
                  return (
                    <g key={ki}>
                      {ki > 0 && (
                        <line
                          x1={startX + ki * keyW}
                          y1={nodeY(p.depth) - 13}
                          x2={startX + ki * keyW}
                          y2={nodeY(p.depth) + 13}
                          stroke="#1e2630"
                          strokeWidth={1}
                        />
                      )}
                      {isNew && (
                        <rect
                          x={startX + ki * keyW}
                          y={nodeY(p.depth) - 13}
                          width={keyW}
                          height={26}
                          rx={5}
                          fill="#3fb950"
                          opacity={0.9}
                        />
                      )}
                      <text
                        x={startX + ki * keyW + keyW / 2}
                        y={nodeY(p.depth) + 4}
                        textAnchor="middle"
                        fontSize={12}
                        fontFamily="ui-monospace, monospace"
                        fontWeight={isNew ? 700 : 500}
                        fill={isNew ? "#06121a" : "#d6dee8"}
                      >
                        {k}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* event line */}
        <div className="card mt-3 p-3 min-h-[52px] flex items-center gap-3">
          <span
            className="mono text-xs font-bold rounded px-2 py-1 shrink-0"
            style={{ background: "#3fb95022", color: "#56d364", border: "1px solid #3fb95055" }}
          >
            + {frame.inserted}
          </span>
          <p className="text-sm text-muted">
            {frame.splitKey !== null ? (
              <>
                Node overflowed past {MAX_KEYS} keys —{" "}
                <b style={{ color: "#f778ba" }}>split!</b> Median{" "}
                <b className="text-text">{frame.splitKey}</b> pushed up
                {grew ? (
                  <>
                    , growing the tree to <b className="text-text">{h} levels</b>.
                  </>
                ) : (
                  <>.</>
                )}
              </>
            ) : (
              <>Inserted into a leaf with room to spare — no split, height unchanged.</>
            )}
          </p>
        </div>

        {/* controls */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            className="mono text-xs rounded border border-border px-3 py-1.5 text-faint hover:text-text"
          >
            ‹ prev
          </button>
          <input
            type="range"
            min={0}
            max={SEQ.length - 1}
            value={step}
            onChange={(e) => {
              setAuto(false);
              setStep(Number(e.target.value));
            }}
            className="flex-1 accent-[#3fb950]"
            aria-label="insertion step"
          />
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => Math.min(SEQ.length - 1, s + 1));
            }}
            className="mono text-xs rounded border border-border px-3 py-1.5 text-faint hover:text-text"
          >
            next ›
          </button>
          <button
            onClick={() => {
              if (step >= SEQ.length - 1) setStep(0);
              setAuto((a) => !a);
            }}
            className="mono text-xs rounded px-3 py-1.5"
            style={{
              background: auto ? "#3fb950" : "#10151d",
              color: auto ? "#06121a" : "#8a97a8",
              border: `1px solid ${auto ? "#3fb950" : "#1e2630"}`,
            }}
          >
            {auto ? "❚❚ pause" : "▶ play"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Order-3 B-tree · max {MAX_KEYS} keys/node. Real DB nodes hold hundreds of keys, so a
        billion-row table is ~4 levels deep — any lookup is ≤ 4 disk reads.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
