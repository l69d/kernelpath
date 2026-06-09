import type { Algorithm, ArrayState, Step } from "../types";

const code = [
  "function insertionSort(a) {",
  "  for (let i = 1; i < a.length; i++) {",
  "    const key = a[i];",
  "    let j = i - 1;",
  "    while (j >= 0 && a[j] > key) {",
  "      a[j + 1] = a[j]; // shift larger value right",
  "      j--;",
  "    }",
  "    a[j + 1] = key; // drop key into its slot",
  "  }",
  "  return a;",
  "}",
];

function run(): Step[] {
  const a = [5, 2, 9, 1, 6, 3];
  const steps: Step[] = [];
  const n = a.length;
  const done = new Set<number>([0]);

  const snap = (
    line: number | number[],
    explain: string,
    active: number[],
    i: number,
    j: number,
  ): void => {
    const state: ArrayState = {
      array: [...a],
      active,
      done: [...done],
      pointers: [
        { name: "i", index: i, color: "#bc8cff" },
        { name: "j", index: j, color: "#39c5e0" },
      ],
    };
    steps.push({ line, explain, state });
  };

  steps.push({
    line: 0,
    explain:
      "Goal: grow a sorted prefix, inserting each new element into its correct slot by shifting larger ones right.",
    state: {
      array: [...a],
      done: [...done],
      pointers: [
        { name: "i", index: -1, color: "#bc8cff" },
        { name: "j", index: -1, color: "#39c5e0" },
      ],
    },
  });

  for (let i = 1; i < n; i++) {
    snap(
      1,
      `Pass ${i}: indices 0..${i - 1} are already sorted; bring index ${i} into that prefix.`,
      [i],
      i,
      -1,
    );

    const key = a[i] as number;
    snap(2, `Lift key = a[${i}] = ${key} out so its slot is free to receive shifts.`, [i], i, -1);

    let j = i - 1;
    snap(3, `Start the comparison cursor j at ${j}, the last sorted index.`, [j], i, j);

    while (j >= 0 && (a[j] as number) > key) {
      snap(
        4,
        `Is j = ${j} still valid and a[${j}] = ${a[j]} greater than key ${key}? Yes — keep shifting.`,
        [j, j + 1],
        i,
        j,
      );

      a[j + 1] = a[j] as number;
      snap(5, `Shift a[${j}] = ${a[j + 1]} one slot right into index ${j + 1}.`, [j, j + 1], i, j);

      j--;
      snap(
        6,
        j >= 0
          ? `Step the cursor left to j = ${j} to check the next sorted element.`
          : `Step the cursor left to j = ${j}; it has fallen off the left end.`,
        j >= 0 ? [j] : [],
        i,
        j,
      );
    }

    snap(
      4,
      j < 0
        ? `Cursor fell off the left end — key ${key} is the new smallest, so stop shifting.`
        : `a[${j}] = ${a[j]} is not greater than key ${key}, so the insertion point is found.`,
      j >= 0 ? [j, j + 1] : [j + 1],
      i,
      j,
    );

    a[j + 1] = key;
    snap(8, `Drop key ${key} into index ${j + 1}; the sorted prefix now covers 0..${i}.`, [j + 1], i, -1);

    done.add(i);
  }

  steps.push({
    line: 10,
    explain: "Every element has been inserted into the sorted prefix — the array is fully sorted.",
    state: {
      array: [...a],
      done: [...done],
      pointers: [
        { name: "i", index: -1, color: "#bc8cff" },
        { name: "j", index: -1, color: "#39c5e0" },
      ],
    },
  });

  return steps;
}

export const insertionSort: Algorithm = {
  id: "insertion-sort",
  name: "Insertion Sort",
  category: "Sorting",
  blurb:
    "Grow a sorted prefix, inserting each new element into its correct slot by shifting larger ones right.",
  complexity: "O(n²)",
  renderKind: "array",
  code,
  run,
};
