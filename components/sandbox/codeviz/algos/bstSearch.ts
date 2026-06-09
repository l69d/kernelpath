import type { Algorithm, NodeState, Step, TreeState } from "../types";

const code = [
  "function search(node, target) {",
  "  while (node !== null) {",
  "    if (target === node.value) return node;  // found it",
  "    if (target < node.value) node = node.left;   // go smaller",
  "    else node = node.right;                       // go larger",
  "  }",
  "  return null;  // fell off the tree — not present",
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

// the same balanced BST as the in-order module (x:0..100, y:0..60)
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

const TARGET = 7;

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
    `Search a binary search tree for ${TARGET}. Each comparison tells us which way to go and lets us discard an entire subtree.`,
  );

  let node: TNode | undefined = T;

  while (node) {
    snap(1, `node is ${node.value}, which is not null — there is still tree left to examine.`, node.id);

    if (TARGET === node.value) {
      snap(2, `Compare: target ${TARGET} equals node ${node.value}. Match found — return this node.`, node.id);
      status[node.id] = "path";
      snap(2, `Found ${TARGET}. We reached it in just a few comparisons because each step skipped half the tree — that is O(h).`, node.id);
      return steps;
    }

    if (TARGET < node.value) {
      snap(
        3,
        `Compare: target ${TARGET} is less than node ${node.value}. The answer can only be in the smaller-valued left subtree, so discard the right subtree and go left.`,
        node.id,
      );
      status[node.id] = "visited";
      node = node.left;
    } else {
      snap(
        4,
        `Compare: target ${TARGET} is greater than node ${node.value}. The answer can only be in the larger-valued right subtree, so discard the left subtree and go right.`,
        node.id,
      );
      status[node.id] = "visited";
      node = node.right;
    }
  }

  snap(6, `node is null — we walked off the bottom of the tree without a match, so ${TARGET} is not present. Return null.`);
  return steps;
}

export const bstSearch: Algorithm = {
  id: "bst-search",
  name: "BST Search",
  category: "Tree",
  blurb: "Search a binary search tree by comparing at each node and descending into one subtree.",
  complexity: "O(h)",
  renderKind: "tree",
  code,
  run,
};
