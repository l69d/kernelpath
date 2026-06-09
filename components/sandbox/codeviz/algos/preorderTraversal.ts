import type { Algorithm, NodeState, Step, TreeState } from "../types";

const code = [
  "function preorder(node) {",
  "  if (node === null) return;",
  "  visit(node.value);    // 1. this node first",
  "  preorder(node.left);  // 2. then the left subtree",
  "  preorder(node.right); // 3. then the right subtree",
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

  snap(0, "Pre-order traversal: node first, then left subtree, then right — the order you'd use to copy or serialize a tree.");

  const walk = (node: TNode | undefined, side: string): void => {
    if (!node) {
      snap(1, `${side} child is null — nothing to output here, return.`);
      return;
    }
    status[node.id] = "frontier";
    snap(0, `Enter preorder(${node.value}).`, node.id);
    snap(1, `${node.value} is not null, so there is work to do.`, node.id);
    status[node.id] = "visited";
    output.push(node.value);
    snap(2, `Visit ${node.value} BEFORE its subtrees — the root is always emitted first. Output so far: [${output.join(", ")}].`, node.id);
    snap(3, `Now recurse left, into the subtree rooted below ${node.value}.`, node.id);
    walk(node.left, "left");
    snap(4, `Left subtree of ${node.value} is finished; now recurse right.`, node.id);
    walk(node.right, "right");
  };

  walk(T, "root");
  snap(5, `Done. Pre-order output (root before children at every level): [${output.join(", ")}].`);
  return steps;
}

export const preorderTraversal: Algorithm = {
  id: "preorder-traversal",
  name: "Pre-order Traversal",
  category: "Tree",
  blurb: "Node first, then left subtree, then right — the order you'd use to copy or serialize a tree.",
  complexity: "O(n)",
  renderKind: "tree",
  code,
  run,
};
