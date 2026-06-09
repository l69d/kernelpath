import type { Algorithm, Step, TableState } from "../types";

const N = 9;

const code = [
  "function fib(n) {",
  "  const dp = new Array(n + 1);",
  "  dp[0] = 0;                       // base case",
  "  dp[1] = 1;                       // base case",
  "  for (let i = 2; i <= n; i++) {",
  "    dp[i] = dp[i - 1] + dp[i - 2]; // reuse the two before",
  "  }",
  "  return dp[n];",
  "}",
];

function run(): Step[] {
  const n = N;
  const dp: (number | null)[] = Array.from(
    { length: n + 1 },
    () => null as number | null,
  );
  const steps: Step[] = [];
  const colLabels = Array.from({ length: n + 1 }, (_, i) => i);
  const rowLabels = ["fib"];

  const snap = (
    line: number | number[],
    explain: string,
    active: [number, number][],
    reads: [number, number][],
    result?: [number, number],
  ): void => {
    const filled: [number, number][] = [];
    for (let i = 0; i <= n; i++)
      if (dp[i] !== null && !active.some(([, c]) => c === i)) filled.push([0, i]);
    const state: TableState = {
      cells: [dp.map((v) => v)],
      rowLabels,
      colLabels,
      active,
      reads,
      filled,
      result,
      caption: `bottom-up fib(${n}) — O(n), no exponential recursion tree`,
    };
    steps.push({ line, explain, state });
  };

  snap(
    0,
    `The naive recursion fib(n)=fib(n-1)+fib(n-2) recomputes the same calls exponentially. Tabulation fills a table once, bottom-up, in O(n).`,
    [],
    [],
  );
  snap(
    1,
    `Allocate a 1-D table dp of length ${n + 1}, where dp[i] will hold the i-th Fibonacci number.`,
    [],
    [],
  );

  dp[0] = 0;
  snap(2, `Seed the first base case: dp[0] = 0.`, [[0, 0]], []);

  dp[1] = 1;
  snap(3, `Seed the second base case: dp[1] = 1.`, [[0, 1]], []);

  for (let i = 2; i <= n; i++) {
    snap(
      4,
      `Loop i = ${i}: every later value is built from results already sitting in the table — no re-descent into recursion.`,
      [[0, i]],
      [],
    );
    const a = dp[i - 1] as number;
    const b = dp[i - 2] as number;
    dp[i] = a + b;
    snap(
      5,
      `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${a} + ${b} = ${dp[i]}. Each cell reuses just the two before it.`,
      [[0, i]],
      [
        [0, i - 1],
        [0, i - 2],
      ],
    );
  }

  snap(
    7,
    `Return dp[${n}] = ${dp[n]}. The whole table was filled in ${n - 1} additions — linear, not exponential.`,
    [],
    [],
    [0, n],
  );
  return steps;
}

export const fibTabulation: Algorithm = {
  id: "fib-tabulation",
  name: "Fibonacci (Tabulation)",
  category: "Dynamic Programming",
  blurb:
    "The iterative, bottom-up cure for the exponential recursion: each value reuses the two before it.",
  complexity: "O(n)",
  renderKind: "table",
  code,
  run,
};
