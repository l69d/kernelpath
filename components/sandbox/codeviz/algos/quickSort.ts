import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function quickSort(a, lo = 0, hi = a.length - 1) {",
  "  if (lo >= hi) return;            // 0 or 1 element: already sorted",
  "  const pivot = a[hi];             // Lomuto: pivot is the last element",
  "  let i = lo;                      // boundary of the < pivot region",
  "  for (let j = lo; j < hi; j++) {  // scan the window with j",
  "    if (a[j] < pivot) {            // smaller than pivot?",
  "      [a[i], a[j]] = [a[j], a[i]]; // swap it into the left region",
  "      i++;                         // grow the boundary",
  "    }",
  "  }",
  "  [a[i], a[hi]] = [a[hi], a[i]];   // put pivot at its final spot i",
  "  quickSort(a, lo, i - 1);         // recurse on the left side",
  "  quickSort(a, i + 1, hi);         // recurse on the right side",
  "}",
];

function run(): Step[] {
  const a = [5, 2, 9, 1, 6, 3, 8, 4];
  const steps: Step[] = [];
  const done = new Set<number>();

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    window: [number, number] | undefined,
    pivot: number,
    i: number,
    j: number,
  ): void => {
    const pointers = [
      { name: "pivot", index: pivot, color: "#bc8cff" },
      { name: "i", index: i, color: "#e3a93c" },
      { name: "j", index: j, color: "#39c5e0" },
    ];
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers,
    };
    if (window) state.window = window;
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: sort ascending by partitioning around a pivot, then recursing on each side.",
    state: { array: [...a], done: [] },
  });

  const quickSort = (lo: number, hi: number): void => {
    if (lo > hi) return;

    if (lo >= hi) {
      if (lo === hi) {
        done.add(lo);
        snap(
          1,
          `Range [${lo}, ${hi}] has a single element a[${lo}] = ${a[lo]} — it is already in place.`,
          [lo],
          [lo, hi],
          -1,
          -1,
          -1,
        );
      }
      return;
    }

    snap(
      1,
      `Range [${lo}, ${hi}] has more than one element, so there is work to do.`,
      [],
      [lo, hi],
      hi,
      -1,
      -1,
    );

    const pivot = a[hi] as number;
    snap(
      2,
      `Pick the pivot: the last element a[${hi}] = ${pivot}.`,
      [hi],
      [lo, hi],
      hi,
      -1,
      -1,
    );

    let i = lo;
    snap(
      3,
      `Start the boundary i at ${lo}; everything left of i will be smaller than the pivot.`,
      [],
      [lo, hi],
      hi,
      i,
      -1,
    );

    for (let j = lo; j < hi; j++) {
      snap(
        4,
        `Scanner j = ${j}: inspect a[${j}] = ${a[j]}.`,
        [j, hi],
        [lo, hi],
        hi,
        i,
        j,
      );
      snap(
        5,
        `Is a[${j}] = ${a[j]} smaller than the pivot ${pivot}?`,
        [j, hi],
        [lo, hi],
        hi,
        i,
        j,
      );
      if ((a[j] as number) < pivot) {
        const tmp = a[i] as number;
        a[i] = a[j] as number;
        a[j] = tmp;
        snap(
          6,
          `Yes — swap a[${i}] and a[${j}] so the smaller value joins the left region.`,
          [i, j],
          [lo, hi],
          hi,
          i,
          j,
        );
        i++;
        snap(
          7,
          `Advance the boundary to i = ${i}; the smaller-than-pivot region just grew by one.`,
          [],
          [lo, hi],
          hi,
          i,
          j,
        );
      }
    }

    const tmp = a[i] as number;
    a[i] = a[hi] as number;
    a[hi] = tmp;
    done.add(i);
    snap(
      10,
      `Swap the pivot into slot ${i} — value ${a[i]} is now in its final sorted position.`,
      [i],
      [lo, hi],
      i,
      i,
      -1,
    );

    snap(
      11,
      `Recurse on the left side, range [${lo}, ${i - 1}] — values smaller than the pivot.`,
      [],
      i - 1 >= lo ? [lo, i - 1] : undefined,
      i,
      -1,
      -1,
    );
    quickSort(lo, i - 1);

    snap(
      12,
      `Recurse on the right side, range [${i + 1}, ${hi}] — values larger than the pivot.`,
      [],
      i + 1 <= hi ? [i + 1, hi] : undefined,
      i,
      -1,
      -1,
    );
    quickSort(i + 1, hi);
  };

  quickSort(0, a.length - 1);

  for (let k = 0; k < a.length; k++) done.add(k);
  steps.push({
    line: 13,
    explain: "Every partition has resolved — the whole array is sorted.",
    state: { array: [...a], done: [...done] },
  });

  return steps;
}

export const quickSort: Algorithm = {
  id: "quick-sort",
  name: "Quicksort",
  category: "Sorting",
  blurb:
    "Partition around a pivot so smaller values go left and larger go right, then recurse on each side.",
  complexity: "O(n log n) avg",
  renderKind: "array",
  code,
  run,
};
