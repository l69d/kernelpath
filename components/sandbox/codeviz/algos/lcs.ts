import type { Algorithm, Step, TableState } from "../types";

const A = "AGCAT";
const B = "GAC";

const code = [
  "function lcs(a, b) {",
  "  const dp = grid(a.length + 1, b.length + 1);",
  "  for (let j = 0; j <= b.length; j++) dp[0][j] = 0; // empty a",
  "  for (let i = 0; i <= a.length; i++) dp[i][0] = 0; // empty b",
  "  for (let i = 1; i <= a.length; i++) {",
  "    for (let j = 1; j <= b.length; j++) {",
  "      if (a[i - 1] === b[j - 1])",
  "        dp[i][j] = dp[i - 1][j - 1] + 1;          // match: extend diagonal",
  "      else",
  "        dp[i][j] = max(dp[i - 1][j],              // drop a[i-1]",
  "                       dp[i][j - 1]);             // drop b[j-1]",
  "    }",
  "  }",
  "  return dp[a.length][b.length];",
  "}",
];

function run(): Step[] {
  const m = A.length;
  const n = B.length;
  const dp: (number | null)[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => null as number | null),
  );
  const steps: Step[] = [];
  const rowLabels = ["∅", ...A.split("")];
  const colLabels = ["∅", ...B.split("")];

  const snap = (
    line: number | number[],
    explain: string,
    active: [number, number][],
    reads: [number, number][],
    result?: [number, number],
  ): void => {
    const filled: [number, number][] = [];
    for (let i = 0; i <= m; i++)
      for (let j = 0; j <= n; j++)
        if (dp[i][j] !== null && !active.some(([r, c]) => r === i && c === j))
          filled.push([i, j]);
    const state: TableState = {
      cells: dp.map((row) => [...row]),
      rowLabels,
      colLabels,
      active,
      reads,
      filled,
      result,
      caption: `longest common subsequence of "${A}" and "${B}"`,
    };
    steps.push({ line, explain, state });
  };

  snap(0, `Find the longest subsequence shared by "${A}" and "${B}" — characters in order, not necessarily adjacent.`, [], []);
  snap(1, "Build a table dp where dp[i][j] = LCS length of the first i characters of a and the first j characters of b.", [], []);

  for (let j = 0; j <= n; j++) {
    dp[0][j] = 0;
    snap(2, `Base case: an empty a shares nothing with "${B.slice(0, j)}", so dp[0][${j}] = 0.`, [[0, j]], []);
  }
  for (let i = 1; i <= m; i++) {
    dp[i][0] = 0;
    snap(3, `Base case: an empty b shares nothing with "${A.slice(0, i)}", so dp[${i}][0] = 0.`, [[i, 0]], []);
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = A[i - 1] === B[j - 1];
      snap(6, `Compare a[${i - 1}]='${A[i - 1]}' with b[${j - 1}]='${B[j - 1]}'.`, [[i, j]], []);
      if (match) {
        const diag = dp[i - 1][j - 1] as number;
        dp[i][j] = diag + 1;
        snap([6, 7], `They match — extend the diagonal: dp[${i}][${j}] = ${diag} + 1 = ${dp[i][j]}.`, [[i, j]], [[i - 1, j - 1]]);
      } else {
        const up = dp[i - 1][j] as number;
        const left = dp[i][j - 1] as number;
        dp[i][j] = Math.max(up, left);
        snap(
          [8, 9, 10],
          `They differ — take the better neighbour: max(up ${up}, left ${left}) = ${dp[i][j]}.`,
          [[i, j]],
          [
            [i - 1, j],
            [i, j - 1],
          ],
        );
      }
    }
  }
  snap(13, `The answer is the bottom-right cell: the LCS has length ${dp[m][n]}.`, [], [], [m, n]);
  return steps;
}

export const lcs: Algorithm = {
  id: "lcs",
  name: "Longest Common Subsequence",
  category: "Dynamic Programming",
  blurb: "Fill a 2-D table where matching characters extend the diagonal and mismatches take the better neighbour.",
  complexity: "O(m·n)",
  renderKind: "table",
  code,
  run,
};
