import type { Algorithm, GraphEdge, GraphNode, GraphState, NodeState, Step } from "../types";

const code = [
  "function dijkstra(graph, start, goal) {",
  "  const dist = {}; for (const v of graph.nodes) dist[v] = Infinity;",
  "  dist[start] = 0;",
  "  const prev = {};",
  "  const settled = new Set();",
  "  while (settled.size < graph.nodes.length) {",
  "    const u = nearestUnsettled(dist, settled);",
  "    if (u === null || dist[u] === Infinity) break;",
  "    settled.add(u);",
  "    if (u === goal) break;",
  "    for (const [v, w] of graph.edges[u]) {",
  "      if (settled.has(v)) continue;",
  "      const alt = dist[u] + w;",
  "      if (alt < dist[v]) {",
  "        dist[v] = alt; prev[v] = u;   // relax edge",
  "      }",
  "    }",
  "  }",
  "  return reconstruct(prev, goal);",
  "}",
];

// fixed layout (x: 0..100, y: 0..60)
const LAYOUT: Record<string, [number, number]> = {
  A: [10, 30],
  B: [38, 10],
  C: [38, 50],
  D: [66, 12],
  E: [70, 48],
  F: [94, 30],
};

// undirected weighted edges
const EDGES: [string, string, number][] = [
  ["A", "B", 4],
  ["A", "C", 2],
  ["C", "B", 1],
  ["B", "D", 5],
  ["C", "D", 8],
  ["C", "E", 10],
  ["D", "E", 2],
  ["D", "F", 6],
  ["E", "F", 3],
];

// adjacency built from the undirected edge list: node -> [neighbour, weight][]
const ADJ: Record<string, [string, number][]> = {};
Object.keys(LAYOUT).forEach((id) => (ADJ[id] = []));
EDGES.forEach(([a, b, w]) => {
  ADJ[a].push([b, w]);
  ADJ[b].push([a, w]);
});

function run(): Step[] {
  const steps: Step[] = [];
  const state: Record<string, NodeState> = {};
  Object.keys(LAYOUT).forEach((id) => (state[id] = "idle"));

  const dist: Record<string, number> = {};
  Object.keys(LAYOUT).forEach((id) => (dist[id] = Infinity));
  const prev: Record<string, string> = {};
  const settled = new Set<string>();

  // edge keys currently being "considered" while relaxing the active node
  let considering = new Set<string>();
  // tree edges (predecessor relationships) as "child" node ids
  const pathEdges = new Set<string>(); // final A->F edges as "a|b" (sorted)

  const edgeKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

  const badgeOf = (id: string): string => (dist[id] === Infinity ? "∞" : String(dist[id]));

  const snap = (line: number | number[], explain: string, current?: string): void => {
    const nodes: GraphNode[] = Object.entries(LAYOUT).map(([id, [x, y]]) => ({
      id,
      x,
      y,
      state: id === current ? "current" : state[id],
      badge: badgeOf(id),
    }));
    const edges: GraphEdge[] = EDGES.map(([from, to, w]) => {
      const key = edgeKey(from, to);
      let est: GraphEdge["state"] = "idle";
      if (pathEdges.has(key)) est = "path";
      else if (prev[to] === from || prev[from] === to) est = "tree";
      else if (considering.has(key)) est = "considered";
      return { from, to, weight: w, state: est };
    });
    const gs: GraphState = { nodes, edges };
    steps.push({ line, explain, state: gs });
  };

  const start = "A";
  const goal = "F";

  steps.push({
    line: 0,
    explain: "Find the shortest weighted path from A to F by always settling the closest unsettled node first.",
    state: {
      nodes: Object.entries(LAYOUT).map(([id, [x, y]]) => ({ id, x, y, state: state[id], badge: "∞" })),
      edges: EDGES.map(([from, to, w]) => ({ from, to, weight: w, state: "idle" as const })),
    },
  });

  snap(1, "Set every tentative distance to ∞ — no node is reachable yet.");
  dist[start] = 0;
  state[start] = "frontier";
  snap(2, "The start A is 0 away from itself; mark it reached (frontier).");
  snap(3, "prev{} will remember which neighbour each node was relaxed from, to rebuild the path.");
  snap(4, "settled is the set of nodes whose final shortest distance is locked in — empty for now.");

  let guard = 0;
  while (settled.size < Object.keys(LAYOUT).length && guard < 30) {
    guard++;
    snap(5, `${settled.size} of 6 nodes settled — keep going while unsettled nodes remain.`);

    // nearestUnsettled
    let u: string | null = null;
    let best = Infinity;
    Object.keys(LAYOUT).forEach((id) => {
      if (!settled.has(id) && dist[id] < best) {
        best = dist[id];
        u = id;
      }
    });
    if (u === null) {
      snap(7, "No unsettled node has a finite distance left.");
      break;
    }
    const node = u as string;
    snap(6, `Pick ${node} — the unsettled node with the smallest tentative distance (${badgeOf(node)}).`);

    if (dist[node] === Infinity) {
      snap(7, `${node} is unreachable (distance ∞) — nothing left to settle.`);
      break;
    }
    snap(7, `${node} has a finite distance ${dist[node]}, so it is reachable — proceed.`);

    settled.add(node);
    state[node] = "visited";
    snap([8], `Settle ${node}: its distance ${dist[node]} is now final and cannot improve.`, undefined);

    if (node === goal) {
      snap(9, `${node} is the goal — its shortest distance ${dist[node]} is locked, so stop early.`);
      break;
    }
    snap(9, `${node} is not the goal yet, so relax its outgoing edges.`);

    for (const [v, w] of ADJ[node]) {
      considering = new Set<string>([edgeKey(node, v)]);
      snap(10, `Consider the edge ${node}–${v} (weight ${w}).`, node);

      if (settled.has(v)) {
        snap(11, `${v} is already settled — its distance is final, so skip this edge.`, node);
        continue;
      }

      const alt = dist[node] + w;
      snap(12, `A path through ${node} reaches ${v} in ${dist[node]} + ${w} = ${alt}.`, node);

      const oldStr = badgeOf(v);
      if (alt < dist[v]) {
        snap(13, `${alt} beats ${v}'s current best ${oldStr} — this is an improvement.`, node);
        dist[v] = alt;
        prev[v] = node;
        if (state[v] === "idle") state[v] = "frontier";
        snap(14, `Relax: lower ${v}'s distance to ${alt} and record ${node} as its predecessor.`, node);
      } else {
        snap(13, `${alt} is not better than ${v}'s current best ${oldStr} — leave ${v} unchanged.`, node);
      }
    }
    considering = new Set<string>();
  }

  // mark the goal/path
  snap(5, "Every node is settled (or the goal was reached) — the main loop is done.");

  // reconstruct A -> F
  const pathNodes: string[] = [];
  let cur: string | undefined = goal;
  while (cur !== undefined) {
    pathNodes.unshift(cur);
    cur = prev[cur];
  }
  for (let i = 0; i + 1 < pathNodes.length; i++) {
    pathEdges.add(edgeKey(pathNodes[i], pathNodes[i + 1]));
  }
  pathNodes.forEach((id) => (state[id] = "path"));

  snap(
    18,
    `Walk predecessors back from F to A: shortest path is ${pathNodes.join(" → ")} with total distance ${dist[goal]}.`,
  );
  snap(19, `Done — the cheapest route from A to F costs ${dist[goal]}.`);

  return steps;
}

export const dijkstra: Algorithm = {
  id: "dijkstra",
  name: "Dijkstra's Shortest Path",
  category: "Graph",
  blurb: "Greedily settle the nearest unsettled node, relaxing its edges to improve tentative distances.",
  complexity: "O(E log V)",
  renderKind: "graph",
  code,
  run,
};
