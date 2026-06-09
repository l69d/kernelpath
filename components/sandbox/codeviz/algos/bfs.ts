import type { Algorithm, GraphEdge, GraphNode, GraphState, NodeState, Step } from "../types";

const code = [
  "function bfs(graph, start) {",
  "  const queue = [start];",
  "  const visited = new Set([start]);",
  "  while (queue.length > 0) {",
  "    const node = queue.shift();   // dequeue front",
  "    visit(node);",
  "    for (const next of graph[node]) {",
  "      if (!visited.has(next)) {",
  "        visited.add(next);",
  "        queue.push(next);          // enqueue",
  "      }",
  "    }",
  "  }",
  "}",
];

// fixed layout (x: 0..100, y: 0..60)
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
  const order: Record<string, number> = {};
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
  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  state[start] = "frontier";

  steps.push({ line: 0, explain: "Breadth-first search from A — explore level by level using a FIFO queue.", state: { nodes: Object.entries(LAYOUT).map(([id, [x, y]]) => ({ id, x, y, state: state[id] })), edges: EDGES.map(([from, to]) => ({ from, to, state: "idle" as const })) } });
  snap(1, "Seed the queue with the start node A.", undefined);
  snap(2, "Mark A visited so we never enqueue it twice.");

  while (queue.length > 0) {
    snap(3, `Queue = [${queue.join(", ")}]. Not empty, so keep going.`);
    const node = queue.shift() as string;
    state[node] = "current";
    snap(4, `Dequeue ${node} from the front of the queue.`, node);
    order[node] = visitCount++;
    state[node] = "visited";
    snap(5, `Visit ${node} (visit order #${order[node] + 1}).`);
    for (const next of ADJ[node]) {
      snap(6, `Look at ${node}'s neighbour ${next}.`);
      if (!visited.has(next)) {
        visited.add(next);
        if (state[next] === "idle") state[next] = "frontier";
        treeEdge.add(`${node}->${next}`);
        snap([7, 8, 9], `${next} is unvisited — mark it and enqueue it.`);
        queue.push(next);
      } else {
        snap(7, `${next} is already visited — skip it.`);
      }
    }
  }
  snap(3, "Queue is empty — every reachable node has been visited.");
  return steps;
}

export const bfs: Algorithm = {
  id: "bfs",
  name: "Breadth-First Search",
  category: "Graph",
  blurb: "Explore a graph level by level with a FIFO queue; finds shortest paths in unweighted graphs.",
  complexity: "O(V + E)",
  renderKind: "graph",
  code,
  run,
};
