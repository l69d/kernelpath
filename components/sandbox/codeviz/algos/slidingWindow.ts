import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function maxWindowSum(a, k) {",
  "  let sum = 0;",
  "  for (let i = 0; i < k; i++) {",
  "    sum += a[i]; // build the first window",
  "  }",
  "  let best = sum, bestStart = 0;",
  "  for (let start = 1; start + k - 1 < a.length; start++) {",
  "    sum -= a[start - 1]; // element leaving on the left",
  "    sum += a[start + k - 1]; // element entering on the right",
  "    if (sum > best) {",
  "      best = sum;",
  "      bestStart = start;",
  "    }",
  "  }",
  "  return best;",
  "}",
];

function run(): Step[] {
  const a = [2, 1, 5, 1, 3, 2, 4, 1];
  const k = 3;
  const steps: Step[] = [];

  let sum = 0;
  let best = 0;
  let bestStart = 0;

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    window: [number, number] | undefined,
    marks?: Record<number, string>,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
    };
    if (window) state.window = window;
    if (marks) state.marks = marks;
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain: `Goal: find the largest sum of any ${k} consecutive elements, sliding a fixed window in O(1) per step.`,
    state: { array: [...a] },
  });

  sum = 0;
  steps.push({
    line: 1,
    explain: "Start the running sum at 0 — it will hold the total of the current window.",
    state: { array: [...a], active: [] },
  });

  for (let i = 0; i < k; i++) {
    snap(2, `Build the first window: include index ${i} (still filling the first ${k} cells).`, [i], [0, Math.max(i, 0)]);
    sum += a[i];
    snap(3, `Add a[${i}] = ${a[i]} to the sum — running total is now ${sum}.`, [i], [0, i]);
  }

  best = sum;
  bestStart = 0;
  snap(
    5,
    `First window [0..${k - 1}] sums to ${sum}. Record it as the best so far (start 0).`,
    [],
    [0, k - 1],
  );

  for (let start = 1; start + k - 1 < a.length; start++) {
    const leaving = start - 1;
    const entering = start + k - 1;

    snap(
      6,
      `Slide the window right by one: new window will cover [${start}..${entering}].`,
      [],
      [start - 1, entering - 1],
    );

    sum -= a[leaving];
    snap(
      7,
      `Subtract the element leaving on the left, a[${leaving}] = ${a[leaving]} — sum drops to ${sum}.`,
      [leaving],
      [start, entering - 1],
    );

    sum += a[entering];
    snap(
      8,
      `Add the element entering on the right, a[${entering}] = ${a[entering]} — sum is now ${sum}.`,
      [entering],
      [start, entering],
    );

    snap(
      9,
      `Is this window's sum ${sum} greater than the best so far, ${best}?`,
      [],
      [start, entering],
    );

    if (sum > best) {
      best = sum;
      snap(
        10,
        `Yes — update best to ${best}, the new maximum window sum.`,
        [],
        [start, entering],
      );
      bestStart = start;
      snap(
        11,
        `Remember where the best window begins: bestStart = ${start}.`,
        [],
        [start, entering],
      );
    }
  }

  const bestEnd = bestStart + k - 1;
  const bestMarks: Record<number, string> = {};
  for (let idx = bestStart; idx <= bestEnd; idx++) bestMarks[idx] = "#3fb950";

  steps.push({
    line: 14,
    explain: `Scan complete. The best window is [${bestStart}..${bestEnd}] with the maximum sum of ${best}.`,
    state: {
      array: [...a],
      window: [bestStart, bestEnd],
      marks: bestMarks,
    },
  });

  return steps;
}

export const slidingWindow: Algorithm = {
  id: "sliding-window",
  name: "Sliding Window",
  category: "Array",
  complexity: "O(n)",
  renderKind: "array",
  blurb: "Slide a fixed-size window across the array, updating a running sum in O(1) per step.",
  code,
  run,
};
