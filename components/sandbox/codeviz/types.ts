/* ------------------------------------------------------------------ *
 *  CodeViz — shared contract for "code beside a live visualization".
 *
 *  Every algorithm is an instrumented function that emits an ordered
 *  list of Steps. Each Step says which source line is executing right
 *  now, explains in plain English what that line is doing, and carries
 *  a snapshot of the data-structure state for the renderer to draw.
 *
 *  Coordinate spaces for graph/tree renderers use a 0..100 (x) by
 *  0..60 (y) virtual canvas; renderers map that into a responsive SVG.
 * ------------------------------------------------------------------ */

export type RenderKind =
  | "array"
  | "graph"
  | "tree"
  | "table"
  | "stack"
  | "grid";

/* ---------- array (sorting / searching / two-pointer / window) ----- */
export interface ArrayPointer {
  name: string; // e.g. "i", "j", "lo", "hi", "mid", "pivot"
  index: number; // -1 to hide
  color?: string; // hex; defaults to cyan
}
export interface ArrayState {
  array: number[];
  active?: number[]; // indices being compared / looked at right now
  pointers?: ArrayPointer[]; // labelled markers drawn under cells
  done?: number[]; // finalized / sorted indices (green)
  marks?: Record<number, string>; // index -> hex color for custom highlights
  window?: [number, number]; // inclusive [start,end] sub-range overlay
}

/* ---------- graph (BFS / DFS / Dijkstra / MST ...) ----------------- */
export type NodeState = "idle" | "frontier" | "current" | "visited" | "path";
export interface GraphNode {
  id: string;
  x: number; // 0..100
  y: number; // 0..60
  label?: string; // defaults to id
  state?: NodeState;
  badge?: string | number; // small corner label e.g. distance
}
export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
  state?: "idle" | "considered" | "tree" | "path";
}
export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ---------- tree (BST / traversals) ------------------------------- */
export interface TreeNode {
  id: string;
  value: string | number;
  x: number; // 0..100
  y: number; // 0..60
  state?: NodeState;
}
export interface TreeState {
  nodes: TreeNode[];
  edges: { from: string; to: string }[];
}

/* ---------- table (dynamic programming) --------------------------- */
export interface TableState {
  cells: (number | string | null)[][]; // [row][col]
  rowLabels?: (string | number)[];
  colLabels?: (string | number)[];
  active?: [number, number][]; // cell(s) being written now (amber)
  reads?: [number, number][]; // cell(s) being read from (cyan)
  filled?: [number, number][]; // already computed (subtle)
  result?: [number, number]; // the answer cell (green)
  caption?: string;
}

/* ---------- call stack + recursion tree --------------------------- */
export interface StackFrame {
  label: string; // e.g. "fib(4)"
  detail?: string; // e.g. "n=4"
  state?: "active" | "waiting" | "returning";
  returnValue?: string | number;
}
export interface RecTreeNode {
  id: string;
  label: string;
  depth: number; // 0 = root
  order: number; // left-to-right position within the whole tree
  state?: NodeState;
}
export interface StackState {
  frames: StackFrame[]; // index 0 = bottom of stack
  tree?: {
    nodes: RecTreeNode[];
    edges: { from: string; to: string }[];
    width: number; // total order-slots, for x scaling
  };
}

/* ---------- grid (pathfinding / flood fill) ----------------------- */
export type CellKind =
  | "empty"
  | "wall"
  | "frontier"
  | "visited"
  | "path"
  | "start"
  | "goal";
export interface GridState {
  cells: CellKind[][]; // [row][col]
}

export type VizState =
  | ArrayState
  | GraphState
  | TreeState
  | TableState
  | StackState
  | GridState;

export interface Step {
  line: number | number[]; // 0-based index/indices into Algorithm.code
  explain: string; // plain-English description of THIS line's effect
  state: VizState; // snapshot for the renderer
}

export type Category =
  | "Sorting"
  | "Searching"
  | "Array"
  | "Graph"
  | "Tree"
  | "Dynamic Programming"
  | "Recursion"
  | "Math";

export interface Algorithm {
  id: string;
  name: string;
  category: Category;
  blurb: string;
  complexity: string; // e.g. "O(n log n)"
  renderKind: RenderKind;
  code: string[]; // source lines shown in the code panel
  run: () => Step[]; // produce the trace for a curated sample input
}
