"use client";

import { useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Tiny educational CPU / assembly simulator.
// 8 registers R0..R7 (32-bit, masked to >>>0), 16 data-memory cells, PC, Z/N.
// ---------------------------------------------------------------------------

const NUM_REGS = 8;
const NUM_MEM = 16;
const STEP_CAP = 500;

type OpKind =
  | "MOV"
  | "ADD"
  | "SUB"
  | "MUL"
  | "LD"
  | "ST"
  | "CMP"
  | "JMP"
  | "JZ"
  | "JNZ"
  | "HLT";

// A decoded operand: a register index, an immediate value, a memory address,
// or a label (resolved to an instruction index at assemble time).
type Operand =
  | { type: "reg"; reg: number }
  | { type: "imm"; imm: number }
  | { type: "addr"; addr: number }
  | { type: "target"; target: number };

interface Instr {
  op: OpKind;
  args: Operand[];
  line: number; // 1-based source line, for highlighting + errors
  text: string; // trimmed source text of the instruction
}

interface Program {
  instrs: Instr[];
}

interface AssembleError {
  line: number;
  message: string;
}

interface AssembleResult {
  ok: boolean;
  program?: Program;
  error?: AssembleError;
}

interface CpuState {
  regs: number[]; // length NUM_REGS, each >>>0
  mem: number[]; // length NUM_MEM, each >>>0
  pc: number; // instruction index
  z: boolean;
  n: boolean;
  halted: boolean;
  lastReg: number | null; // register written by the last executed step
  lastMem: number | null; // memory cell written by the last executed step
  runtimeError: string | null;
}

const SAMPLE = `; sum the numbers 1..5 into R0  ->  expect 15 (0x0F)
        MOV R0, #0       ; R0 = running total
        MOV R1, #1       ; R1 = counter (i)
        MOV R2, #6       ; R2 = limit (stop when i == 6)
loop:   ADD R0, R0, R1   ; total += i
        ADD R1, R1, #1   ; i += 1
        CMP R1, R2       ; sets Z when i == 6
        JNZ loop         ; keep looping while i != 6
        ST  [0], R0      ; park the result in memory[0]
        HLT`;

// ---------------------------------------------------------------------------
// Assembler
// ---------------------------------------------------------------------------

function stripComment(line: string): string {
  let out = line;
  const semi = out.indexOf(";");
  if (semi !== -1) out = out.slice(0, semi);
  const slash = out.indexOf("//");
  if (slash !== -1) out = out.slice(0, slash);
  return out;
}

const REG_RE = /^R([0-7])$/i;

function parseReg(tok: string): number | null {
  const m = tok.match(REG_RE);
  if (!m) return null;
  return Number(m[1]);
}

function parseIntLiteral(body: string): number | null {
  if (body === "") return null;
  let n: number;
  if (/^-?0x[0-9a-f]+$/i.test(body)) {
    n = parseInt(body, 16);
  } else if (/^-?[0-9]+$/.test(body)) {
    n = parseInt(body, 10);
  } else {
    return null;
  }
  return Number.isFinite(n) ? n : null;
}

function parseImm(tok: string): number | null {
  if (!tok.startsWith("#")) return null;
  const body = tok.slice(1).trim();
  return parseIntLiteral(body);
}

// "[3]" or "[0xF]" -> address number
function parseAddr(tok: string): number | null {
  if (!tok.startsWith("[") || !tok.endsWith("]")) return null;
  const body = tok.slice(1, -1).trim();
  return parseIntLiteral(body);
}

function assemble(source: string): AssembleResult {
  const rawLines = source.split("\n");

  // Pass 1: collect instruction tokens and label positions.
  interface Pending {
    mnemonic: string;
    operands: string[];
    line: number;
    text: string;
  }
  const pending: Pending[] = [];
  const labels = new Map<string, number>();

  for (let i = 0; i < rawLines.length; i++) {
    const lineNo = i + 1;
    let content = stripComment(rawLines[i]).trim();
    if (content === "") continue;

    // Leading label(s): "name:" possibly followed by an instruction.
    // Loop to support "label:" on its own or "label: INSTR".
    for (;;) {
      const colon = content.indexOf(":");
      if (colon === -1) break;
      const before = content.slice(0, colon).trim();
      const after = content.slice(colon + 1).trim();
      if (before === "" || /\s/.test(before)) {
        // colon not part of a leading label (e.g. malformed) — stop here
        break;
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(before)) {
        return {
          ok: false,
          error: { line: lineNo, message: `invalid label name "${before}"` },
        };
      }
      const key = before.toLowerCase();
      if (labels.has(key)) {
        return {
          ok: false,
          error: { line: lineNo, message: `duplicate label "${before}"` },
        };
      }
      // label points at the NEXT instruction index
      labels.set(key, pending.length);
      content = after;
      if (content === "") break;
    }

    if (content === "") continue;

    // Split mnemonic from operand list.
    const spaceIdx = content.search(/\s/);
    const mnemonic = (spaceIdx === -1 ? content : content.slice(0, spaceIdx)).toUpperCase();
    const rest = spaceIdx === -1 ? "" : content.slice(spaceIdx + 1).trim();
    const operands =
      rest === "" ? [] : rest.split(",").map((s) => s.trim()).filter((s) => s !== "");

    pending.push({ mnemonic, operands, line: lineNo, text: content.trim() });
  }

  // Pass 2: decode each instruction, resolving labels.
  const instrs: Instr[] = [];

  const err = (line: number, message: string): AssembleResult => ({
    ok: false,
    error: { line, message },
  });

  for (const p of pending) {
    const { mnemonic, operands, line, text } = p;

    const needReg = (tok: string | undefined): number | string => {
      if (tok === undefined) return "missing register operand";
      const r = parseReg(tok);
      return r === null ? `expected a register R0..R7, got "${tok}"` : r;
    };

    switch (mnemonic) {
      case "MOV": {
        if (operands.length !== 2) return err(line, "MOV expects 2 operands");
        const rd = needReg(operands[0]);
        if (typeof rd === "string") return err(line, rd);
        const imm = parseImm(operands[1]);
        if (imm !== null) {
          instrs.push({
            op: "MOV",
            args: [
              { type: "reg", reg: rd },
              { type: "imm", imm },
            ],
            line,
            text,
          });
        } else {
          const rs = parseReg(operands[1]);
          if (rs === null)
            return err(line, `MOV source must be #imm or a register, got "${operands[1]}"`);
          instrs.push({
            op: "MOV",
            args: [
              { type: "reg", reg: rd },
              { type: "reg", reg: rs },
            ],
            line,
            text,
          });
        }
        break;
      }
      case "ADD":
      case "SUB":
      case "MUL": {
        if (operands.length !== 3) return err(line, `${mnemonic} expects 3 operands`);
        const rd = needReg(operands[0]);
        if (typeof rd === "string") return err(line, rd);
        const rs = needReg(operands[1]);
        if (typeof rs === "string") return err(line, rs);
        const imm = parseImm(operands[2]);
        let third: Operand;
        if (imm !== null) {
          third = { type: "imm", imm };
        } else {
          const rt = parseReg(operands[2]);
          if (rt === null)
            return err(
              line,
              `${mnemonic} third operand must be #imm or a register, got "${operands[2]}"`,
            );
          third = { type: "reg", reg: rt };
        }
        instrs.push({
          op: mnemonic,
          args: [{ type: "reg", reg: rd }, { type: "reg", reg: rs }, third],
          line,
          text,
        });
        break;
      }
      case "LD": {
        if (operands.length !== 2) return err(line, "LD expects 2 operands");
        const rd = needReg(operands[0]);
        if (typeof rd === "string") return err(line, rd);
        const addr = parseAddr(operands[1]);
        if (addr === null) return err(line, `LD address must be [n], got "${operands[1]}"`);
        if (addr < 0 || addr >= NUM_MEM)
          return err(line, `address ${addr} out of range (0..${NUM_MEM - 1})`);
        instrs.push({
          op: "LD",
          args: [{ type: "reg", reg: rd }, { type: "addr", addr }],
          line,
          text,
        });
        break;
      }
      case "ST": {
        if (operands.length !== 2) return err(line, "ST expects 2 operands");
        const addr = parseAddr(operands[0]);
        if (addr === null) return err(line, `ST address must be [n], got "${operands[0]}"`);
        if (addr < 0 || addr >= NUM_MEM)
          return err(line, `address ${addr} out of range (0..${NUM_MEM - 1})`);
        const rs = needReg(operands[1]);
        if (typeof rs === "string") return err(line, rs);
        instrs.push({
          op: "ST",
          args: [{ type: "addr", addr }, { type: "reg", reg: rs }],
          line,
          text,
        });
        break;
      }
      case "CMP": {
        if (operands.length !== 2) return err(line, "CMP expects 2 operands");
        const rs = needReg(operands[0]);
        if (typeof rs === "string") return err(line, rs);
        const rt = needReg(operands[1]);
        if (typeof rt === "string") return err(line, rt);
        instrs.push({
          op: "CMP",
          args: [{ type: "reg", reg: rs }, { type: "reg", reg: rt }],
          line,
          text,
        });
        break;
      }
      case "JMP":
      case "JZ":
      case "JNZ": {
        if (operands.length !== 1) return err(line, `${mnemonic} expects 1 label`);
        const key = operands[0].toLowerCase();
        const target = labels.get(key);
        if (target === undefined) return err(line, `unknown label "${operands[0]}"`);
        instrs.push({
          op: mnemonic,
          args: [{ type: "target", target }],
          line,
          text,
        });
        break;
      }
      case "HLT": {
        if (operands.length !== 0) return err(line, "HLT takes no operands");
        instrs.push({ op: "HLT", args: [], line, text });
        break;
      }
      default:
        return err(line, `unknown instruction "${mnemonic}"`);
    }
  }

  return { ok: true, program: { instrs } };
}

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

const mask = (x: number): number => x >>> 0;

// Interpret a 32-bit word as a signed value (for the N flag and decimal view).
function asSigned(x: number): number {
  const m = mask(x);
  return m >= 0x80000000 ? m - 0x100000000 : m;
}

function freshState(): CpuState {
  return {
    regs: new Array<number>(NUM_REGS).fill(0),
    mem: new Array<number>(NUM_MEM).fill(0),
    pc: 0,
    z: false,
    n: false,
    halted: false,
    lastReg: null,
    lastMem: null,
    runtimeError: null,
  };
}

// Execute exactly one instruction, returning the next state (pure).
function step(prev: CpuState, program: Program): CpuState {
  if (prev.halted || prev.runtimeError) return prev;

  const { instrs } = program;
  if (prev.pc < 0 || prev.pc >= instrs.length) {
    // Running off the end is treated as an implicit halt.
    return { ...prev, halted: true, lastReg: null, lastMem: null };
  }

  const ins = instrs[prev.pc];
  const regs = prev.regs.slice();
  const mem = prev.mem.slice();
  let pc = prev.pc + 1;
  let z = prev.z;
  let n = prev.n;
  let lastReg: number | null = null;
  let lastMem: number | null = null;

  const readOperand = (o: Operand): number => {
    if (o.type === "reg") return regs[o.reg];
    if (o.type === "imm") return mask(o.imm);
    return 0;
  };

  switch (ins.op) {
    case "MOV": {
      const rd = ins.args[0] as { type: "reg"; reg: number };
      regs[rd.reg] = mask(readOperand(ins.args[1]));
      lastReg = rd.reg;
      break;
    }
    case "ADD":
    case "SUB":
    case "MUL": {
      const rd = ins.args[0] as { type: "reg"; reg: number };
      const a = readOperand(ins.args[1]);
      const b = readOperand(ins.args[2]);
      let r: number;
      if (ins.op === "ADD") r = a + b;
      else if (ins.op === "SUB") r = a - b;
      else r = Math.imul(a, b); // 32-bit wrapping multiply
      regs[rd.reg] = mask(r);
      lastReg = rd.reg;
      break;
    }
    case "LD": {
      const rd = ins.args[0] as { type: "reg"; reg: number };
      const addr = (ins.args[1] as { type: "addr"; addr: number }).addr;
      regs[rd.reg] = mask(mem[addr]);
      lastReg = rd.reg;
      break;
    }
    case "ST": {
      const addr = (ins.args[0] as { type: "addr"; addr: number }).addr;
      const rs = ins.args[1] as { type: "reg"; reg: number };
      mem[addr] = mask(regs[rs.reg]);
      lastMem = addr;
      break;
    }
    case "CMP": {
      const a = regs[(ins.args[0] as { type: "reg"; reg: number }).reg];
      const b = regs[(ins.args[1] as { type: "reg"; reg: number }).reg];
      const diff = mask(a - b);
      z = diff === 0;
      n = (diff & 0x80000000) !== 0;
      break;
    }
    case "JMP": {
      pc = (ins.args[0] as { type: "target"; target: number }).target;
      break;
    }
    case "JZ": {
      if (z) pc = (ins.args[0] as { type: "target"; target: number }).target;
      break;
    }
    case "JNZ": {
      if (!z) pc = (ins.args[0] as { type: "target"; target: number }).target;
      break;
    }
    case "HLT": {
      return {
        regs,
        mem,
        pc: prev.pc,
        z,
        n,
        halted: true,
        lastReg: null,
        lastMem: null,
        runtimeError: null,
      };
    }
  }

  return { regs, mem, pc, z, n, halted: false, lastReg, lastMem, runtimeError: null };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const hex32 = (x: number): string => "0x" + mask(x).toString(16).toUpperCase().padStart(8, "0");
const hex8 = (x: number): string => "0x" + mask(x).toString(16).toUpperCase().padStart(2, "0");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CpuSim() {
  const [source, setSource] = useState<string>(SAMPLE);
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<AssembleError | null>(null);
  const [cpu, setCpu] = useState<CpuState>(() => freshState());
  const [steps, setSteps] = useState<number>(0);

  // Map instruction index -> source line, for PC highlighting in the listing.
  const lineForPc = useMemo<number | null>(() => {
    if (!program || cpu.halted) return null;
    const ins = program.instrs[cpu.pc];
    return ins ? ins.line : null;
  }, [program, cpu.pc, cpu.halted]);

  const haltLine = useMemo<number | null>(() => {
    if (!program || !cpu.halted) return null;
    const ins = program.instrs[cpu.pc];
    return ins ? ins.line : null;
  }, [program, cpu.pc, cpu.halted]);

  const sourceLines = useMemo(() => source.split("\n"), [source]);

  const doAssemble = useCallback((): Program | null => {
    const res = assemble(source);
    if (!res.ok || !res.program) {
      setError(res.error ?? { line: 0, message: "assemble failed" });
      setProgram(null);
      setCpu(freshState());
      setSteps(0);
      return null;
    }
    setError(null);
    setProgram(res.program);
    setCpu(freshState());
    setSteps(0);
    return res.program;
  }, [source]);

  const doStep = useCallback(() => {
    const prog = program ?? doAssemble();
    if (!prog) return;
    setCpu((prev) => {
      if (prev.halted || prev.runtimeError) return prev;
      return step(prev, prog);
    });
    setSteps((s) => s + 1);
  }, [program, doAssemble]);

  const doRun = useCallback(() => {
    const prog = program ?? doAssemble();
    if (!prog) return;
    setCpu((prev) => {
      if (prev.halted || prev.runtimeError) return prev;
      let cur = prev;
      let count = 0;
      while (!cur.halted && !cur.runtimeError && count < STEP_CAP) {
        cur = step(cur, prog);
        count++;
      }
      if (!cur.halted && !cur.runtimeError && count >= STEP_CAP) {
        cur = { ...cur, runtimeError: `step cap (${STEP_CAP}) reached — possible infinite loop` };
      }
      // Account for the steps just executed. A functional update keeps the
      // count correct even if React re-invokes this updater (Strict Mode).
      setSteps((s) => s + count);
      return cur;
    });
  }, [program, doAssemble]);

  const doReset = useCallback(() => {
    if (program) {
      setCpu(freshState());
      setSteps(0);
    } else {
      doAssemble();
    }
  }, [program, doAssemble]);

  const onSourceChange = (val: string) => {
    setSource(val);
    // Editing invalidates the assembled program; force a re-assemble.
    setProgram(null);
    setError(null);
    setCpu(freshState());
    setSteps(0);
  };

  const statusColor = cpu.runtimeError
    ? "#f85149"
    : cpu.halted
      ? "#bc8cff"
      : program
        ? "#3fb950"
        : "#8a97a8";
  const statusText = cpu.runtimeError
    ? "error"
    : cpu.halted
      ? "halted"
      : program
        ? "ready"
        : "not assembled";

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={doAssemble}
          className="mono text-xs rounded px-3 py-1.5 border transition-colors"
          style={{
            background: "var(--color-green)",
            color: "#06121a",
            borderColor: "var(--color-green)",
          }}
        >
          Assemble
        </button>
        <button
          onClick={doStep}
          disabled={cpu.halted || !!cpu.runtimeError}
          className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-text transition-colors enabled:hover:border-faint/50 disabled:opacity-40"
        >
          Step
        </button>
        <button
          onClick={doRun}
          disabled={cpu.halted || !!cpu.runtimeError}
          className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-text transition-colors enabled:hover:border-faint/50 disabled:opacity-40"
        >
          Run
        </button>
        <button
          onClick={doReset}
          className="mono text-xs rounded px-3 py-1.5 border border-border bg-surface text-muted hover:text-text transition-colors"
        >
          Reset
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className="mono text-[11px] text-faint">steps: {steps}</span>
          <span
            className="mono text-xs rounded px-2.5 py-1 border"
            style={{
              color: statusColor,
              borderColor: statusColor + "55",
              background: statusColor + "14",
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* error banner */}
      {error && (
        <div
          className="card p-3 mono text-xs"
          style={{ borderColor: "#f8514955", background: "#f8514914", color: "#f85149" }}
        >
          {error.line > 0 ? `line ${error.line}: ` : ""}
          {error.message}
        </div>
      )}
      {cpu.runtimeError && (
        <div
          className="card p-3 mono text-xs"
          style={{ borderColor: "#f8514955", background: "#f8514914", color: "#f85149" }}
        >
          runtime: {cpu.runtimeError}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* editor + listing */}
        <div className="space-y-4">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-1.5">
              source
            </div>
            <textarea
              value={source}
              onChange={(e) => onSourceChange(e.target.value)}
              spellCheck={false}
              rows={12}
              className="w-full bg-surface border border-border rounded px-3 py-2.5 mono text-xs text-text leading-relaxed outline-none focus:border-faint/50 resize-y"
            />
          </div>

          {program && (
            <div className="card p-0 overflow-hidden">
              <div className="mono text-[10px] uppercase tracking-widest text-faint px-3 pt-3 pb-1.5">
                program · PC highlighted
              </div>
              <div className="overflow-x-auto">
                {sourceLines.map((ln, i) => {
                  const lineNo = i + 1;
                  const isCurrent = lineForPc === lineNo;
                  const isHalt = haltLine === lineNo;
                  const active = isCurrent || isHalt;
                  const barColor = isHalt ? "#bc8cff" : "#3fb950";
                  return (
                    <div
                      key={i}
                      className="flex items-stretch min-w-max"
                      style={{ background: active ? barColor + "1a" : "transparent" }}
                    >
                      <span
                        className="w-1"
                        style={{ background: active ? barColor : "transparent" }}
                      />
                      <span className="mono text-[10px] text-faint w-8 text-right pr-2 py-0.5 select-none">
                        {lineNo}
                      </span>
                      <span
                        className="mono text-xs py-0.5 pr-4 whitespace-pre"
                        style={{ color: active ? barColor : ln.trim() === "" ? "#5b6b7d" : "#d6dee8" }}
                      >
                        {ln === "" ? " " : ln}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* machine state */}
        <div className="space-y-4">
          {/* PC + flags */}
          <div className="grid grid-cols-3 gap-3">
            <StateCell label="PC" value={String(cpu.pc)} color="#39c5e0" />
            <StateCell label="Z flag" value={cpu.z ? "1" : "0"} color={cpu.z ? "#3fb950" : "#5b6b7d"} />
            <StateCell label="N flag" value={cpu.n ? "1" : "0"} color={cpu.n ? "#e3a93c" : "#5b6b7d"} />
          </div>

          {/* register file */}
          <div className="card p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
              register file
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cpu.regs.map((v, i) => {
                const flashed = cpu.lastReg === i;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors"
                    style={{
                      borderColor: flashed ? "#56d364" : "#1e2630",
                      background: flashed ? "#56d3641f" : "#07090d",
                    }}
                  >
                    <span
                      className="mono text-xs font-bold w-7"
                      style={{ color: flashed ? "#56d364" : "#8a97a8" }}
                    >
                      R{i}
                    </span>
                    <div className="flex flex-col leading-tight overflow-hidden">
                      <span className="mono text-xs text-text truncate" title={hex32(v)}>
                        {hex32(v)}
                      </span>
                      <span className="mono text-[10px] text-faint truncate">
                        {asSigned(v).toString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* memory grid */}
          <div className="card p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
              data memory · 16 cells
            </div>
            <div className="grid grid-cols-4 gap-2">
              {cpu.mem.map((v, i) => {
                const flashed = cpu.lastMem === i;
                const nonzero = mask(v) !== 0;
                return (
                  <div
                    key={i}
                    className="rounded-md border px-1.5 py-1 text-center transition-colors"
                    style={{
                      borderColor: flashed ? "#39c5e0" : "#1e2630",
                      background: flashed ? "#39c5e01f" : "#07090d",
                    }}
                    title={`mem[${i}] = ${hex32(v)} (${asSigned(v)})`}
                  >
                    <div
                      className="mono text-[9px]"
                      style={{ color: flashed ? "#39c5e0" : "#5b6b7d" }}
                    >
                      {i.toString().padStart(2, "0")}
                    </div>
                    <div
                      className="mono text-[11px] font-bold truncate"
                      style={{ color: flashed ? "#39c5e0" : nonzero ? "#d6dee8" : "#5b6b7d" }}
                    >
                      {mask(v) > 0xff ? hex32(v) : hex8(v)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ISA reference */}
      <div className="card p-4 mono text-[11px] text-muted leading-relaxed">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
          instruction set
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <span><span className="text-cyan">MOV</span> Rd, #imm | Rs — load</span>
          <span><span className="text-cyan">CMP</span> Rs, Rt — set Z/N from Rs−Rt</span>
          <span><span className="text-cyan">ADD/SUB/MUL</span> Rd, Rs, Rt|#imm</span>
          <span><span className="text-cyan">JMP</span> label — unconditional jump</span>
          <span><span className="text-cyan">LD</span> Rd, [addr] — load memory</span>
          <span><span className="text-cyan">JZ / JNZ</span> label — jump if (not) Z</span>
          <span><span className="text-cyan">ST</span> [addr], Rs — store memory</span>
          <span><span className="text-cyan">HLT</span> — stop the machine</span>
        </div>
        <p className="mt-3 text-faint">
          8 registers (32-bit, wrap-around), 16 memory cells, PC counts instructions.
          Comments start with <span className="text-text">;</span> or{" "}
          <span className="text-text">//</span>; labels end with{" "}
          <span className="text-text">:</span>. Run executes up to {STEP_CAP} steps.
        </p>
      </div>
    </div>
  );
}

function StateCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-xl font-bold mt-1 truncate" style={{ color }} title={value}>
        {value}
      </div>
    </div>
  );
}
