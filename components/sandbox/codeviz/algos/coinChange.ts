import type { Algorithm, Step, TableState } from "../types";

const COINS = [1, 3, 4];
const AMOUNT = 6;
const INF = "∞";

const code = [
  "function coinChange(coins, amount) {",
  "  const dp = new Array(amount + 1).fill(Infinity);",
  "  dp[0] = 0;                              // zero coins make 0",
  "  for (let a = 1; a <= amount; a++) {",
  "    for (const coin of coins) {",
  "      if (coin <= a)",
  "        dp[a] = min(dp[a], dp[a - coin] + 1);",
  "    }",
  "  }",
  "  return dp[amount];",
  "}",
];

function run(): Step[] {
  const m = AMOUNT;
  // dp holds either a number, or the sentinel string "∞" while still unset.
  const dp: (number | string)[] = Array.from({ length: m + 1 }, () => INF);
  const steps: Step[] = [];
  const colLabels: number[] = Array.from({ length: m + 1 }, (_, i) => i);
  const rowLabels = ["min"];

  const snap = (
    line: number | number[],
    explain: string,
    active: [number, number][],
    reads: [number, number][],
    result?: [number, number],
  ): void => {
    const filled: [number, number][] = [];
    for (let a = 0; a <= m; a++)
      if (
        typeof dp[a] === "number" &&
        !active.some(([, c]) => c === a)
      )
        filled.push([0, a]);
    const state: TableState = {
      cells: [dp.slice()],
      rowLabels,
      colLabels,
      active,
      reads,
      filled,
      result,
      caption: `fewest coins from [${COINS.join(", ")}] to make ${AMOUNT}`,
    };
    steps.push({ line, explain, state });
  };

  snap(0, `Find the fewest coins from [${COINS.join(", ")}] that sum to ${AMOUNT}.`, [], []);
  snap(
    1,
    `Start every amount at Infinity ('${INF}') — meaning "no known way to make it yet".`,
    [],
    [],
  );

  dp[0] = 0;
  snap(2, "Base case: it takes 0 coins to make amount 0.", [[0, 0]], []);

  for (let a = 1; a <= m; a++) {
    snap(3, `Now solve for amount ${a}, building on the smaller answers already found.`, [[0, a]], []);
    for (const coin of COINS) {
      if (coin <= a) {
        const prev = dp[a - coin];
        const prevStr = typeof prev === "number" ? `${prev}` : INF;
        const cur = dp[a];
        const curStr = typeof cur === "number" ? `${cur}` : INF;
        if (typeof prev === "number") {
          const candidate = prev + 1;
          if (typeof cur !== "number" || candidate < cur) {
            dp[a] = candidate;
            snap(
              [5, 6],
              `Use coin ${coin}: reuse dp[${a - coin}]=${prevStr} and add 1 coin → ${candidate}, better than ${curStr}. Set dp[${a}]=${candidate}.`,
              [[0, a]],
              [[0, a - coin]],
            );
          } else {
            snap(
              [5, 6],
              `Use coin ${coin}: dp[${a - coin}]=${prevStr} + 1 = ${candidate} is not better than ${curStr}. Keep dp[${a}]=${curStr}.`,
              [[0, a]],
              [[0, a - coin]],
            );
          }
        } else {
          snap(
            [5, 6],
            `Use coin ${coin}: dp[${a - coin}] is still '${INF}', so it offers no way to make ${a} yet. Keep dp[${a}]=${curStr}.`,
            [[0, a]],
            [[0, a - coin]],
          );
        }
      } else {
        const curStr = typeof dp[a] === "number" ? `${dp[a]}` : INF;
        snap(
          5,
          `Coin ${coin} is larger than ${a}, so it cannot help here. Skip it (dp[${a}]=${curStr}).`,
          [[0, a]],
          [],
        );
      }
    }
  }

  const finalStr = typeof dp[m] === "number" ? `${dp[m]}` : INF;
  snap(9, `The answer is dp[${m}] = ${finalStr}: the fewest coins to make ${m}.`, [], [], [0, m]);
  return steps;
}

export const coinChange: Algorithm = {
  id: "coin-change",
  name: "Coin Change (min coins)",
  category: "Dynamic Programming",
  blurb: "Build up the fewest coins for every amount from 0 to the target, reusing smaller answers.",
  complexity: "O(amount·coins)",
  renderKind: "table",
  code,
  run,
};
