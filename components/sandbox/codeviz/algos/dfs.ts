import type { Algorithm, GraphEdge, GraphNode, GraphState, NodeState, Step } from "../types";

const code = [
  "function dfs(graph, start) {",
  "  const visited = new Set();",
  "  function explore(node) {",
  "    visited.add(node);",
  "    visit(node);",
  "    for (const next of graph[node]) {",
  "      if (!visited.has(next)) {",
  "        explore(next);   // recurse deeper",
  "      }",
  "    }",
  "    // backtrack: return to caller",
  "  }",
  "  explore(start);",
  "}",
];

// fixed layout (x: 0..100, y: 0..60) — same 7-node graph as BFS
const LAYOUT: Record<string, [number, number]> = {
  A: [14, 12],
  B: [46, 8],
  C: [80, 14],
  D: [18, 42],
  E: [50, 44],
  F: [84, 46],
  G: [50, 58],
};
const ADJ: Record<string, string[]> = {
  A: ["B", "D"],
  B: ["A", "C", "E"],
  C: ["B", "F"],
  D: ["A", "E"],
  E: ["B", "D", "F", "G"],
  F: ["C", "E"],
  G: ["E"],
};
const EDGES: [string, string][] = [
  ["A", "B"],
  ["A", "D"],
  ["B", "C"],
  ["B", "E"],
  ["C", "F"],
  ["D", "E"],
  ["E", "F"],
  ["E", "G"],
];

function run(): Step[] {
  const steps: Step[] = [];
  const state: Record<string, NodeState> = {};
  Object.keys(LAYOUT).forEach((id) => (state[id] = "idle"));
  const treeEdge = new Set<string>(); // "from->to"
  const order: Record<string, number> = {}; // DFS preorder number
  let visitCount = 0;

  const snap = (line: number | number[], explain: string, current?: string): void => {
    const nodes: GraphNode[] = Object.entries(LAYOUT).map(([id, [x, y]]) => ({
      id,
      x,
      y,
      state: id === current ? "current" : state[id],
      badge: order[id] !== undefined ? order[id] : "",
    }));
    const edges: GraphEdge[] = EDGES.map(([from, to]) => ({
      from,
      to,
      state:
        treeEdge.has(`${from}->${to}`) || treeEdge.has(`${to}->${from}`)
          ? "tree"
          : "idle",
    }));
    const gs: GraphState = { nodes, edges };
    steps.push({ line, explain, state: gs });
  };

  const start = "A";
  const visited = new Set<string>();

  steps.push({
    line: 0,
    explain:
      "Depth-first search from A — unlike BFS's level-by-level queue, DFS plunges down one branch as far as it can before backtracking, driven here by the recursion (call) stack.",
    state: {
      nodes: Object.entries(LAYOUT).map(([id, [x, y]]) => ({ id, x, y, state: state[id] })),
      edges: EDGES.map(([from, to]) => ({ from, to, state: "idle" as const })),
    },
  });
  snap(1, "Create an empty visited set — every node starts unexplored.");

  const explore = (node: string, parent?: string): void => {
    // entering this node
    state[node] = "current";
    snap(2, `Enter explore(${node}). This pushes a new frame onto the recursion stack.`, node);
    visited.add(node);
    state[node] = "frontier"; // on the recursion stack now
    if (parent !== undefined) treeEdge.add(`${parent}->${node}`);
    snap(3, `Mark ${node} as visited so we never enter it twice.`, node);
    order[node] = visitCount++;
    snap(4, `Visit ${node} — assign DFS preorder number ${order[node] as number} (shown as its badge).`, node);

    for (const next of ADJ[node]) {
      snap(5, `From ${node}, look at neighbour ${next}.`, node);
      if (!visited.has(next)) {
        snap([6, 7], `${next} is unvisited — recurse into it, going deeper before trying ${node}'s other neighbours.`, node);
        explore(next, node);
        // back from the child: this frame is active again, but it is still
        // only on the stack (frontier) — the per-snapshot `current` highlight
        // below marks it as the actively-executing frame without leaving the
        // stored state stuck on "current" when we recurse into the next child.
        state[node] = "frontier";
        snap(2, `Back in explore(${node}) after the recursion into ${next} returned.`, node);
      } else {
        snap(6, `${next} is already visited — skip it, do not recurse.`, node);
      }
    }

    // backtracking out of this node
    state[node] = "visited";
    snap(10, `Done with ${node}'s neighbours — backtrack: pop its frame and return to the caller.`);
  };

  snap(12, "Kick everything off by calling explore on the start node A.");
  explore(start);
  snap(13, "explore(A) has returned — the recursion stack is empty and every reachable node is fully explored.");
  return steps;
}

export const dfs: Algorithm = {
  id: "dfs",
  name: "Depth-First Search",
  category: "Graph",
  blurb: "Plunge as deep as possible along each branch before backtracking, using a stack (here, recursion).",
  complexity: "O(V + E)",
  renderKind: "graph",
  code,
  run,
};
