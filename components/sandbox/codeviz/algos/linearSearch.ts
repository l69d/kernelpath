import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function linearSearch(a, target) {",
  "  for (let i = 0; i < a.length; i++) {",
  "    if (a[i] === target) {",
  "      return i; // found",
  "    }",
  "  }",
  "  return -1; // not found",
  "}",
];

function run(): Step[] {
  const a = [4, 9, 2, 7, 5, 1, 8];
  const target = 7;
  const steps: Step[] = [];
  const n = a.length;
  const done = new Set<number>();

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    i: number,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers: [{ name: "i", index: i, color: "#39c5e0" }],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain: `Goal: scan left to right for target = ${target}, returning the first matching index.`,
    state: { array: [...a], done: [] },
  });

  let found = -1;
  for (let i = 0; i < n; i++) {
    snap(1, `Advance the pointer to index ${i} and check it is still inside the array.`, [], i);
    snap(
      2,
      `Compare a[${i}] = ${a[i]} against the target ${target}.`,
      [i],
      i,
    );
    if (a[i] === target) {
      found = i;
      done.add(i);
      snap(3, `Match! a[${i}] equals ${target}, so return index ${i} — found at index ${i}.`, [i], i);
      break;
    }
  }

  if (found === -1) {
    steps.push({
      line: 6,
      explain: `Reached the end of the array without a match — target ${target} is not present, so return -1.`,
      state: { array: [...a], done: [] },
    });
  }

  return steps;
}

export const linearSearch: Algorithm = {
  id: "linear-search",
  name: "Linear Search",
  category: "Searching",
  blurb: "Walk the array left to right until the target is found.",
  complexity: "O(n)",
  renderKind: "array",
  code,
  run,
};
