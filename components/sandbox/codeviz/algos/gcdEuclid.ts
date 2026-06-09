import type { Algorithm, Step, TableState } from "../types";

const A0 = 48;
const B0 = 18;

const code = [
  "function gcd(a, b) {",
  "  while (b !== 0) {",
  "    const r = a % b;   // remainder is strictly smaller than b",
  "    a = b;             // shift: the old divisor becomes the new dividend",
  "    b = r;             // the remainder becomes the new divisor",
  "  }",
  "  return a;            // b is 0, so a is the GCD",
  "}",
];

function run(): Step[] {
  const steps: Step[] = [];
  const rows: (number | string | null)[][] = [];
  const rowLabels: (string | number)[] = [];
  const colLabels: (string | number)[] = ["a", "b", "a mod b"];

  let a = A0;
  let b = B0;

  const snap = (
    line: number | number[],
    explain: string,
    active: [number, number][],
    caption: string,
    result?: [number, number],
  ): void => {
    const filled: [number, number][] = [];
    for (let i = 0; i < rows.length; i++)
      for (let j = 0; j < rows[i].length; j++)
        if (rows[i][j] !== null && !active.some(([r, c]) => r === i && c === j))
          filled.push([i, j]);
    const state: TableState = {
      cells: rows.map((row) => [...row]),
      rowLabels,
      colLabels,
      active,
      reads: [],
      filled,
      result,
      caption,
    };
    steps.push({ line, explain, state });
  };

  snap(
    0,
    `Euclid's algorithm: find gcd(${A0}, ${B0}) by repeatedly taking remainders.`,
    [],
    `gcd(${A0}, ${B0})`,
  );

  let step = 0;
  while (true) {
    snap(
      1,
      b !== 0
        ? `b = ${b} is not zero, so keep going.`
        : `b = 0, so the loop stops — the last value of a is the answer.`,
      [],
      `a = ${a}, b = ${b}`,
    );

    if (b === 0) break;

    const r = a % b;
    step++;
    const rowIndex = rows.length;
    rows.push([a, b, r]);
    rowLabels.push(step);

    snap(
      2,
      `r = ${a} mod ${b} = ${r}. The remainder is always less than the divisor ${b}, so each step shrinks the numbers fast.`,
      [[rowIndex, 0], [rowIndex, 1], [rowIndex, 2]],
      `a = ${a}, b = ${b}, r = ${r}`,
    );

    a = b;
    snap(
      3,
      `Shift down: a becomes the old b (${b}). The old divisor is now the dividend.`,
      [[rowIndex, 0], [rowIndex, 1]],
      `a = ${a}, b = ${b}`,
    );

    b = r;
    snap(
      4,
      `b becomes the remainder (${r}). Next iteration works on the smaller pair (${a}, ${b}).`,
      [[rowIndex, 1], [rowIndex, 2]],
      `a = ${a}, b = ${b}`,
    );
  }

  const lastRow = rows.length - 1;
  snap(
    6,
    `b is 0, so a = ${a} is the greatest common divisor. gcd(${A0}, ${B0}) = ${a}.`,
    [],
    `gcd = ${a}`,
    lastRow >= 0 ? [lastRow, 1] : undefined,
  );

  return steps;
}

export const gcdEuclid: Algorithm = {
  id: "gcd-euclid",
  name: "Euclid's GCD",
  category: "Math",
  blurb:
    "Repeatedly replace (a,b) with (b, a mod b) until b is zero; the last nonzero value is the GCD.",
  complexity: "O(log min(a,b))",
  renderKind: "table",
  code,
  run,
};
