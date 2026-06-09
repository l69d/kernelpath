import type { Algorithm, Step, TableState } from "../types";

const ITEMS: { wt: number; val: number }[] = [
  { wt: 1, val: 1 },
  { wt: 3, val: 4 },
  { wt: 4, val: 5 },
  { wt: 5, val: 7 },
];
const CAP = 7;

const code = [
  "function knapsack(items, W) {",
  "  const dp = grid(items.length + 1, W + 1);",
  "  for (let w = 0; w <= W; w++) dp[0][w] = 0;   // no items: value 0",
  "  for (let i = 1; i <= items.length; i++) {",
  "    const { wt, val } = items[i - 1];",
  "    for (let w = 0; w <= W; w++) {",
  "      const skip = dp[i - 1][w];                // leave item i out",
  "      if (wt > w)",
  "        dp[i][w] = skip;                         // too heavy: must skip",
  "      else {",
  "        const take = dp[i - 1][w - wt] + val;    // include item i",
  "        dp[i][w] = Math.max(skip, take);         // best of the two",
  "      }",
  "    }",
  "  }",
  "  return dp[items.length][W];",
  "}",
];

function run(): Step[] {
  const n = ITEMS.length;
  const W = CAP;
  const dp: (number | null)[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: W + 1 }, () => null as number | null),
  );
  const steps: Step[] = [];
  const rowLabels: string[] = [
    "∅",
    ...ITEMS.map((it, k) => `i${k + 1} w${it.wt} v${it.val}`),
  ];
  const colLabels: number[] = Array.from({ length: W + 1 }, (_, w) => w);

  const snap = (
    line: number | number[],
    explain: string,
    active: [number, number][],
    reads: [number, number][],
    result?: [number, number],
  ): void => {
    const filled: [number, number][] = [];
    for (let i = 0; i <= n; i++)
      for (let w = 0; w <= W; w++)
        if (dp[i][w] !== null && !active.some(([r, c]) => r === i && c === w))
          filled.push([i, w]);
    const state: TableState = {
      cells: dp.map((row) => [...row]),
      rowLabels,
      colLabels,
      active,
      reads,
      filled,
      result,
      caption: `0/1 knapsack — capacity W=${W}`,
    };
    steps.push({ line, explain, state });
  };

  snap(
    0,
    `0/1 knapsack: pick a subset of items so the total weight stays within W=${W} and the total value is largest.`,
    [],
    [],
  );
  snap(
    1,
    "Build a table dp where dp[i][w] = best value using the first i items within a weight budget of w.",
    [],
    [],
  );

  for (let w = 0; w <= W; w++) {
    dp[0][w] = 0;
    snap(
      2,
      `Base case: with zero items available, the best value for budget ${w} is 0.`,
      [[0, w]],
      [],
    );
  }

  for (let i = 1; i <= n; i++) {
    const { wt, val } = ITEMS[i - 1];
    snap(
      4,
      `Now consider item ${i}: weight ${wt}, value ${val}.`,
      [],
      [],
    );
    for (let w = 0; w <= W; w++) {
      const skip = dp[i - 1][w] as number;
      snap(
        6,
        `Option A — skip item ${i}: keep the best from the first ${i - 1} items at budget ${w}, which is ${skip}.`,
        [[i, w]],
        [[i - 1, w]],
      );
      if (wt > w) {
        dp[i][w] = skip;
        snap(
          [7, 8],
          `Item ${i} weighs ${wt}, which exceeds budget ${w} — it cannot fit, so dp[${i}][${w}] = ${skip}.`,
          [[i, w]],
          [[i - 1, w]],
        );
      } else {
        const take = (dp[i - 1][w - wt] as number) + val;
        dp[i][w] = Math.max(skip, take);
        const tookIt = take >= skip;
        snap(
          [10, 11],
          `Option B — take item ${i}: free ${wt} weight (dp[${i - 1}][${w - wt}]=${dp[i - 1][w - wt]}) then add value ${val} = ${take}. Best of skip ${skip} vs take ${take} is ${dp[i][w]} (${tookIt ? "take it" : "leave it out"}).`,
          [[i, w]],
          [
            [i - 1, w],
            [i - 1, w - wt],
          ],
        );
      }
    }
  }

  snap(
    15,
    `The answer is the bottom-right cell: the most value you can carry is ${dp[n][W]}.`,
    [],
    [],
    [n, W],
  );
  return steps;
}

export const knapsack01: Algorithm = {
  id: "knapsack-01",
  name: "0/1 Knapsack",
  category: "Dynamic Programming",
  blurb:
    "Decide item by item whether including it (within the weight budget) beats leaving it out.",
  complexity: "O(n·W)",
  renderKind: "table",
  code,
  run,
};