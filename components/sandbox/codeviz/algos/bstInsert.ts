import type { Algorithm, NodeState, Step, TreeState } from "../types";

const code = [
  "function insert(root, value) {",
  "  if (root === null) return newNode(value);",
  "  if (value < root.value) {",
  "    root.left = insert(root.left, value);",
  "  } else {",
  "    root.right = insert(root.right, value);",
  "  }",
  "  return root;",
  "}",
];

// final coordinates predefined to match inorderTraversal.ts (x:0..100, y:0..60)
const LAYOUT: Record<number, { id: string; x: number; y: number }> = {
  5: { id: "n5", x: 50, y: 10 },
  3: { id: "n3", x: 28, y: 30 },
  8: { id: "n8", x: 72, y: 30 },
  2: { id: "n2", x: 15, y: 50 },
  4: { id: "n4", x: 40, y: 50 },
  7: { id: "n7", x: 60, y: 50 },
  9: { id: "n9", x: 86, y: 50 },
};

const SEQUENCE = [5, 3, 8, 2, 4, 7, 9];

interface TNode {
  id: string;
  value: number;
  x: number;
  y: number;
  left?: TNode;
  right?: TNode;
}

function run(): Step[] {
  const steps: Step[] = [];

  // nodes already inserted, with their persistent visual state
  const present: TNode[] = [];
  const edges: { from: string; to: string }[] = [];
  const status: Record<string, NodeState> = {};

  // logical tree root, built up as we insert
  let root: TNode | undefined;

  const snap = (
    line: number | number[],
    explain: string,
    current?: string,
    frontier?: string
  ): void => {
    const state: TreeState = {
      nodes: present.map((n) => ({
        id: n.id,
        value: n.value,
        x: n.x,
        y: n.y,
        state:
          n.id === current
            ? "current"
            : n.id === frontier
              ? "frontier"
              : status[n.id],
      })),
      edges: edges.map((e) => ({ from: e.from, to: e.to })),
    };
    steps.push({ line, explain, state });
  };

  snap(
    0,
    "Build a binary search tree by inserting 5, 3, 8, 2, 4, 7, 9 one at a time. Each value walks down from the root.",
    undefined,
    undefined
  );

  const makeNode = (value: number): TNode => {
    const pos = LAYOUT[value];
    return { id: pos.id, value, x: pos.x, y: pos.y };
  };

  for (const value of SEQUENCE) {
    snap(
      0,
      `Insert ${value}. Start the walk at the root.`,
      root ? root.id : undefined
    );

    if (!root) {
      // empty tree — value becomes the root
      snap(1, `The tree is empty, so ${value} becomes the root.`);
      const node = makeNode(value);
      root = node;
      status[node.id] = "frontier";
      present.push(node);
      snap(1, `Create the root node holding ${value}.`, undefined, node.id);
      status[node.id] = "idle";
      snap(1, `Return ${value} as the new root. The tree now has one node.`);
      continue;
    }

    // walk down to find the empty slot
    let node: TNode = root;
    let parent: TNode | undefined;
    let goLeft = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      snap(
        1,
        `Node ${node.value} is not null, so compare ${value} against it.`,
        node.id
      );

      if (value < node.value) {
        snap(
          2,
          `${value} < ${node.value}, so go left.`,
          node.id
        );
        if (!node.left) {
          snap(
            3,
            `The left child is empty — ${value} will attach as the left child of ${node.value}.`,
            node.id
          );
          parent = node;
          goLeft = true;
          break;
        }
        snap(
          3,
          `Descend into the left subtree of ${node.value}.`,
          node.id
        );
        node = node.left;
      } else {
        snap(
          4,
          `${value} > ${node.value}, so go right.`,
          node.id
        );
        if (!node.right) {
          snap(
            5,
            `The right child is empty — ${value} will attach as the right child of ${node.value}.`,
            node.id
          );
          parent = node;
          goLeft = false;
          break;
        }
        snap(
          5,
          `Descend into the right subtree of ${node.value}.`,
          node.id
        );
        node = node.right;
      }
    }

    // we found an empty slot under `parent`
    const safeParent = parent as TNode;
    snap(
      1,
      `That child slot is null — this is where ${value} belongs.`,
      safeParent.id
    );

    const fresh = makeNode(value);
    if (goLeft) {
      safeParent.left = fresh;
    } else {
      safeParent.right = fresh;
    }
    status[fresh.id] = "frontier";
    present.push(fresh);
    edges.push({ from: safeParent.id, to: fresh.id });
    snap(
      1,
      `Create node ${value} and link it to its parent ${safeParent.value}.`,
      safeParent.id,
      fresh.id
    );

    status[fresh.id] = "idle";
    snap(
      7,
      `Return back up the path; ${value} is now part of the tree.`,
      undefined
    );
  }

  snap(
    8,
    `All values inserted. The finished BST keeps smaller keys on the left and larger keys on the right.`
  );

  return steps;
}

export const bstInsert: Algorithm = {
  id: "bst-insert",
  name: "BST Insertion",
  category: "Tree",
  complexity: "O(h)",
  renderKind: "tree",
  blurb:
    "Walk down from the root comparing keys, turning left for smaller and right for larger, then attach.",
  code,
  run,
};
