import type { Algorithm, CellKind, GridState, Step } from "../types";

const code = [
  "function bfs(grid, start, goal) {",
  "  const queue = [start];",
  "  const seen = new Set([start]);",
  "  const parent = new Map();",
  "  while (queue.length > 0) {",
  "    const cell = queue.shift();        // FIFO: explore nearest first",
  "    if (cell === goal) return path(parent, goal);",
  "    for (const n of neighbours(cell)) {  // up, down, left, right",
  "      if (open(n) && !seen.has(n)) {",
  "        seen.add(n);",
  "        parent.set(n, cell);",
  "        queue.push(n);",
  "      }",
  "    }",
  "  }",
  "}",
];

const MAZE = [
  "S..........",
  "#########..",
  "...........",
  ".##########",
  "...........",
  "##########.",
  "..........G",
];
const ROWS = MAZE.length;
const COLS = MAZE[0].length;

type Cell = [number, number];
const key = (c: Cell) => `${c[0]},${c[1]}`;

function run(): Step[] {
  let start: Cell = [0, 0];
  let goal: Cell = [0, 0];
  const wall = new Set<string>();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const ch = MAZE[r][c];
      if (ch === "#") wall.add(key([r, c]));
      else if (ch === "S") start = [r, c];
      else if (ch === "G") goal = [r, c];
    }

  const steps: Step[] = [];
  const visited = new Set<string>();
  const inQueue = new Set<string>();
  const path = new Set<string>();

  const snap = (line: number | number[], explain: string): void => {
    const cells: CellKind[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: CellKind[] = [];
      for (let c = 0; c < COLS; c++) {
        const k = key([r, c]);
        let kind: CellKind = "empty";
        if (k === key(start)) kind = "start";
        else if (k === key(goal)) kind = "goal";
        else if (wall.has(k)) kind = "wall";
        else if (path.has(k)) kind = "path";
        else if (visited.has(k)) kind = "visited";
        else if (inQueue.has(k)) kind = "frontier";
        row.push(kind);
      }
      cells.push(row);
    }
    steps.push({ line, explain, state: { cells } as GridState });
  };

  const neighbours = (c: Cell): Cell[] =>
    [
      [c[0] - 1, c[1]],
      [c[0] + 1, c[1]],
      [c[0], c[1] - 1],
      [c[0], c[1] + 1],
    ].filter(([r, cc]) => r >= 0 && r < ROWS && cc >= 0 && cc < COLS) as Cell[];

  const queue: Cell[] = [start];
  const seen = new Set<string>([key(start)]);
  inQueue.add(key(start));
  const parent = new Map<string, Cell>();

  snap(0, "BFS on a grid. Because it expands in rings, the first time it reaches the goal is via a shortest path.");
  snap([1, 2], "Start the queue at S and mark S as seen.");

  let found = false;
  while (queue.length > 0) {
    const cell = queue.shift() as Cell;
    inQueue.delete(key(cell));
    visited.add(key(cell));
    if (key(cell) === key(goal)) {
      snap(6, "Dequeued the goal — stop and rebuild the path.");
      found = true;
      break;
    }
    let added = 0;
    for (const n of neighbours(cell)) {
      const nk = key(n);
      if (!wall.has(nk) && !seen.has(nk)) {
        seen.add(nk);
        parent.set(nk, cell);
        if (nk !== key(goal)) inQueue.add(nk);
        else inQueue.add(nk);
        queue.push(n);
        added++;
      }
    }
    snap(
      [5, 7, 8, 11],
      `Expand the wavefront from (${cell[0]},${cell[1]}); enqueue ${added} new open cell${added === 1 ? "" : "s"}. Frontier shown in blue.`,
    );
  }

  if (found) {
    // reconstruct
    const chain: Cell[] = [];
    let cur: Cell | undefined = goal;
    while (cur && key(cur) !== key(start)) {
      chain.push(cur);
      cur = parent.get(key(cur));
    }
    chain.reverse();
    for (const c of chain) {
      if (key(c) !== key(goal)) path.add(key(c));
      snap(6, `Follow parents back from the goal — step onto (${c[0]},${c[1]}).`);
    }
    snap(6, "Shortest path reconstructed (purple). BFS guarantees no shorter route exists.");
  }
  return steps;
}

export const gridBFS: Algorithm = {
  id: "grid-bfs",
  name: "Maze Pathfinding (BFS)",
  category: "Graph",
  blurb: "Flood a maze ring by ring with breadth-first search, then trace parents back for the shortest path.",
  complexity: "O(rows · cols)",
  renderKind: "grid",
  code,
  run,
};
