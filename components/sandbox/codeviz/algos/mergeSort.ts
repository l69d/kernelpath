import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function mergeSort(a, lo, hi) {",
  "  if (lo >= hi) return;          // a single element is already sorted",
  "  const mid = (lo + hi) >> 1;    // split point",
  "  mergeSort(a, lo, mid);         // sort the left half",
  "  mergeSort(a, mid + 1, hi);     // sort the right half",
  "  merge(a, lo, mid, hi);         // merge the two sorted halves",
  "}",
  "",
  "function merge(a, lo, mid, hi) {",
  "  const left = a.slice(lo, mid + 1);",
  "  const right = a.slice(mid + 1, hi + 1);",
  "  let i = 0, j = 0, k = lo;",
  "  while (i < left.length && j < right.length) {",
  "    if (left[i] <= right[j]) a[k++] = left[i++];",
  "    else a[k++] = right[j++];",
  "  }",
  "  while (i < left.length) a[k++] = left[i++];",
  "  while (j < right.length) a[k++] = right[j++];",
  "}",
];

function run(): Step[] {
  const a = [5, 2, 9, 1, 6, 3, 8, 4];
  const steps: Step[] = [];
  const n = a.length;

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    win: [number, number] | undefined,
    marks: Record<number, string>,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      marks: { ...marks },
    };
    if (win) state.window = win;
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: sort ascending by splitting the array in half until single elements remain, then merging sorted halves.",
    state: { array: [...a], done: [] },
  });

  const merge = (lo: number, mid: number, hi: number): void => {
    const win: [number, number] = [lo, hi];
    const marks: Record<number, string> = {};

    snap(
      8,
      `Merge the sorted halves [${lo}..${mid}] and [${mid + 1}..${hi}] back into one sorted run.`,
      [],
      win,
      marks,
    );

    const left = a.slice(lo, mid + 1);
    snap(
      9,
      `Copy the left half ${JSON.stringify(left)} into a scratch buffer.`,
      [],
      win,
      marks,
    );

    const right = a.slice(mid + 1, hi + 1);
    snap(
      10,
      `Copy the right half ${JSON.stringify(right)} into a scratch buffer.`,
      [],
      win,
      marks,
    );

    let i = 0;
    let j = 0;
    let k = lo;
    snap(
      11,
      `Start three cursors: i and j read the two halves, k writes back from index ${lo}.`,
      [],
      win,
      marks,
    );

    while (i < left.length && j < right.length) {
      const li = lo + i;
      const rj = mid + 1 + j;
      snap(
        12,
        `Both halves still have values — compare fronts a[${li}] = ${left[i]} and a[${rj}] = ${right[j]}.`,
        [li, rj],
        win,
        marks,
      );
      if ((left[i] as number) <= (right[j] as number)) {
        a[k] = left[i] as number;
        marks[k] = "#39c5e0";
        snap(
          13,
          `Left value ${left[i]} is smaller (or equal), so write it into index ${k}.`,
          [k],
          win,
          marks,
        );
        i++;
        k++;
      } else {
        a[k] = right[j] as number;
        marks[k] = "#39c5e0";
        snap(
          14,
          `Right value ${right[j]} is smaller, so write it into index ${k}.`,
          [k],
          win,
          marks,
        );
        j++;
        k++;
      }
    }

    while (i < left.length) {
      a[k] = left[i] as number;
      marks[k] = "#39c5e0";
      snap(
        16,
        `Right half is exhausted — copy leftover left value ${left[i]} into index ${k}.`,
        [k],
        win,
        marks,
      );
      i++;
      k++;
    }

    while (j < right.length) {
      a[k] = right[j] as number;
      marks[k] = "#39c5e0";
      snap(
        17,
        `Left half is exhausted — copy leftover right value ${right[j]} into index ${k}.`,
        [k],
        win,
        marks,
      );
      j++;
      k++;
    }
  };

  const mergeSortRec = (lo: number, hi: number): void => {
    if (lo >= hi) {
      snap(
        1,
        `Range [${lo}..${hi}] holds one element — it is already sorted, so return.`,
        [lo],
        [lo, hi],
        {},
      );
      return;
    }
    const mid = (lo + hi) >> 1;
    snap(
      2,
      `Split range [${lo}..${hi}] at midpoint ${mid} into left [${lo}..${mid}] and right [${mid + 1}..${hi}].`,
      [mid],
      [lo, hi],
      {},
    );

    snap(3, `Recurse into the left half [${lo}..${mid}].`, [], [lo, mid], {});
    mergeSortRec(lo, mid);

    snap(
      4,
      `Recurse into the right half [${mid + 1}..${hi}].`,
      [],
      [mid + 1, hi],
      {},
    );
    mergeSortRec(mid + 1, hi);

    snap(
      5,
      `Both halves of [${lo}..${hi}] are sorted — merge them together.`,
      [],
      [lo, hi],
      {},
    );
    merge(lo, mid, hi);
  };

  mergeSortRec(0, n - 1);

  steps.push({
    line: 6,
    explain: "Every range has been merged — the whole array is now sorted.",
    state: {
      array: [...a],
      done: Array.from({ length: n }, (_, idx) => idx),
    },
  });

  return steps;
}

export const mergeSort: Algorithm = {
  id: "merge-sort",
  name: "Merge Sort",
  category: "Sorting",
  blurb:
    "Divide the array in half recursively, then merge the sorted halves back together.",
  complexity: "O(n log n)",
  renderKind: "array",
  code,
  run,
};
