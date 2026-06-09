import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function selectionSort(a) {",
  "  for (let i = 0; i < a.length - 1; i++) {",
  "    let min = i;",
  "    for (let j = i + 1; j < a.length; j++) {",
  "      if (a[j] < a[min]) {",
  "        min = j; // found a smaller value",
  "      }",
  "    }",
  "    [a[i], a[min]] = [a[min], a[i]]; // swap min into place",
  "    // the i-th smallest value is now locked at index i",
  "  }",
  "  return a;",
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
    i: number,
    j: number,
    min: number,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers: [
        { name: "i", index: i, color: "#bc8cff" },
        { name: "j", index: j, color: "#39c5e0" },
        { name: "min", index: min, color: "#e3a93c" },
      ],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: sort ascending by selecting the smallest remaining value each pass and moving it to the front.",
    state: { array: [...a], done: [] },
  });

  for (let i = 0; i < n - 1; i++) {
    snap(1, `Pass ${i + 1}: the sorted prefix ends at index ${i - 1}; index ${i} is the next slot to fill.`, [], i, -1, -1);
    let min = i;
    snap(2, `Assume the smallest unsorted value is at the boundary — set min to index ${i} (value ${a[min]}).`, [min], i, -1, min);
    for (let j = i + 1; j < n; j++) {
      snap(3, `Advance the scanner to index ${j} to test the next candidate.`, [min, j], i, j, min);
      snap(4, `Is a[${j}] = ${a[j]} smaller than the current best a[${min}] = ${a[min]}?`, [min, j], i, j, min);
      if (a[j] < a[min]) {
        min = j;
        snap(5, `Yes — index ${j} (value ${a[j]}) becomes the new smallest, so update min.`, [min, j], i, j, min);
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      snap(8, `Scan done — swap the smallest value into the boundary index ${i}.`, [i, min], i, -1, i);
    } else {
      snap(8, `Scan done — the smallest value was already at index ${i}, so the swap leaves it in place.`, [i], i, -1, i);
    }
    done.add(i);
    snap(9, `Index ${i} is now locked — value ${a[i]} is in its final sorted position.`, [], i, -1, i);
  }
  done.add(n - 1);
  steps.push({
    line: 11,
    explain: "Only the last element remains, and it must already be the largest — the array is sorted.",
    state: { array: [...a], done: [...done] },
  });
  return steps;
}

export const selectionSort: Algorithm = {
  id: "selection-sort",
  name: "Selection Sort",
  category: "Sorting",
  blurb: "Repeatedly select the smallest value from the unsorted suffix and swap it to the front.",
  complexity: "O(n²)",
  renderKind: "array",
  code,
  run,
};
