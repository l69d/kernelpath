import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function bubbleSort(a) {",
  "  for (let i = 0; i < a.length - 1; i++) {",
  "    for (let j = 0; j < a.length - 1 - i; j++) {",
  "      if (a[j] > a[j + 1]) {",
  "        [a[j], a[j + 1]] = [a[j + 1], a[j]]; // swap",
  "      }",
  "    }",
  "    // largest unsorted value has bubbled to the end",
  "  }",
  "  return a;",
  "}",
];

function run(): Step[] {
  const a = [5, 2, 8, 1, 9, 3];
  const steps: Step[] = [];
  const n = a.length;
  const done = new Set<number>();

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    i: number,
    j: number,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers: [
        { name: "i", index: i, color: "#bc8cff" },
        { name: "j", index: j, color: "#39c5e0" },
      ],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: sort ascending by repeatedly swapping adjacent out-of-order pairs.",
    state: { array: [...a], done: [] },
  });

  for (let i = 0; i < n - 1; i++) {
    snap(1, `Pass ${i + 1}: scan the unsorted region and push its largest value right.`, [], i, -1);
    for (let j = 0; j < n - 1 - i; j++) {
      snap(2, `Look at the adjacent pair at indices ${j} and ${j + 1}.`, [j, j + 1], i, j);
      snap(3, `Is a[${j}] = ${a[j]} greater than a[${j + 1}] = ${a[j + 1]}?`, [j, j + 1], i, j);
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        snap(4, `Yes — swap, so the larger value moves one step right.`, [j, j + 1], i, j);
      }
    }
    done.add(n - 1 - i);
    snap(7, `Index ${n - 1 - i} is now locked — the pass settled the largest value there.`, [], i, -1);
  }
  done.add(0);
  steps.push({
    line: 9,
    explain: "No more swaps possible — every element is in place. Sorted.",
    state: { array: [...a], done: [...done] },
  });
  return steps;
}

export const bubbleSort: Algorithm = {
  id: "bubble-sort",
  name: "Bubble Sort",
  category: "Sorting",
  blurb: "Swap adjacent out-of-order pairs; the largest value bubbles to the end each pass.",
  complexity: "O(n²)",
  renderKind: "array",
  code,
  run,
};
