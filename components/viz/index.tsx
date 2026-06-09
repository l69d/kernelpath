"use client";

import { useEffect, useState } from "react";
import { CONCEPT_VIZ } from "./concepts/registry";

/* ================================================================== *
 *  Hand-built interactive "hero" visualizations.
 *  Each is a self-contained client component. The VIZ registry maps a
 *  module id to its flagship visualization; HeroViz renders it (or null).
 * ================================================================== */

function Frame({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">{children}</div>
      {hint && (
        <p className="mt-3 text-xs text-faint mono text-center">{hint}</p>
      )}
    </div>
  );
}

/* ---------------- t0-07 Memory hierarchy ---------------- */
const MEM_LAYERS = [
  { name: "CPU Registers", size: "~1 KB", latency: "≈ 0.3 ns", w: 120, color: "#56d364", human: "1 second" },
  { name: "L1 Cache", size: "~64 KB", latency: "≈ 1 ns", w: 190, color: "#3fb950", human: "3 seconds" },
  { name: "L2 Cache", size: "~1 MB", latency: "≈ 4 ns", w: 270, color: "#39c5e0", human: "13 seconds" },
  { name: "L3 Cache", size: "~32 MB", latency: "≈ 12 ns", w: 360, color: "#58a6ff", human: "40 seconds" },
  { name: "Main Memory (RAM)", size: "~16 GB", latency: "≈ 100 ns", w: 470, color: "#bc8cff", human: "5 minutes" },
  { name: "NVMe SSD", size: "~1 TB", latency: "≈ 100 µs", w: 580, color: "#e3a93c", human: "4 days" },
  { name: "Spinning Disk / Network", size: "~∞", latency: "≈ 10 ms", w: 680, color: "#f85149", human: "1 year" },
];

export function MemoryHierarchyViz() {
  const [i, setI] = useState(1);
  const layer = MEM_LAYERS[i];
  return (
    <Frame hint="Hover a layer. The “human time” column scales every latency as if 1 CPU cycle = 1 second.">
      <div className="flex flex-col items-center gap-1 py-2">
        {MEM_LAYERS.map((l, idx) => (
          <button
            key={l.name}
            onMouseEnter={() => setI(idx)}
            onFocus={() => setI(idx)}
            className="group relative grid place-items-center rounded transition-all"
            style={{
              width: l.w,
              height: 38,
              background: idx === i ? l.color : "#10151d",
              border: `1px solid ${idx === i ? l.color : "#1e2630"}`,
              color: idx === i ? "#06121a" : "#8a97a8",
              boxShadow: idx === i ? `0 0 22px -4px ${l.color}` : undefined,
            }}
          >
            <span className="mono text-[11px] font-semibold">{l.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label="capacity" value={layer.size} color={layer.color} />
        <Stat label="latency" value={layer.latency} color={layer.color} />
        <Stat label="human scale" value={layer.human} color={layer.color} />
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        Faster is smaller and pricier. The whole game of performance is keeping
        hot data near the top — that&apos;s why <b className="text-text">locality of reference</b> matters.
      </p>
    </Frame>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

/* ---------------- t2-03 Fetch-decode-execute ---------------- */
const FDE = [
  { k: "FETCH", d: "Read the instruction at the address in the Program Counter (PC) from memory into the Instruction Register.", c: "#3fb950" },
  { k: "DECODE", d: "The control unit interprets the bits: what operation? which registers? what addressing mode?", c: "#39c5e0" },
  { k: "EXECUTE", d: "The ALU does the work — add, compare, branch — possibly reading/writing registers.", c: "#bc8cff" },
  { k: "WRITE-BACK", d: "Store the result back into a register or memory; advance the PC to the next instruction.", c: "#e3a93c" },
];

export function FetchExecuteViz() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % FDE.length), 1400);
    return () => clearInterval(t);
  }, [auto]);
  return (
    <Frame hint="The CPU repeats this loop billions of times per second. Click a stage to inspect it.">
      <div className="flex items-center justify-center gap-2 py-3">
        {FDE.map((f, idx) => (
          <div key={f.k} className="flex items-center">
            <button
              onClick={() => { setAuto(false); setStep(idx); }}
              className="grid place-items-center rounded-lg px-4 py-3 transition-all"
              style={{
                background: idx === step ? f.c : "#10151d",
                border: `1px solid ${idx === step ? f.c : "#1e2630"}`,
                color: idx === step ? "#06121a" : "#8a97a8",
                transform: idx === step ? "translateY(-3px)" : undefined,
                boxShadow: idx === step ? `0 0 22px -6px ${f.c}` : undefined,
              }}
            >
              <span className="mono text-xs font-bold">{f.k}</span>
            </button>
            {idx < FDE.length - 1 && (
              <span className="mx-1 text-faint">→</span>
            )}
          </div>
        ))}
      </div>
      <div className="card mt-2 p-4 min-h-[72px]">
        <div className="mono text-xs font-bold mb-1" style={{ color: FDE[step].c }}>
          {step + 1}. {FDE[step].k}
        </div>
        <p className="text-sm text-muted">{FDE[step].d}</p>
      </div>
      <div className="mt-3 flex justify-center">
        <button
          onClick={() => setAuto((a) => !a)}
          className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
        >
          {auto ? "❚❚ pause" : "▶ play"}
        </button>
      </div>
    </Frame>
  );
}

/* ---------------- t2-04 Pipeline ---------------- */
const STAGES = ["IF", "ID", "EX", "MEM", "WB"];
const INSNS = ["lw", "add", "sub", "or", "and"];
const ICOLORS = ["#3fb950", "#39c5e0", "#bc8cff", "#e3a93c", "#f778ba"];

export function PipelineViz() {
  const [cycle, setCycle] = useState(4);
  useEffect(() => {
    const t = setInterval(
      () => setCycle((c) => (c >= INSNS.length + STAGES.length - 1 ? 4 : c + 1)),
      900,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <Frame hint="Each instruction enters one stage per cycle. Once the pipeline is full, one instruction finishes every cycle — ~5× throughput.">
      <div className="grid gap-1 py-2" style={{ gridTemplateColumns: `64px repeat(${INSNS.length + STAGES.length}, 1fr)` }}>
        <div />
        {Array.from({ length: INSNS.length + STAGES.length }).map((_, c) => (
          <div key={c} className={`mono text-[10px] text-center ${c === cycle ? "text-green" : "text-faint"}`}>
            t{c + 1}
          </div>
        ))}
        {INSNS.map((insn, r) => (
          <Row key={insn} insn={insn} r={r} cycle={cycle} color={ICOLORS[r]} />
        ))}
      </div>
    </Frame>
  );
}

function Row({ insn, r, cycle, color }: { insn: string; r: number; cycle: number; color: string }) {
  return (
    <>
      <div className="mono text-[11px] text-muted flex items-center" style={{ color }}>
        {insn}
      </div>
      {Array.from({ length: INSNS.length + STAGES.length }).map((_, c) => {
        const stageIdx = c - r;
        const active = stageIdx >= 0 && stageIdx < STAGES.length;
        const isNow = c === cycle && active;
        return (
          <div
            key={c}
            className="grid place-items-center rounded mono text-[10px] h-7"
            style={{
              background: active ? (isNow ? color : `${color}26`) : "transparent",
              border: active ? `1px solid ${isNow ? color : "#1e2630"}` : "1px solid transparent",
              color: isNow ? "#06121a" : active ? color : "transparent",
              fontWeight: isNow ? 700 : 400,
            }}
          >
            {active ? STAGES[stageIdx] : ""}
          </div>
        );
      })}
    </>
  );
}

/* ---------------- t2-08 Virtual memory translation ---------------- */
export function VirtualMemoryViz() {
  const [vaddr, setVaddr] = useState(0x1f3a);
  const pageSize = 0x1000;
  const vpn = Math.floor(vaddr / pageSize);
  const offset = vaddr % pageSize;
  // toy page table: vpn -> pfn
  const table: Record<number, number> = { 0: 7, 1: 3, 2: 9, 3: 1 };
  const pfn = table[vpn] ?? 5;
  const paddr = pfn * pageSize + offset;
  const hex = (n: number, p = 4) => "0x" + n.toString(16).padStart(p, "0");
  return (
    <Frame hint="Drag the slider to change the virtual address. The MMU splits it into a page number (translated via the page table) and an offset (passed straight through).">
      <div className="py-2 space-y-4">
        <input
          type="range"
          min={0}
          max={0x3fff}
          value={vaddr}
          onChange={(e) => setVaddr(Number(e.target.value))}
          className="w-full accent-[#3fb950]"
        />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="card p-3 text-center">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">virtual address</div>
            <div className="mono text-lg font-bold text-cyan mt-1">{hex(vaddr)}</div>
            <div className="mt-2 flex gap-1 justify-center">
              <Chip label="VPN" value={hex(vpn, 1)} color="#bc8cff" />
              <Chip label="offset" value={hex(offset, 3)} color="#e3a93c" />
            </div>
          </div>
          <div className="text-center mono text-faint text-xs">
            <div className="text-purple">page&nbsp;table</div>
            <div className="text-2xl leading-none my-1 text-green">→</div>
            <div>MMU</div>
          </div>
          <div className="card p-3 text-center">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">physical address</div>
            <div className="mono text-lg font-bold text-green mt-1">{hex(paddr, 5)}</div>
            <div className="mt-2 flex gap-1 justify-center">
              <Chip label="PFN" value={hex(pfn, 1)} color="#3fb950" />
              <Chip label="offset" value={hex(offset, 3)} color="#e3a93c" />
            </div>
          </div>
        </div>
        <div className="card p-2">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1 text-center">page table (VPN → PFN)</div>
          <div className="flex justify-center gap-1 flex-wrap">
            {Object.entries(table).map(([k, v]) => (
              <span
                key={k}
                className="mono text-[11px] rounded px-2 py-1"
                style={{
                  background: Number(k) === vpn ? "#bc8cff" : "#10151d",
                  color: Number(k) === vpn ? "#06121a" : "#8a97a8",
                  border: "1px solid #1e2630",
                }}
              >
                {k}→{v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="mono text-[10px] rounded px-1.5 py-0.5" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
      {label} {value}
    </span>
  );
}

/* ---------------- t2-09 Protection rings ---------------- */
const RINGS = [
  { r: 3, label: "Ring 3 — User apps", c: "#39c5e0", desc: "Your browser, editor, games. No direct hardware access; must ask the kernel via syscalls." },
  { r: 2, label: "Ring 2 — (rarely used)", c: "#58a6ff", desc: "Historically device drivers. Linux ignores rings 1 & 2." },
  { r: 1, label: "Ring 1 — (rarely used)", c: "#bc8cff", desc: "Historically OS services. Used by some hypervisors for paravirtualization." },
  { r: 0, label: "Ring 0 — Kernel", c: "#3fb950", desc: "Full privilege. The scheduler, drivers, memory manager. A bug here can crash the whole machine." },
];

export function ProtectionRingsViz() {
  const [sel, setSel] = useState(0);
  const sizes = [240, 186, 132, 78];
  return (
    <Frame hint="Linux only uses Ring 0 (kernel) and Ring 3 (user). The rings are the CPU's hardware-enforced privilege walls.">
      <div className="flex flex-col md:flex-row items-center gap-6 py-2">
        <div className="relative grid place-items-center" style={{ width: 250, height: 250 }}>
          {RINGS.map((ring, idx) => (
            <button
              key={ring.r}
              onMouseEnter={() => setSel(idx)}
              className="absolute rounded-full transition-all"
              style={{
                width: sizes[idx],
                height: sizes[idx],
                border: `2px solid ${sel === idx ? ring.c : "#1e2630"}`,
                background: sel === idx ? `${ring.c}1a` : "transparent",
                boxShadow: sel === idx ? `0 0 24px -6px ${ring.c}` : undefined,
              }}
            />
          ))}
          <span className="absolute mono text-xs font-bold text-green glow-green">Ring 0</span>
        </div>
        <div className="card p-4 flex-1 min-h-[120px]">
          <div className="mono text-sm font-bold" style={{ color: RINGS[sel].c }}>{RINGS[sel].label}</div>
          <p className="text-sm text-muted mt-2">{RINGS[sel].desc}</p>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- t4-12 Syscall boundary ---------------- */
const SYS = [
  "User code calls write() in glibc",
  "glibc puts the syscall number in a register & runs the SYSCALL instruction",
  "CPU switches Ring 3 → Ring 0, jumps to the kernel entry point",
  "Kernel validates args, copies the buffer with copy_from_user()",
  "The VFS routes write() to the right filesystem / driver",
  "Return value goes back in a register; CPU switches Ring 0 → Ring 3",
];

export function SyscallBoundaryViz() {
  const [step, setStep] = useState(0);
  const inKernel = step >= 2 && step <= 4;
  return (
    <Frame hint="A system call is the only doorway from user space into the kernel. Step through one write().">
      <div className="py-2">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Zone title="USER SPACE · Ring 3" active={!inKernel} color="#39c5e0" />
          <Zone title="KERNEL SPACE · Ring 0" active={inKernel} color="#3fb950" />
        </div>
        <div className="card p-4 min-h-[64px] flex items-center gap-3">
          <span className="mono text-xs font-bold" style={{ color: inKernel ? "#3fb950" : "#39c5e0" }}>
            {String(step + 1).padStart(2, "0")}
          </span>
          <p className="text-sm text-text">{SYS[step]}</p>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text">prev</button>
          <div className="flex gap-1">
            {SYS.map((_, i) => (
              <span key={i} className="h-1.5 w-5 rounded-full" style={{ background: i === step ? "#3fb950" : "#1e2630" }} />
            ))}
          </div>
          <button onClick={() => setStep((s) => Math.min(SYS.length - 1, s + 1))} className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text">next</button>
        </div>
      </div>
    </Frame>
  );
}

function Zone({ title, active, color }: { title: string; active: boolean; color: string }) {
  return (
    <div
      className="rounded-lg p-3 text-center transition-all"
      style={{
        background: active ? `${color}1a` : "#10151d",
        border: `1px solid ${active ? color : "#1e2630"}`,
        boxShadow: active ? `0 0 20px -8px ${color}` : undefined,
      }}
    >
      <span className="mono text-[11px] font-bold" style={{ color: active ? color : "#5b6b7d" }}>{title}</span>
    </div>
  );
}

/* ---------------- t4-14 Boot chain ---------------- */
const BOOT = [
  { k: "Power on", d: "CPU starts executing firmware from a fixed reset address." },
  { k: "UEFI / BIOS", d: "Firmware initializes hardware, runs POST, finds a bootable device." },
  { k: "Bootloader (GRUB)", d: "Loads the kernel image (vmlinuz) and initramfs into memory, passes the cmdline." },
  { k: "Kernel init", d: "Decompresses, sets up paging, detects hardware, mounts initramfs as a temporary root." },
  { k: "PID 1 (systemd)", d: "The first userspace process starts; it brings up services and the real root filesystem." },
  { k: "Login / your shell", d: "The system is up. You are now talking to the kernel through system calls." },
];

export function BootChainViz() {
  const [active, setActive] = useState(0);
  return (
    <Frame hint="Six handoffs take a cold chip to a running Linux system. Click each stage.">
      <ol className="py-2 space-y-1.5">
        {BOOT.map((b, i) => (
          <li key={b.k}>
            <button
              onClick={() => setActive(i)}
              className="w-full text-left flex items-start gap-3 rounded-lg p-3 transition-all"
              style={{
                background: i === active ? "#10151d" : "transparent",
                border: `1px solid ${i === active ? "#2b3a49" : "transparent"}`,
              }}
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full mono text-[11px] font-bold"
                style={{
                  background: i <= active ? "#3fb950" : "#161c26",
                  color: i <= active ? "#06121a" : "#5b6b7d",
                }}
              >
                {i + 1}
              </span>
              <div>
                <div className="mono text-xs font-bold" style={{ color: i === active ? "#56d364" : "#d6dee8" }}>{b.k}</div>
                {i === active && <p className="text-sm text-muted mt-1">{b.d}</p>}
              </div>
            </button>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

/* ---------------- t10-02 Patch lifecycle ---------------- */
const PATCH = [
  { k: "git format-patch", d: "Turn your commit into a plain-text patch with a Signed-off-by line.", c: "#3fb950" },
  { k: "checkpatch.pl", d: "Run the style checker until it's clean. Maintainers will reject style noise.", c: "#39c5e0" },
  { k: "git send-email", d: "Mail the patch (plain text!) to the maintainer and the subsystem list from get_maintainer.pl.", c: "#bc8cff" },
  { k: "Review on LKML", d: "Maintainers and devs reply inline. Expect feedback. Respond, don't take it personally.", c: "#e3a93c" },
  { k: "v2, v3, …", d: "Incorporate feedback, bump the version, note changes below the --- line, resend.", c: "#f778ba" },
  { k: "Applied to a tree", d: "A maintainer adds your patch to their subsystem tree with a Signed-off-by.", c: "#58a6ff" },
  { k: "linux-next → Linus", d: "It soaks in linux-next, then flows up to Linus in the next merge window. You're a contributor.", c: "#56d364" },
];

export function PatchLifecycleViz() {
  const [active, setActive] = useState(0);
  return (
    <Frame hint="Your patch's journey from your laptop to Linus's tree. Click a step.">
      <div className="py-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PATCH.map((p, i) => (
            <div key={p.k} className="flex items-center shrink-0">
              <button
                onClick={() => setActive(i)}
                className="grid place-items-center rounded-lg px-3 py-2 transition-all"
                style={{
                  background: i === active ? p.c : "#10151d",
                  border: `1px solid ${i === active ? p.c : "#1e2630"}`,
                  color: i === active ? "#06121a" : "#8a97a8",
                }}
              >
                <span className="mono text-[11px] font-bold whitespace-nowrap">{p.k}</span>
              </button>
              {i < PATCH.length - 1 && <span className="mx-0.5 text-faint">→</span>}
            </div>
          ))}
        </div>
        <div className="card p-4 mt-2 min-h-[64px]">
          <div className="mono text-xs font-bold" style={{ color: PATCH[active].c }}>{PATCH[active].k}</div>
          <p className="text-sm text-muted mt-1">{PATCH[active].d}</p>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- registry ---------------- */
export const VIZ: Record<string, React.ComponentType> = {
  ...CONCEPT_VIZ,
  "t0-07": MemoryHierarchyViz,
  "t2-03": FetchExecuteViz,
  "t2-04": PipelineViz,
  "t2-08": VirtualMemoryViz,
  "t2-09": ProtectionRingsViz,
  "t4-12": SyscallBoundaryViz,
  "t4-14": BootChainViz,
  "t10-02": PatchLifecycleViz,
};

export function HeroViz({ id }: { id: string }) {
  const C = VIZ[id];
  if (!C) return null;
  return (
    <div>
      <div className="mono text-[11px] uppercase tracking-widest text-green mb-2 flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green animate-pulse-ring" />
        interactive visualization
      </div>
      <C />
    </div>
  );
}

export function hasHeroViz(id: string): boolean {
  return Boolean(VIZ[id]);
}
