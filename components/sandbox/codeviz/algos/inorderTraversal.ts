import type { Algorithm, NodeState, Step, TreeState } from "../types";

const code = [
  "function inorder(node) {",
  "  if (node === null) return;",
  "  inorder(node.left);   // 1. all smaller values",
  "  visit(node.value);    // 2. this node",
  "  inorder(node.right);  // 3. all larger values",
  "}",
];

interface TNode {
  id: string;
  value: number;
  x: number;
  y: number;
  left?: TNode;
  right?: TNode;
}

// a small balanced BST laid out by hand (x:0..100, y:0..60)
const T: TNode = {
  id: "n5",
  value: 5,
  x: 50,
  y: 10,
  left: {
    id: "n3",
    value: 3,
    x: 28,
    y: 30,
    left: { id: "n2", value: 2, x: 15, y: 50 },
    right: { id: "n4", value: 4, x: 40, y: 50 },
  },
  right: {
    id: "n8",
    value: 8,
    x: 72,
    y: 30,
    left: { id: "n7", value: 7, x: 60, y: 50 },
    right: { id: "n9", value: 9, x: 86, y: 50 },
  },
};

const ALL: TNode[] = [];
const EDGES: { from: string; to: string }[] = [];
(function collect(node: TNode) {
  ALL.push(node);
  if (node.left) {
    EDGES.push({ from: node.id, to: node.left.id });
    collect(node.left);
  }
  if (node.right) {
    EDGES.push({ from: node.id, to: node.right.id });
    collect(node.right);
  }
})(T);

function run(): Step[] {
  const steps: Step[] = [];
  const status: Record<string, NodeState> = {};
  ALL.forEach((n) => (status[n.id] = "idle"));
  const output: number[] = [];

  const snap = (line: number | number[], explain: string, current?: string): void => {
    const state: TreeState = {
      nodes: ALL.map((n) => ({
        id: n.id,
        value: n.value,
        x: n.x,
        y: n.y,
        state: n.id === current ? "current" : status[n.id],
      })),
      edges: EDGES,
    };
    steps.push({ line, explain, state });
  };

  snap(0, "In-order traversal of a binary search tree. It visits nodes in sorted order.");

  const walk = (node: TNode | undefined, side: string): void => {
    if (!node) {
      snap(1, `${side} child is null — nothing to do here, return.`);
      return;
    }
    status[node.id] = "frontier";
    snap(0, `Enter inorder(${node.value}).`, node.id);
    snap(1, `${node.value} is not null, so recurse.`, node.id);
    snap(2, `First go left, into the subtree with values smaller than ${node.value}.`, node.id);
    walk(node.left, "left");
    status[node.id] = "visited";
    output.push(node.value);
    snap(3, `Visit ${node.value}. Output so far: [${output.join(", ")}].`, node.id);
    snap(4, `Now go right, into the subtree with values larger than ${node.value}.`, node.id);
    walk(node.right, "right");
  };

  walk(T, "root");
  snap(5, `Done. In-order output is fully sorted: [${output.join(", ")}].`);
  return steps;
}

export const inorderTraversal: Algorithm = {
  id: "inorder-traversal",
  name: "In-order Traversal",
  category: "Tree",
  blurb: "Left → node → right. On a binary search tree this emits the values in sorted order.",
  complexity: "O(n)",
  renderKind: "tree",
  code,
  run,
};
