import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function sieve(n) {",
  "  const isComposite = new Array(n + 1).fill(false);",
  "  for (let p = 2; p * p <= n; p++) {",
  "    if (!isComposite[p]) {",
  "      // p is prime — cross out its multiples",
  "      for (let m = p * p; m <= n; m += p) {",
  "        isComposite[m] = true;",
  "      }",
  "    }",
  "  }",
  "  // every number still uncrossed is prime",
  "  return primesNotMarked(isComposite);",
  "}",
];

const GREY = "#3a4654";
const PURPLE = "#bc8cff";

function run(): Step[] {
  const n = 30;
  const start = 2;
  // array[index] holds the number (index + 2), so numbers 2..30.
  const numbers: number[] = [];
  for (let v = start; v <= n; v++) numbers.push(v);

  const marks: Record<number, string> = {}; // index -> grey when composite
  const steps: Step[] = [];

  // map a number value to its 0-based index in `numbers`
  const idx = (value: number): number => value - start;

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    p: number,
  ): void => {
    const pointers =
      p >= start
        ? [{ name: "p", index: idx(p), color: PURPLE }]
        : [];
    const state: ArrayState = {
      array: [...numbers],
      active,
      marks: { ...marks },
      pointers,
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: find every prime from 2 to 30 by crossing out the multiples of each prime.",
    state: { array: [...numbers], marks: {} },
  });

  steps.push({
    line: 1,
    explain:
      "Assume every number is prime to begin with — nothing is crossed out yet.",
    state: { array: [...numbers], marks: {} },
  });

  for (let p = start; p * p <= n; p++) {
    snap(
      2,
      `Take p = ${p}. Since ${p}·${p} = ${p * p} ≤ ${n}, there are still multiples worth crossing out.`,
      [idx(p)],
      p,
    );

    if (!marks[idx(p)]) {
      snap(
        3,
        `${p} was never crossed out, so ${p} is prime — time to remove its multiples.`,
        [idx(p)],
        p,
      );
      snap(
        4,
        `${p} is prime, so cross out its multiples — beginning at ${p}·${p} = ${p * p}, because every smaller multiple (like 2·${p}, 3·${p}) was already crossed by a smaller prime.`,
        [idx(p)],
        p,
      );

      for (let m = p * p; m <= n; m += p) {
        snap(
          5,
          `Move to the multiple m = ${m} (= ${m / p}·${p}).`,
          [idx(m)],
          p,
        );
        marks[idx(m)] = GREY;
        snap(
          6,
          `Cross out ${m} as composite — it is divisible by ${p}.`,
          [idx(m)],
          p,
        );
      }
    } else {
      snap(
        3,
        `${p} is already crossed out, so it is composite — skip it and move on.`,
        [idx(p)],
        p,
      );
    }
  }

  // primes are the indices that were never marked
  const done: number[] = [];
  for (let i = 0; i < numbers.length; i++) {
    if (!marks[i]) done.push(i);
  }

  const primeValues = done.map((i) => numbers[i] as number);

  steps.push({
    line: 10,
    explain: `Once p·p exceeds ${n}, no new composites remain — every number still uncrossed must be prime.`,
    state: { array: [...numbers], marks: { ...marks } },
  });

  steps.push({
    line: 11,
    explain: `The survivors are the primes up to ${n}: ${primeValues.join(", ")}.`,
    state: { array: [...numbers], marks: { ...marks }, done: [...done] },
  });

  return steps;
}

export const sieve: Algorithm = {
  id: "sieve-eratosthenes",
  name: "Sieve of Eratosthenes",
  category: "Math",
  blurb:
    "Cross out every multiple of each prime in turn; whatever survives is prime.",
  complexity: "O(n log log n)",
  renderKind: "array",
  code,
  run,
};
