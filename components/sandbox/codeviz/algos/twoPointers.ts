import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function twoSumSorted(a, target) {",
  "  let lo = 0;",
  "  let hi = a.length - 1;",
  "  while (lo < hi) {",
  "    const sum = a[lo] + a[hi];",
  "    if (sum === target) {",
  "      return [lo, hi]; // found the pair",
  "    } else if (sum < target) {",
  "      lo++; // need a bigger sum, move left pointer up",
  "    } else {",
  "      hi--; // need a smaller sum, move right pointer down",
  "    }",
  "  }",
  "  return null; // no pair sums to target",
  "}",
];

function run(): Step[] {
  const a = [1, 3, 4, 6, 8, 11, 15];
  const target = 15;
  const steps: Step[] = [];
  const done = new Set<number>();

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    lo: number,
    hi: number,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers: [
        { name: "lo", index: lo, color: "#39c5e0" },
        { name: "hi", index: hi, color: "#bc8cff" },
      ],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain: `Goal: in the sorted array, find two values that sum to target = ${target}.`,
    state: { array: [...a], done: [] },
  });

  let lo = 0;
  snap(1, "Start the left pointer lo at the smallest value, index 0.", [], lo, a.length - 1);

  let hi = a.length - 1;
  snap(2, `Start the right pointer hi at the largest value, index ${hi}.`, [], lo, hi);

  while (lo < hi) {
    snap(3, `lo (${lo}) is still left of hi (${hi}), so a pair is still possible.`, [], lo, hi);

    const sum = a[lo] + a[hi];
    snap(
      4,
      `sum = a[${lo}] + a[${hi}] = ${a[lo]} + ${a[hi]} = ${sum}.`,
      [lo, hi],
      lo,
      hi,
    );

    if (sum === target) {
      snap(5, `Compare sum ${sum} with target ${target}: they match.`, [lo, hi], lo, hi);
      done.add(lo);
      done.add(hi);
      snap(
        6,
        `Found it — values ${a[lo]} and ${a[hi]} at indices ${lo} and ${hi} sum to ${target}.`,
        [lo, hi],
        lo,
        hi,
      );
      return steps;
    } else if (sum < target) {
      snap(
        7,
        `Compare sum ${sum} with target ${target}: sum is too small.`,
        [lo, hi],
        lo,
        hi,
      );
      lo++;
      snap(
        8,
        `To get a bigger sum, move lo right to index ${lo} (a larger value).`,
        [],
        lo,
        hi,
      );
    } else {
      snap(
        9,
        `Compare sum ${sum} with target ${target}: sum is too big.`,
        [lo, hi],
        lo,
        hi,
      );
      hi--;
      snap(
        10,
        `To get a smaller sum, move hi left to index ${hi} (a smaller value).`,
        [],
        lo,
        hi,
      );
    }
  }

  steps.push({
    line: 13,
    explain: "The pointers crossed without a match — no pair sums to the target.",
    state: { array: [...a], done: [] },
  });
  return steps;
}

export const twoPointers: Algorithm = {
  id: "two-pointers",
  name: "Two Pointers",
  category: "Array",
  blurb:
    "On a sorted array, converge two pointers inward to find a pair summing to a target.",
  complexity: "O(n)",
  renderKind: "array",
  code,
  run,
};
