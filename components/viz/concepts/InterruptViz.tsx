"use client";

import { useEffect, useState } from "react";

/* ---------------- t2-10 Interrupts, Exceptions & Traps ---------------- */

type Phase = {
  k: string;
  d: string;
  c: string;
  /** which side-panel to highlight: cpu | stack(push) | stack(pop) | vector */
  hl: "cpu" | "push" | "vector" | "isr" | "pop" | "resume";
};

const PHASES: Phase[] = [
  {
    k: "0 · RUNNING",
    d: "The CPU is executing the user program's instruction stream, advancing the PC each step. A device asserts its IRQ line — the keyboard, in this case.",
    c: "#39c5e0",
    hl: "cpu",
  },
  {
    k: "1 · FINISH INSN",
    d: "The CPU never interrupts mid-instruction. It finishes the current instruction so the machine is left in a clean, well-defined state before handling anything.",
    c: "#58a6ff",
    hl: "cpu",
  },
  {
    k: "2 · SAVE CONTEXT",
    d: "Hardware pushes the Program Counter and the CPU registers onto the kernel stack. This is the snapshot that lets the interrupted program resume as if nothing happened.",
    c: "#e3a93c",
    hl: "push",
  },
  {
    k: "3 · VECTOR LOOKUP",
    d: "The interrupt number (IRQ 1) indexes the Interrupt Vector Table. Entry 1 holds the address of the keyboard ISR — the CPU jumps there.",
    c: "#bc8cff",
    hl: "vector",
  },
  {
    k: "4 · RUN ISR",
    d: "The Interrupt Service Routine runs in kernel mode: read the scancode from the keyboard controller, buffer it, acknowledge the device, then issue IRET.",
    c: "#f778ba",
    hl: "isr",
  },
  {
    k: "5 · RESTORE CONTEXT",
    d: "IRET pops the saved registers and PC back off the stack. The CPU state is rewound exactly to where the interrupt fired.",
    c: "#3fb950",
    hl: "pop",
  },
  {
    k: "6 · RESUME",
    d: "Execution continues from the next user instruction. The program is none the wiser — interrupts make the CPU look like it can do many things at once.",
    c: "#56d364",
    hl: "resume",
  },
];

// Interrupt Vector Table (toy)
const IVT: { irq: number; name: string; addr: string }[] = [
  { irq: 0, name: "Timer", addr: "0xC0011200" },
  { irq: 1, name: "Keyboard", addr: "0xC0011A40" },
  { irq: 2, name: "Cascade", addr: "0xC00113E0" },
  { irq: 3, name: "Serial", addr: "0xC0011C80" },
];

// Context that gets pushed onto the stack
const CTX: { reg: string; val: string }[] = [
  { reg: "PC", val: "0x004013F8" },
  { reg: "EAX", val: "0x0000002A" },
  { reg: "EBX", val: "0x7FFD9C40" },
  { reg: "FLAGS", val: "0x00000206" },
];

export default function InterruptViz() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const p = PHASES[step];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(
      () => setStep((s) => (s + 1) % PHASES.length),
      1700,
    );
    return () => clearInterval(t);
  }, [auto]);

  // How many context entries are currently on the stack.
  // Pushed at step 2, still there through ISR, popped at step 5+.
  const onStack = step >= 2 && step <= 4 ? CTX.length : 0;
  const popping = p.hl === "pop";

  const inKernel = step >= 3 && step <= 5;
  const irqFired = step >= 0; // IRQ 1 is the trigger throughout

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* phase rail */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PHASES.map((ph, i) => (
            <div key={ph.k} className="flex items-center shrink-0">
              <button
                onClick={() => {
                  setAuto(false);
                  setStep(i);
                }}
                className="grid place-items-center rounded-lg px-2.5 py-2 transition-all"
                style={{
                  background: i === step ? ph.c : "#10151d",
                  border: `1px solid ${i === step ? ph.c : "#1e2630"}`,
                  color: i === step ? "#06121a" : "#8a97a8",
                  transform: i === step ? "translateY(-2px)" : undefined,
                  boxShadow: i === step ? `0 0 22px -6px ${ph.c}` : undefined,
                }}
              >
                <span className="mono text-[11px] font-bold whitespace-nowrap">
                  {ph.k}
                </span>
              </button>
              {i < PHASES.length - 1 && (
                <span
                  className="mx-0.5"
                  style={{ color: i < step ? p.c : "#5b6b7d" }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* main three-pane diagram */}
        <div className="grid gap-3 py-2 md:grid-cols-3">
          {/* CPU */}
          <div
            className="rounded-lg p-3 transition-all"
            style={{
              background:
                p.hl === "cpu" || p.hl === "resume" || p.hl === "isr"
                  ? `${p.c}14`
                  : "#10151d",
              border: `1px solid ${
                p.hl === "cpu" || p.hl === "resume" || p.hl === "isr"
                  ? p.c
                  : "#1e2630"
              }`,
            }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 flex items-center justify-between">
              <span>CPU</span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{
                  background: inKernel ? "#3fb95022" : "#39c5e022",
                  color: inKernel ? "#3fb950" : "#39c5e0",
                  border: `1px solid ${inKernel ? "#3fb95055" : "#39c5e055"}`,
                }}
              >
                {inKernel ? "KERNEL" : "USER"}
              </span>
            </div>
            <div className="space-y-1.5">
              {CTX.map((r) => (
                <div
                  key={r.reg}
                  className="flex items-center justify-between rounded px-2 py-1 mono text-[11px]"
                  style={{
                    background: "#161c26",
                    border: "1px solid #1e2630",
                    opacity:
                      step >= 2 && step <= 4 ? 0.4 : 1, // saved & frozen
                  }}
                >
                  <span className="text-faint">{r.reg}</span>
                  <span style={{ color: p.hl === "resume" ? "#56d364" : "#d6dee8" }}>
                    {r.val}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 mono text-[10px]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: irqFired ? "#f85149" : "#1e2630",
                }}
              />
              <span style={{ color: irqFired ? "#f85149" : "#5b6b7d" }}>
                IRQ&nbsp;1 line {irqFired ? "ASSERTED" : "idle"}
              </span>
            </div>
          </div>

          {/* KERNEL STACK */}
          <div
            className="rounded-lg p-3 transition-all"
            style={{
              background:
                p.hl === "push" || p.hl === "pop" ? `${p.c}14` : "#10151d",
              border: `1px solid ${
                p.hl === "push" || p.hl === "pop" ? p.c : "#1e2630"
              }`,
            }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 flex items-center justify-between">
              <span>Kernel Stack</span>
              <span style={{ color: popping ? "#3fb950" : "#e3a93c" }}>
                {popping ? "pop ↑" : onStack ? "pushed ↓" : "empty"}
              </span>
            </div>
            <div className="flex flex-col-reverse gap-1 min-h-[124px] justify-end">
              {CTX.map((r, i) => {
                const present = i < onStack;
                return (
                  <div
                    key={r.reg}
                    className="flex items-center justify-between rounded px-2 py-1 mono text-[11px] transition-all"
                    style={{
                      background: present ? "#161c26" : "transparent",
                      border: `1px solid ${
                        present
                          ? popping
                            ? "#3fb95066"
                            : "#e3a93c66"
                          : "transparent"
                      }`,
                      color: present ? "#d6dee8" : "transparent",
                      opacity: present ? 1 : 0,
                    }}
                  >
                    <span className="text-faint">{present ? r.reg : ""}</span>
                    <span>{present ? r.val : ""}</span>
                  </div>
                );
              })}
              {onStack === 0 && (
                <div className="grid place-items-center text-faint mono text-[10px] py-6">
                  (no saved frame)
                </div>
              )}
            </div>
          </div>

          {/* IVT */}
          <div
            className="rounded-lg p-3 transition-all"
            style={{
              background: p.hl === "vector" ? `${p.c}14` : "#10151d",
              border: `1px solid ${p.hl === "vector" ? p.c : "#1e2630"}`,
            }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
              Interrupt Vector Table
            </div>
            <div className="space-y-1">
              {IVT.map((e) => {
                const target = e.irq === 1;
                const lit = target && step >= 3;
                return (
                  <div
                    key={e.irq}
                    className="flex items-center gap-2 rounded px-2 py-1 mono text-[10px] transition-all"
                    style={{
                      background: lit ? "#bc8cff1f" : "#161c26",
                      border: `1px solid ${lit ? "#bc8cff" : "#1e2630"}`,
                    }}
                  >
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-sm font-bold"
                      style={{
                        background: lit ? "#bc8cff" : "#10151d",
                        color: lit ? "#06121a" : "#5b6b7d",
                      }}
                    >
                      {e.irq}
                    </span>
                    <span
                      className="flex-1"
                      style={{ color: target ? "#d6dee8" : "#5b6b7d" }}
                    >
                      {e.name}
                    </span>
                    <span style={{ color: lit ? "#bc8cff" : "#5b6b7d" }}>
                      {e.addr}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-2 rounded px-2 py-1.5 mono text-[10px] transition-all"
              style={{
                background: p.hl === "isr" ? "#f778ba1f" : "#10151d",
                border: `1px solid ${p.hl === "isr" ? "#f778ba" : "#1e2630"}`,
                color: p.hl === "isr" ? "#f778ba" : "#5b6b7d",
              }}
            >
              {p.hl === "isr"
                ? "▶ keyboard_isr(): read scancode, ack, IRET"
                : "ISR @ 0xC0011A40"}
            </div>
          </div>
        </div>
      </div>

      {/* description */}
      <div className="card mt-2 p-4 min-h-[76px]">
        <div className="mono text-xs font-bold mb-1" style={{ color: p.c }}>
          {p.k}
        </div>
        <p className="text-sm text-muted">{p.d}</p>
      </div>

      {/* controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            setAuto(false);
            setStep((s) => (s - 1 + PHASES.length) % PHASES.length);
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          prev
        </button>
        <button
          onClick={() => setAuto((a) => !a)}
          className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          {auto ? "❚❚ pause" : "▶ play"}
        </button>
        <button
          onClick={() => {
            setAuto(false);
            setStep((s) => (s + 1) % PHASES.length);
          }}
          className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          next
        </button>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Watch the context frame get pushed onto the stack, the vector table route
        IRQ&nbsp;1 to its ISR, then the frame pop back — the CPU resumes exactly
        where it left off.
      </p>
    </div>
  );
}
