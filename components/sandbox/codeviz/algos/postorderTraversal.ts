import type { Algorithm, NodeState, Step, TreeState } from "../types";

const code = [
  "function postorder(node) {",
  "  if (node === null) return;",
  "  postorder(node.left);   // 1. finish the left subtree",
  "  postorder(node.right);  // 2. finish the right subtree",
  "  visit(node.value);      // 3. node LAST, after both children",
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

// the SAME small balanced BST and coordinates as inorderTraversal.ts
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

  snap(
    0,
    "Post-order traversal: left subtree, then right subtree, then the node LAST. It's the order you use to free a tree or evaluate an expression."
  );

  const walk = (node: TNode | undefined, side: string): void => {
    if (!node) {
      snap(1, `${side} child is null — there is nothing below to finish first, so return.`);
      return;
    }
    status[node.id] = "frontier";
    snap(0, `Enter postorder(${node.value}).`, node.id);
    snap(1, `${node.value} is not null, so we must finish its children before we touch it.`, node.id);
    snap(2, `Recurse left first: fully process the subtree below the left of ${node.value}.`, node.id);
    walk(node.left, "left");
    snap(3, `Left is done. Now recurse right: fully process the subtree below the right of ${node.value}.`, node.id);
    walk(node.right, "right");
    status[node.id] = "visited";
    output.push(node.value);
    snap(
      4,
      `Both children are finished, so it is finally safe to visit ${node.value} — like freeing a parent only after its kids are gone. Output so far: [${output.join(", ")}].`,
      node.id
    );
  };

  walk(T, "root");
  snap(
    5,
    `Done. The root is visited last. Post-order output: [${output.join(", ")}] — every child appears before its parent.`
  );
  return steps;
}

export const postorderTraversal: Algorithm = {
  id: "postorder-traversal",
  name: "Post-order Traversal",
  category: "Tree",
  blurb:
    "Left subtree, then right, then the node last — the order you'd use to delete or evaluate a tree.",
  complexity: "O(n)",
  renderKind: "tree",
  code,
  run,
};
