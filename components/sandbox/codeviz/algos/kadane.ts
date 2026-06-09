import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function kadane(a) {",
  "  let cur = a[0];",
  "  let best = a[0];",
  "  let curStart = 0, bestStart = 0, bestEnd = 0;",
  "  for (let i = 1; i < a.length; i++) {",
  "    if (cur < 0) {",
  "      cur = a[i];",
  "      curStart = i;",
  "    } else {",
  "      cur += a[i];",
  "    }",
  "    if (cur > best) {",
  "      best = cur;",
  "      bestStart = curStart;",
  "      bestEnd = i;",
  "    }",
  "  }",
  "  return best;",
  "}",
];

function run(): Step[] {
  const a = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
  const steps: Step[] = [];
  const n = a.length;

  let cur = a[0];
  let best = a[0];
  let curStart = 0;
  let bestStart = 0;
  let bestEnd = 0;

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    i: number,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      window: [curStart, i < 0 ? curStart : i],
      marks: { [bestStart]: "#3fb950", [bestEnd]: "#3fb950" },
      pointers: [{ name: "i", index: i, color: "#39c5e0" }],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: find the contiguous subarray with the largest sum in a single left-to-right pass.",
    state: { array: [...a], window: [0, 0] },
  });

  snap(
    1,
    `Seed the running sum cur with the first element: cur = a[0] = ${a[0]}.`,
    [0],
    0,
  );
  snap(
    2,
    `Seed the best sum found so far with the first element too: best = ${best}.`,
    [0],
    0,
  );
  snap(
    3,
    `Anchor all start/end markers at index 0 — the best subarray so far is just [0,0].`,
    [0],
    0,
  );

  for (let i = 1; i < n; i++) {
    snap(
      4,
      `Advance i to index ${i} (value ${a[i]}); extend or restart the run here.`,
      [i],
      i,
    );
    snap(
      5,
      `Check the running sum: is cur = ${cur} negative? A negative prefix only drags ${a[i]} down.`,
      [i],
      i,
    );
    if (cur < 0) {
      cur = a[i];
      snap(
        6,
        `cur was negative — throw it away and restart the run at a[${i}] = ${a[i]}, so cur = ${cur}.`,
        [i],
        i,
      );
      curStart = i;
      snap(
        7,
        `Mark the current run as beginning at index ${i}: curStart = ${curStart}.`,
        [i],
        i,
      );
    } else {
      cur += a[i];
      snap(
        9,
        `cur was non-negative — extend the run by adding a[${i}] = ${a[i]}, so cur = ${cur}.`,
        [i],
        i,
      );
    }
    snap(
      11,
      `Is this run's sum cur = ${cur} better than best = ${best}?`,
      [i],
      i,
    );
    if (cur > best) {
      best = cur;
      snap(
        12,
        `Yes — record a new best subarray sum: best = ${best}.`,
        [i],
        i,
      );
      bestStart = curStart;
      snap(
        13,
        `Remember where this winning run starts: bestStart = ${bestStart}.`,
        [i],
        i,
      );
      bestEnd = i;
      snap(
        14,
        `And where it ends: bestEnd = ${bestEnd}. The best subarray is now [${bestStart}..${bestEnd}].`,
        [i],
        i,
      );
    }
  }

  const doneRange: number[] = [];
  for (let k = bestStart; k <= bestEnd; k++) doneRange.push(k);

  steps.push({
    line: 17,
    explain: `Pass complete — return the maximum subarray sum best = ${best}, from the subarray [${bestStart}..${bestEnd}].`,
    state: {
      array: [...a],
      window: [bestStart, bestEnd],
      done: doneRange,
    },
  });

  return steps;
}

export const kadane: Algorithm = {
  id: "kadane",
  name: "Kadane's Algorithm",
  category: "Array",
  blurb:
    "Track the best subarray ending at each index; the running sum resets whenever it goes negative.",
  complexity: "O(n)",
  renderKind: "array",
  code,
  run,
};
