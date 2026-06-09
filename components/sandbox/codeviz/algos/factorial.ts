import type { Algorithm, StackFrame, StackState, Step } from "../types";

const code = [
  "function fact(n) {",
  "  if (n <= 1) return 1;        // base case",
  "  return n * fact(n - 1);      // recursive case",
  "}",
];

const ROOT_N = 5;

function run(): Step[] {
  const steps: Step[] = [];

  // Frames live bottom (index 0) -> top. Each frame tracks its n and,
  // once known, the value it will return.
  interface Frame {
    n: number;
    returnValue?: number;
  }
  const stack: Frame[] = [];

  const snap = (line: number | number[], explain: string): void => {
    const frames: StackFrame[] = stack.map((fr, i) => {
      const isTop = i === stack.length - 1;
      const f: StackFrame = {
        label: `fact(${fr.n})`,
        detail: `n=${fr.n}`,
        state: fr.returnValue !== undefined ? "returning" : isTop ? "active" : "waiting",
      };
      if (fr.returnValue !== undefined) f.returnValue = fr.returnValue;
      return f;
    });
    const state: StackState = { frames };
    steps.push({ line, explain, state });
  };

  // ---- Wind-up phase: push frames down to the base case. -------------
  snap(
    0,
    `Compute fact(${ROOT_N}) by recursion. Watch the stack wind up to the base case, then unwind multiplying on the way back.`,
  );

  let n = ROOT_N;
  while (true) {
    stack.push({ n });
    snap(0, `Call fact(${n}). A fresh frame is pushed; it becomes the active top of the stack.`);
    snap(1, `Base-case check inside fact(${n}): is n = ${n} ≤ 1?`);
    if (n <= 1) {
      // Reached the base case — this frame returns 1 directly.
      stack[stack.length - 1].returnValue = 1;
      snap(1, `Yes — fact(${n}) hits the base case and returns 1. The unwind now begins.`);
      break;
    }
    snap(
      2,
      `No — fact(${n}) must compute n * fact(n - 1), so it pauses and waits on the deeper call fact(${n - 1}).`,
    );
    n = n - 1;
  }

  // ---- Unwind phase: each frame returns, multiplying as we go back up.
  // Pop the resolved base frame, then resolve each waiting frame above it.
  let childReturn = stack[stack.length - 1].returnValue as number;
  stack.pop();

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const product = frame.n * childReturn;
    // Mark this frame as returning with its computed value before popping.
    frame.returnValue = product;
    snap(
      2,
      `Back in fact(${frame.n}): the inner call gave ${childReturn}, so fact(${frame.n}) = ${frame.n} * ${childReturn} = ${product}. This frame returns and is about to pop.`,
    );
    childReturn = product;
    stack.pop();
  }

  snap(
    0,
    `Finished: fact(${ROOT_N}) = ${childReturn}. The stack is empty again — it wound up to 1, then unwound multiplying back up.`,
  );

  return steps;
}

export const factorial: Algorithm = {
  id: "factorial",
  name: "Factorial (Call Stack)",
  category: "Recursion",
  blurb:
    "Linear recursion: the stack winds up to the base case, then unwinds multiplying on the way back.",
  complexity: "O(n)",
  renderKind: "stack",
  code,
  run,
};
