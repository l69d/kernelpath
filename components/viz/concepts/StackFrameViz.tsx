"use client";

import { useEffect, useMemo, useState } from "react";

/* ---------------- t1-07 The Stack, Calling Conventions & Stack Frames ---------------- */

type SlotKind = "ret" | "sbp" | "param" | "local";

interface Slot {
  label: string;
  value: string;
  kind: SlotKind;
}

interface Frame {
  fn: string;
  color: string;
  slots: Slot[];
}

interface Step {
  /* frames currently on the stack, deepest-pushed last */
  frames: Frame[];
  /* one-line narration of what just happened */
  note: string;
  /* the operation verb shown on the SP arrow */
  op: "push" | "pop" | "exec" | "rest";
}

const SLOT_COLOR: Record<SlotKind, string> = {
  ret: "#58a6ff",
  sbp: "#bc8cff",
  param: "#e3a93c",
  local: "#3fb950",
};

const SLOT_NAME: Record<SlotKind, string> = {
  ret: "return address",
  sbp: "saved base ptr",
  param: "parameter",
  local: "local var",
};

const C_MAIN = "#39c5e0";
const C_COMPUTE = "#e3a93c";
const C_SQUARE = "#bc8cff";

const F_MAIN: Frame = {
  fn: "main()",
  color: C_MAIN,
  slots: [
    { label: "ret", value: "0x... libc", kind: "ret" },
    { label: "rbp", value: "—", kind: "sbp" },
    { label: "int n", value: "5", kind: "local" },
  ],
};

const F_COMPUTE: Frame = {
  fn: "compute(n)",
  color: C_COMPUTE,
  slots: [
    { label: "ret", value: "&main+0x1c", kind: "ret" },
    { label: "rbp", value: "→ main", kind: "sbp" },
    { label: "arg n", value: "5", kind: "param" },
    { label: "int t", value: "?", kind: "local" },
  ],
};

const F_COMPUTE_DONE: Frame = {
  ...F_COMPUTE,
  slots: F_COMPUTE.slots.map((s) =>
    s.label === "int t" ? { ...s, value: "25" } : s,
  ),
};

const F_SQUARE: Frame = {
  fn: "square(x)",
  color: C_SQUARE,
  slots: [
    { label: "ret", value: "&compute+0x10", kind: "ret" },
    { label: "rbp", value: "→ compute", kind: "sbp" },
    { label: "arg x", value: "5", kind: "param" },
    { label: "int r", value: "25", kind: "local" },
  ],
};

const STEPS: Step[] = [
  { frames: [F_MAIN], op: "exec", note: "Program starts. main()'s frame sits at the top of memory; SP points just below it." },
  { frames: [F_MAIN, F_COMPUTE], op: "push", note: "call compute(5) — PUSH a new frame: return address, saved rbp, the arg, room for locals. SP drops." },
  { frames: [F_MAIN, F_COMPUTE, F_SQUARE], op: "push", note: "compute calls square(5) — PUSH again. The stack grows DOWNWARD; SP keeps falling." },
  { frames: [F_MAIN, F_COMPUTE, F_SQUARE], op: "exec", note: "square computes x*x = 25 into its local r. This value lives only inside square's frame." },
  { frames: [F_MAIN, F_COMPUTE_DONE], op: "pop", note: "return 25 — POP square's frame. SP rises back; ret address restores compute. LIFO: last in, first out." },
  { frames: [F_MAIN], op: "pop", note: "compute returns 25 — POP its frame too. Its local t is gone the instant the frame is popped." },
  { frames: [F_MAIN], op: "rest", note: "Back in main() with the result. The stack is exactly where it started — every push was matched by a pop." },
];

const ROW_H = 26;
const HEADER_H = 22;
const GAP = 10;
const TOP_PAD = 16;

export default function StackFrameViz() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1600);
    return () => clearInterval(t);
  }, [auto]);

  const cur = STEPS[step];

  /* compute frame geometry: stack grows downward, so first frame on top */
  const layout = useMemo(() => {
    let y = TOP_PAD;
    const out = cur.frames.map((f) => {
      const h = HEADER_H + f.slots.length * ROW_H + 6;
      const box = { f, y, h };
      y += h + GAP;
      return box;
    });
    return { boxes: out, spY: y };
  }, [cur]);

  const totalH = layout.spY + 30;
  const isPush = cur.op === "push";
  const isPop = cur.op === "pop";

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        <div className="flex flex-col lg:flex-row gap-5 py-2">
          {/* ---- the stack diagram ---- */}
          <div className="shrink-0" style={{ width: 250 }}>
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1 flex justify-between">
              <span>high address</span>
              <span>0x7fff…</span>
            </div>
            <svg
              viewBox={`0 0 250 ${totalH}`}
              className="w-full"
              style={{ maxHeight: 340 }}
            >
              {/* base/high-address marker */}
              <line x1={4} y1={TOP_PAD - 6} x2={210} y2={TOP_PAD - 6} stroke="#1e2630" strokeDasharray="3 3" />
              {layout.boxes.map(({ f, y, h }, i) => {
                const justPushed = isPush && i === cur.frames.length - 1;
                return (
                  <g key={f.fn} style={{ opacity: justPushed ? 0.55 : 1 }}>
                    <rect
                      x={4}
                      y={y}
                      width={206}
                      height={h}
                      rx={5}
                      fill="#10151d"
                      stroke={f.color}
                      strokeWidth={1.4}
                    />
                    <rect x={4} y={y} width={206} height={HEADER_H} rx={5} fill={`${f.color}26`} />
                    <text x={12} y={y + 15} fill={f.color} className="mono" fontSize={11} fontWeight={700}>
                      {f.fn}
                    </text>
                    {f.slots.map((s, si) => {
                      const ry = y + HEADER_H + si * ROW_H;
                      return (
                        <g key={s.label}>
                          <rect x={9} y={ry + 4} width={6} height={ROW_H - 8} rx={1} fill={SLOT_COLOR[s.kind]} />
                          <text x={22} y={ry + 17} fill="#8a97a8" className="mono" fontSize={10}>
                            {s.label}
                          </text>
                          <text x={200} y={ry + 17} fill={SLOT_COLOR[s.kind]} className="mono" fontSize={10} textAnchor="end">
                            {s.value}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              {/* stack pointer */}
              <g style={{ transition: "transform 0.3s" }}>
                <line x1={4} y1={layout.spY} x2={210} y2={layout.spY} stroke="#56d364" strokeWidth={1.6} />
                <text x={216} y={layout.spY + 4} fill="#56d364" className="mono" fontSize={10} fontWeight={700}>
                  SP
                </text>
                <text x={216} y={layout.spY + 15} fill="#5b6b7d" className="mono" fontSize={8}>
                  {isPush ? "↓ falls" : isPop ? "↑ rises" : "·"}
                </text>
              </g>
            </svg>
            <div className="mono text-[10px] uppercase tracking-widest text-faint mt-1 flex justify-between">
              <span style={{ color: "#56d364" }}>low address ↓ grows</span>
              <span>0x7ffe…</span>
            </div>
          </div>

          {/* ---- narration + controls ---- */}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-3">
              {(["ret", "sbp", "param", "local"] as SlotKind[]).map((k) => (
                <span
                  key={k}
                  className="mono text-[10px] rounded px-1.5 py-0.5 inline-flex items-center gap-1"
                  style={{ background: `${SLOT_COLOR[k]}22`, color: SLOT_COLOR[k], border: `1px solid ${SLOT_COLOR[k]}55` }}
                >
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SLOT_COLOR[k] }} />
                  {SLOT_NAME[k]}
                </span>
              ))}
            </div>

            <div className="card p-4 min-h-[96px] flex-1">
              <div
                className="mono text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: isPush ? "#56d364" : isPop ? "#f778ba" : "#39c5e0" }}
              >
                {cur.op === "push" ? "▼ PUSH frame" : cur.op === "pop" ? "▲ POP frame" : cur.op === "rest" ? "● done" : "▶ execute"}
                <span className="text-faint ml-2">· step {step + 1}/{STEPS.length}</span>
              </div>
              <p className="text-sm text-text leading-relaxed">{cur.note}</p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => { setAuto(false); setStep((s) => Math.max(0, s - 1)); }}
                className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
              >
                prev
              </button>
              <div className="flex gap-1 flex-1 justify-center">
                {STEPS.map((s, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-5 rounded-full transition-colors"
                    style={{ background: i === step ? (s.op === "pop" ? "#f778ba" : "#3fb950") : "#1e2630" }}
                  />
                ))}
              </div>
              <button
                onClick={() => { setAuto(false); setStep((s) => Math.min(STEPS.length - 1, s + 1)); }}
                className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
              >
                next
              </button>
              <button
                onClick={() => setAuto((a) => !a)}
                className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
              >
                {auto ? "❚❚ pause" : "▶ play"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-faint mono text-center">
        main() → compute() → square(). Step through it: each call PUSHes a frame, each return POPs one — last in, first out. The stack pointer (SP) moves DOWNWARD as frames are added.
      </p>
    </div>
  );
}
