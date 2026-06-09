import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function binarySearch(a, target) {",
  "  let lo = 0;",
  "  let hi = a.length - 1;",
  "  while (lo <= hi) {",
  "    const mid = Math.floor((lo + hi) / 2);",
  "    if (a[mid] === target) {",
  "      return mid; // found",
  "    }",
  "    if (a[mid] < target) {",
  "      lo = mid + 1; // discard the left half",
  "    } else {",
  "      hi = mid - 1; // discard the right half",
  "    }",
  "  }",
  "  return -1; // not present",
  "}",
];

function run(): Step[] {
  const a = [1, 3, 4, 6, 8, 9, 11, 14, 17, 20];
  const target = 14;
  const steps: Step[] = [];

  let lo = 0;
  let hi = a.length - 1;
  let mid = -1;
  let found = false;

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    done: number[],
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      done,
      window: [lo, hi],
      pointers: [
        { name: "lo", index: lo, color: "#39c5e0" },
        { name: "mid", index: mid, color: "#e3a93c" },
        { name: "hi", index: hi, color: "#bc8cff" },
      ],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain: `Goal: find ${target} in a sorted array by halving the search range each step.`,
    state: { array: [...a], window: [lo, hi] },
  });

  snap(1, `Set lo = 0, the left edge of the search window.`, [], []);
  snap(2, `Set hi = ${hi}, the right edge of the search window.`, [], []);

  while (lo <= hi) {
    snap(
      3,
      `lo (${lo}) <= hi (${hi}), so a candidate range still remains — keep searching.`,
      [],
      [],
    );

    mid = Math.floor((lo + hi) / 2);
    snap(
      4,
      `Compute mid = floor((${lo} + ${hi}) / 2) = ${mid}; a[${mid}] = ${a[mid]} is the middle element.`,
      [mid],
      [],
    );

    snap(
      5,
      `Compare: is a[${mid}] = ${a[mid]} equal to the target ${target}?`,
      [mid],
      [],
    );

    if (a[mid] === target) {
      found = true;
      snap(
        6,
        `Match! a[${mid}] = ${target}. Return index ${mid} — the target is found.`,
        [mid],
        [mid],
      );
      break;
    }

    snap(
      8,
      `Not equal. Is a[${mid}] = ${a[mid]} less than the target ${target}?`,
      [mid],
      [],
    );

    if (a[mid] < target) {
      lo = mid + 1;
      snap(
        9,
        `Yes — ${a[mid]} < ${target}, so the target must be to the right. Move lo to ${lo}, discarding the left half (indices below ${lo}).`,
        [],
        [],
      );
    } else {
      hi = mid - 1;
      snap(
        11,
        `No — ${a[mid]} > ${target}, so the target must be to the left. Move hi to ${hi}, discarding the right half (indices above ${hi}).`,
        [],
        [],
      );
    }
  }

  if (!found) {
    snap(
      14,
      `lo passed hi — the window is empty and the target was never found. Return -1.`,
      [],
      [],
    );
  }

  return steps;
}

export const binarySearch: Algorithm = {
  id: "binary-search",
  name: "Binary Search",
  category: "Searching",
  blurb:
    "Halve a sorted array each step by comparing the target to the middle element.",
  complexity: "O(log n)",
  renderKind: "array",
  code,
  run,
};
