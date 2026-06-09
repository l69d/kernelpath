import type { Algorithm, Step, TableState } from "../types";

const A = "horse";
const B = "ros";

const code = [
  "function editDistance(a, b) {",
  "  const dp = grid(a.length + 1, b.length + 1);",
  "  for (let i = 0; i <= a.length; i++) dp[i][0] = i; // delete all",
  "  for (let j = 0; j <= b.length; j++) dp[0][j] = j; // insert all",
  "  for (let i = 1; i <= a.length; i++) {",
  "    for (let j = 1; j <= b.length; j++) {",
  "      if (a[i - 1] === b[j - 1])",
  "        dp[i][j] = dp[i - 1][j - 1];           // chars match: free",
  "      else",
  "        dp[i][j] = 1 + min(dp[i-1][j],         // delete",
  "                           dp[i][j-1],         // insert",
  "                           dp[i-1][j-1]);      // replace",
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
      caption: `edit distance "${A}" → "${B}"`,
    };
    steps.push({ line, explain, state });
  };

  snap(0, `Levenshtein distance: fewest single-character edits to turn "${A}" into "${B}".`, [], []);
  snap(1, "Build a table dp where dp[i][j] = distance between the first i and first j characters.", [], []);

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    snap(2, `Base case: turning "${A.slice(0, i)}" into "" costs ${i} deletions.`, [[i, 0]], []);
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    snap(3, `Base case: turning "" into "${B.slice(0, j)}" costs ${j} insertions.`, [[0, j]], []);
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = A[i - 1] === B[j - 1];
      snap(5, `Compare a[${i - 1}]='${A[i - 1]}' with b[${j - 1}]='${B[j - 1]}'.`, [[i, j]], []);
      if (match) {
        dp[i][j] = dp[i - 1][j - 1] as number;
        snap([6, 7], `They match — no edit needed. Copy the diagonal value ${dp[i][j]}.`, [[i, j]], [[i - 1, j - 1]]);
      } else {
        const del = dp[i - 1][j] as number;
        const ins = dp[i][j - 1] as number;
        const rep = dp[i - 1][j - 1] as number;
        dp[i][j] = 1 + Math.min(del, ins, rep);
        snap(
          [8, 9, 10, 11],
          `They differ — take 1 + min(delete ${del}, insert ${ins}, replace ${rep}) = ${dp[i][j]}.`,
          [[i, j]],
          [
            [i - 1, j],
            [i, j - 1],
            [i - 1, j - 1],
          ],
        );
      }
    }
  }
  snap(13, `The answer is the bottom-right cell: ${dp[m][n]} edits.`, [], [], [m, n]);
  return steps;
}

export const editDistance: Algorithm = {
  id: "edit-distance",
  name: "Edit Distance",
  category: "Dynamic Programming",
  blurb: "Fill a 2-D table where each cell reuses three neighbours — the essence of dynamic programming.",
  complexity: "O(m·n)",
  renderKind: "table",
  code,
  run,
};
