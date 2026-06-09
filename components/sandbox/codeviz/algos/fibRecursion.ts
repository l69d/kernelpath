import type { Algorithm, NodeState, StackFrame, StackState, Step } from "../types";

const code = [
  "function fib(n) {",
  "  if (n <= 1) return n;            // base case",
  "  return fib(n - 1) + fib(n - 2); // two recursive calls",
  "}",
];

interface RNode {
  id: string;
  n: number;
  depth: number;
  order: number;
  children: RNode[];
  value?: number;
}

const ROOT_N = 5;

function buildTree(): { all: RNode[]; edges: { from: string; to: string }[]; width: number } {
  let idc = 0;
  const build = (n: number, depth: number): RNode => {
    const node: RNode = { id: `f${idc++}`, n, depth, order: 0, children: [] };
    if (n > 1) {
      node.children.push(build(n - 1, depth + 1));
      node.children.push(build(n - 2, depth + 1));
    }
    return node;
  };
  const root = build(ROOT_N, 0);

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

  const nodeState = (id: string): NodeState => {
    if (returned.has(id)) return "visited";
    if (stack.length && stack[stack.length - 1].id === id) return "current";
    if (stack.some((s) => s.id === id)) return "frontier";
    return "idle";
  };

  const snap = (line: number | number[], explain: string): void => {
    const frames: StackFrame[] = stack.map((nd, i) => ({
      label: `fib(${nd.n})`,
      detail: `n=${nd.n}`,
      state: i === stack.length - 1 ? "active" : "waiting",
    }));
    const state: StackState = {
      frames,
      tree: {
        nodes: all.map((nd) => ({
          id: nd.id,
          label: nd.value !== undefined ? String(nd.value) : String(nd.n),
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

  const evalNode = (node: RNode): number => {
    stack.push(node);
    snap(0, `Call fib(${node.n}). A new frame is pushed onto the call stack.`);
    snap(1, `Base-case check: is n = ${node.n} ≤ 1?`);
    if (node.n <= 1) {
      node.value = node.n;
      snap(1, `Yes — return ${node.n} straight away (no more recursion).`);
      returned.add(node.id);
      stack.pop();
      return node.n;
    }
    snap(2, `No — so the answer is fib(${node.n - 1}) + fib(${node.n - 2}). Evaluate the left call first.`);
    const left = evalNode(node.children[0]);
    snap(2, `Back in fib(${node.n}): the left call gave ${left}. Now evaluate fib(${node.n - 2}).`);
    const right = evalNode(node.children[1]);
    node.value = left + right;
    snap(2, `fib(${node.n}) = ${left} + ${right} = ${node.value}. Return it and pop the frame.`);
    returned.add(node.id);
    stack.pop();
    return node.value;
  };

  snap(0, `Compute fib(${ROOT_N}) by naive recursion. Watch the call stack grow and shrink, and notice repeated sub-calls.`);
  const result = evalNode(root);
  snap(0, `Finished: fib(${ROOT_N}) = ${result}. Notice how many sub-problems were recomputed — that is why memoisation matters.`);
  return steps;
}

export const fibRecursion: Algorithm = {
  id: "fib-recursion",
  name: "Recursion & the Call Stack",
  category: "Recursion",
  blurb: "Trace naive fib(n): each call pushes a stack frame, and the recursion tree exposes the repeated work.",
  complexity: "O(φⁿ)",
  renderKind: "stack",
  code,
  run,
};
