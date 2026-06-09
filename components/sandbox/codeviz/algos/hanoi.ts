import type { Algorithm, NodeState, StackFrame, StackState, Step } from "../types";

const code = [
  "function hanoi(n, from, to, via) {",
  "  if (n === 1) { move(from, to); return; }   // base case",
  "  hanoi(n - 1, from, via, to);                // move n-1 out of the way",
  "  move(from, to);                             // move the big disk",
  "  hanoi(n - 1, via, to, from);                // move n-1 back on top",
  "}",
];

interface RNode {
  id: string;
  n: number;
  from: string;
  to: string;
  via: string;
  depth: number;
  order: number;
  children: RNode[];
}

const ROOT_N = 3;
const ROOT_FROM = "A";
const ROOT_TO = "C";
const ROOT_VIA = "B";

function buildTree(): { all: RNode[]; edges: { from: string; to: string }[]; width: number } {
  let idc = 0;
  const build = (n: number, from: string, to: string, via: string, depth: number): RNode => {
    const node: RNode = { id: `h${idc++}`, n, from, to, via, depth, order: 0, children: [] };
    if (n > 1) {
      node.children.push(build(n - 1, from, via, to, depth + 1));
      node.children.push(build(n - 1, via, to, from, depth + 1));
    }
    return node;
  };
  const root = build(ROOT_N, ROOT_FROM, ROOT_TO, ROOT_VIA, 0);

  let leaf = 0;
  const layout = (node: RNode): number => {
    if (node.children.length === 0) {
      node.order = leaf++;
      return node.order;
    }
    const xs = node.children.map(layout);
    node.order = xs.reduce((a, b) => a + b, 0) / xs.length;
    return node.order;
  };
  layout(root);

  const all: RNode[] = [];
  const edges: { from: string; to: string }[] = [];
  (function collect(nd: RNode) {
    all.push(nd);
    for (const ch of nd.children) {
      edges.push({ from: nd.id, to: ch.id });
      collect(ch);
    }
  })(root);

  return { all, edges, width: leaf };
}

function run(): Step[] {
  const { all, edges, width } = buildTree();
  const root = all[0];
  const steps: Step[] = [];
  const stack: RNode[] = [];
  const returned = new Set<string>();
  let moves = 0;

  const nodeState = (id: string): NodeState => {
    if (returned.has(id)) return "visited";
    if (stack.length && stack[stack.length - 1].id === id) return "current";
    if (stack.some((s) => s.id === id)) return "frontier";
    return "idle";
  };

  const snap = (line: number | number[], explain: string): void => {
    const frames: StackFrame[] = stack.map((nd, i) => ({
      label: `H(${nd.n},${nd.from},${nd.to},${nd.via})`,
      detail: `n=${nd.n}`,
      state: i === stack.length - 1 ? "active" : "waiting",
    }));
    const state: StackState = {
      frames,
      tree: {
        nodes: all.map((nd) => ({
          id: nd.id,
          label: String(nd.n),
          depth: nd.depth,
          order: nd.order,
          state: nodeState(nd.id),
        })),
        edges,
        width,
      },
    };
    steps.push({ line, explain, state });
  };

  const solve = (node: RNode): void => {
    stack.push(node);
    snap(
      0,
      `Call H(${node.n}, ${node.from}→${node.to}, via ${node.via}). A new frame is pushed onto the call stack.`,
    );
    snap(1, `Base-case check: is n = ${node.n} exactly 1?`);
    if (node.n === 1) {
      moves += 1;
      snap(
        1,
        `Yes — move ${moves}: move disk 1 from ${node.from} to ${node.to}. Then return and pop this frame.`,
      );
      returned.add(node.id);
      stack.pop();
      return;
    }
    snap(
      2,
      `No — first recurse to move the top ${node.n - 1} disks from ${node.from} to ${node.via}, using ${node.to} as spare.`,
    );
    solve(node.children[0]);
    moves += 1;
    snap(
      3,
      `Back in H(${node.n}, ${node.from}→${node.to}): move ${moves}: move disk ${node.n} from ${node.from} to ${node.to}.`,
    );
    snap(
      4,
      `Now recurse to move the ${node.n - 1} disks from ${node.via} back onto ${node.to}, using ${node.from} as spare.`,
    );
    solve(node.children[1]);
    snap(
      5,
      `H(${node.n}, ${node.from}→${node.to}) is done — all ${node.n} disks are on ${node.to}. Return and pop the frame.`,
    );
    returned.add(node.id);
    stack.pop();
  };

  snap(
    0,
    `Solve Tower of Hanoi for ${ROOT_N} disks: move them from ${ROOT_FROM} to ${ROOT_TO} using ${ROOT_VIA} as the spare peg. Watch the stack and move counter.`,
  );
  solve(root);
  snap(
    0,
    `Finished: all ${ROOT_N} disks moved from ${ROOT_FROM} to ${ROOT_TO} in ${moves} moves — exactly 2³ − 1 = 7, the minimum possible.`,
  );
  return steps;
}

export const hanoi: Algorithm = {
  id: "tower-of-hanoi",
  name: "Tower of Hanoi",
  category: "Recursion",
  blurb: "Move n disks between pegs by recursively moving n-1 out of the way, moving the big disk, then back.",
  complexity: "O(2ⁿ)",
  renderKind: "stack",
  code,
  run,
};
