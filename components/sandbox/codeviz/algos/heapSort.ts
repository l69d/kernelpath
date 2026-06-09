import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function heapSort(a) {",
  "  const n = a.length;",
  "  // Phase 1: build a max-heap",
  "  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {",
  "    siftDown(a, i, n);",
  "  }",
  "  // Phase 2: repeatedly extract the max",
  "  for (let end = n - 1; end > 0; end--) {",
  "    [a[0], a[end]] = [a[end], a[0]]; // root -> sorted tail",
  "    siftDown(a, 0, end);",
  "  }",
  "  return a;",
  "}",
  "",
  "function siftDown(a, node, size) {",
  "  while (true) {",
  "    let largest = node;",
  "    const l = 2 * node + 1, r = 2 * node + 2;",
  "    if (l < size && a[l] > a[largest]) largest = l;",
  "    if (r < size && a[r] > a[largest]) largest = r;",
  "    if (largest === node) break; // heap property holds",
  "    [a[node], a[largest]] = [a[largest], a[node]];",
  "    node = largest;",
  "  }",
  "}",
];

function run(): Step[] {
  const a = [5, 2, 9, 1, 6, 3];
  const steps: Step[] = [];
  const n = a.length;
  const done = new Set<number>();

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    node: number,
    child: number,
    heapSize: number,
  ): void => {
    const pointers = [
      { name: "node", index: node, color: "#bc8cff" },
      { name: "child", index: child, color: "#39c5e0" },
    ];
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers,
      window: [0, Math.max(0, heapSize - 1)],
    };
    steps.push({ line, explain, state });
  };

  // siftDown helper that records steps; `size` is the active heap region length.
  const siftDown = (start: number, size: number): void => {
    let node = start;
    snap(
      14,
      `siftDown enters at node ${node}: restore the max-heap rule in the subtree below it.`,
      [node],
      node,
      -1,
      size,
    );
    while (true) {
      let largest = node;
      const l = 2 * node + 1;
      const r = 2 * node + 2;
      snap(
        17,
        `Assume node ${node} = ${a[node]} is largest; compare it with children at indices ${l} and ${r}.`,
        [node],
        node,
        -1,
        size,
      );
      if (l < size && (a[l] as number) > (a[largest] as number)) {
        largest = l;
        snap(18, `Left child a[${l}] = ${a[l]} is bigger, so largest becomes index ${l}.`, [node, l], node, l, size);
      } else {
        snap(18, `Left child is outside the heap or not larger — largest stays at index ${largest}.`, [node, l], node, l < size ? l : -1, size);
      }
      if (r < size && (a[r] as number) > (a[largest] as number)) {
        largest = r;
        snap(19, `Right child a[${r}] = ${a[r]} is bigger still, so largest becomes index ${r}.`, [node, r], node, r, size);
      } else {
        snap(19, `Right child is outside the heap or not larger — largest stays at index ${largest}.`, [node, r], node, r < size ? r : -1, size);
      }
      if (largest === node) {
        snap(20, `Largest is still the parent: the heap property holds here, so sifting stops.`, [node], node, -1, size);
        break;
      }
      const tmp = a[node] as number;
      a[node] = a[largest] as number;
      a[largest] = tmp;
      snap(21, `Swap a[${node}] and a[${largest}] so the bigger value rises; keep sifting from index ${largest}.`, [node, largest], largest, node, size);
      node = largest;
    }
  };

  steps.push({
    line: 0,
    explain: "Goal: sort ascending using a binary max-heap stored inside the array itself.",
    state: { array: [...a], done: [], window: [0, n - 1] },
  });
  steps.push({
    line: 1,
    explain: `The array holds ${n} values; the whole array is the initial heap region.`,
    state: { array: [...a], done: [], window: [0, n - 1] },
  });

  // Phase 1: build max-heap
  steps.push({
    line: 2,
    explain: "Phase 1 — turn the raw array into a max-heap, working from the last parent up.",
    state: { array: [...a], done: [], window: [0, n - 1] },
  });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    snap(3, `Phase 1: take internal node ${i} (the last parents are heapified first).`, [i], i, -1, n);
    snap(4, `Call siftDown on node ${i} to push it down past any larger child.`, [i], i, -1, n);
    siftDown(i, n);
  }

  // Phase 2: repeatedly extract the max
  steps.push({
    line: 6,
    explain: "Phase 2 — the root now holds the maximum; repeatedly move it to the sorted tail.",
    state: { array: [...a], done: [], window: [0, n - 1] },
  });
  for (let end = n - 1; end > 0; end--) {
    snap(7, `Phase 2: the heap occupies indices 0..${end}; its root a[0] = ${a[0]} is the current maximum.`, [0, end], 0, -1, end + 1);
    const tmp0 = a[0] as number;
    a[0] = a[end] as number;
    a[end] = tmp0;
    done.add(end);
    snap(8, `Swap the root into index ${end}: that value is now finalized in the sorted tail.`, [0, end], 0, end, end + 1);
    snap(9, `Re-heapify the shrunken region 0..${end - 1} so the next maximum rises to the root.`, [0], 0, -1, end);
    siftDown(0, end);
  }
  done.add(0);
  steps.push({
    line: 11,
    explain: "The heap is empty — every value has been extracted in order, so the array is sorted.",
    state: { array: [...a], done: [...done], window: [0, 0] },
  });
  return steps;
}

export const heapSort: Algorithm = {
  id: "heap-sort",
  name: "Heap Sort",
  category: "Sorting",
  complexity: "O(n log n)",
  renderKind: "array",
  blurb: "Build a max-heap in the array, then repeatedly swap the root to the end and re-heapify.",
  code,
  run,
};
