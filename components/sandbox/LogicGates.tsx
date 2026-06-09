"use client";

import { useMemo, useState } from "react";

type Bit = 0 | 1;

// Every gate, derived from the two boolean inputs A and B.
function gateOutputs(a: Bit, b: Bit) {
  const and = (a & b) as Bit;
  const or = (a | b) as Bit;
  const notA = (a ^ 1) as Bit;
  const nand = (and ^ 1) as Bit;
  const nor = (or ^ 1) as Bit;
  const xor = (a ^ b) as Bit;
  const xnor = (xor ^ 1) as Bit;
  return { and, or, notA, nand, nor, xor, xnor };
}

// Half adder: Sum = A XOR B, Carry = A AND B.
function halfAdder(a: Bit, b: Bit): { sum: Bit; carry: Bit } {
  return { sum: (a ^ b) as Bit, carry: (a & b) as Bit };
}

// Full adder: ripple a carry-in through two half adders + an OR.
function fullAdder(a: Bit, b: Bit, cin: Bit): { sum: Bit; cout: Bit } {
  const sum = (a ^ b ^ cin) as Bit;
  const cout = (((a & b) | (cin & (a ^ b))) >>> 0) as Bit;
  return { sum, cout };
}

const GATES: {
  key: keyof ReturnType<typeof gateOutputs>;
  label: string;
  expr: string;
  color: string;
}[] = [
  { key: "and", label: "AND", expr: "A · B", color: "#3fb950" },
  { key: "or", label: "OR", expr: "A + B", color: "#39c5e0" },
  { key: "notA", label: "NOT A", expr: "Ā", color: "#bc8cff" },
  { key: "nand", label: "NAND", expr: "A · B‾", color: "#e3a93c" },
  { key: "nor", label: "NOR", expr: "A + B‾", color: "#f778ba" },
  { key: "xor", label: "XOR", expr: "A ⊕ B", color: "#58a6ff" },
  { key: "xnor", label: "XNOR", expr: "A ⊕ B‾", color: "#f85149" },
];

export default function LogicGates() {
  const [a, setA] = useState<Bit>(1);
  const [b, setB] = useState<Bit>(0);
  const [cin, setCin] = useState<Bit>(0);

  const gates = useMemo(() => gateOutputs(a, b), [a, b]);
  const ha = useMemo(() => halfAdder(a, b), [a, b]);
  const fa = useMemo(() => fullAdder(a, b, cin), [a, b, cin]);

  // 4-row half-adder truth table (A,B).
  const haRows = useMemo(() => {
    const rows: { a: Bit; b: Bit; sum: Bit; carry: Bit }[] = [];
    for (let x = 0; x < 4; x++) {
      const ra = ((x >> 1) & 1) as Bit;
      const rb = (x & 1) as Bit;
      const r = halfAdder(ra, rb);
      rows.push({ a: ra, b: rb, ...r });
    }
    return rows;
  }, []);

  // 8-row full-adder truth table (A,B,Cin).
  const faRows = useMemo(() => {
    const rows: { a: Bit; b: Bit; cin: Bit; sum: Bit; cout: Bit }[] = [];
    for (let x = 0; x < 8; x++) {
      const ra = ((x >> 2) & 1) as Bit;
      const rb = ((x >> 1) & 1) as Bit;
      const rc = (x & 1) as Bit;
      const r = fullAdder(ra, rb, rc);
      rows.push({ a: ra, b: rb, cin: rc, ...r });
    }
    return rows;
  }, []);

  return (
    <div className="space-y-6">
      {/* input toggles */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          inputs
        </span>
        <Toggle label="A" value={a} onToggle={() => setA((v) => (v ^ 1) as Bit)} />
        <Toggle label="B" value={b} onToggle={() => setB((v) => (v ^ 1) as Bit)} />
        <Toggle
          label="Cin"
          value={cin}
          onToggle={() => setCin((v) => (v ^ 1) as Bit)}
        />
        <span className="ml-auto mono text-[11px] text-faint">
          click a switch to flip 0 ↔ 1
        </span>
      </div>

      {/* live gate readouts */}
      <div className="card p-4">
        <div className="mono text-[10px] uppercase tracking-widest text-faint mb-3">
          live gate outputs · A = {a}, B = {b}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {GATES.map((g) => (
            <GateCell
              key={g.key}
              label={g.label}
              expr={g.expr}
              value={gates[g.key]}
              color={g.color}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          A cell glows when its gate outputs{" "}
          <span className="text-green">1</span>. NOT A ignores B; every other
          gate combines both inputs.
        </p>
      </div>

      {/* half adder */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="mono text-[10px] uppercase tracking-widest text-faint">
            half adder
          </span>
          <span className="mono text-[11px] text-muted">
            two inputs A, B → Sum &amp; Carry
          </span>
        </div>

        {/* tiny diagram */}
        <div className="flex flex-wrap items-stretch gap-2 mb-4">
          <div className="flex flex-col gap-1.5 justify-center">
            <Pill label="A" value={a} />
            <Pill label="B" value={b} />
          </div>
          <Arrow />
          <div className="flex flex-col gap-1.5 justify-center">
            <WireBox label="Sum = A ⊕ B" value={ha.sum} color="#58a6ff" />
            <WireBox label="Carry = A · B" value={ha.carry} color="#e3a93c" />
          </div>
        </div>

        {/* truth table */}
        <div className="overflow-x-auto">
          <table className="w-full mono text-xs border-collapse min-w-max">
            <thead>
              <tr>
                <Th>A</Th>
                <Th>B</Th>
                <Th color="#58a6ff">Sum</Th>
                <Th color="#e3a93c">Carry</Th>
              </tr>
            </thead>
            <tbody>
              {haRows.map((r, i) => {
                const active = r.a === a && r.b === b;
                return (
                  <tr
                    key={i}
                    style={{
                      background: active ? "rgba(63,185,80,0.10)" : "transparent",
                    }}
                  >
                    <Td active={active}>{r.a}</Td>
                    <Td active={active}>{r.b}</Td>
                    <Td active={active} on={r.sum === 1} color="#58a6ff">
                      {r.sum}
                    </Td>
                    <Td active={active} on={r.carry === 1} color="#e3a93c">
                      {r.carry}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* full adder */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="mono text-[10px] uppercase tracking-widest text-faint">
            full adder
          </span>
          <span className="mono text-[11px] text-muted">
            three inputs A, B, Cin → Sum &amp; Cout
          </span>
        </div>

        <div className="flex flex-wrap items-stretch gap-2 mb-4">
          <div className="flex flex-col gap-1.5 justify-center">
            <Pill label="A" value={a} />
            <Pill label="B" value={b} />
            <Pill label="Cin" value={cin} />
          </div>
          <Arrow />
          <div className="flex flex-col gap-1.5 justify-center">
            <WireBox label="Sum = A ⊕ B ⊕ Cin" value={fa.sum} color="#58a6ff" />
            <WireBox
              label="Cout = A·B + Cin·(A⊕B)"
              value={fa.cout}
              color="#e3a93c"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full mono text-xs border-collapse min-w-max">
            <thead>
              <tr>
                <Th>A</Th>
                <Th>B</Th>
                <Th>Cin</Th>
                <Th color="#58a6ff">Sum</Th>
                <Th color="#e3a93c">Cout</Th>
              </tr>
            </thead>
            <tbody>
              {faRows.map((r, i) => {
                const active = r.a === a && r.b === b && r.cin === cin;
                return (
                  <tr
                    key={i}
                    style={{
                      background: active ? "rgba(63,185,80,0.10)" : "transparent",
                    }}
                  >
                    <Td active={active}>{r.a}</Td>
                    <Td active={active}>{r.b}</Td>
                    <Td active={active}>{r.cin}</Td>
                    <Td active={active} on={r.sum === 1} color="#58a6ff">
                      {r.sum}
                    </Td>
                    <Td active={active} on={r.cout === 1} color="#e3a93c">
                      {r.cout}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-faint">
          A full adder chains two half adders plus an OR. Wire <em>n</em> of them
          in a carry chain and you have an <em>n</em>-bit adder — the core of an
          ALU.
        </p>
      </div>

      {/* NAND universality note */}
      <div className="card p-4 mono text-xs text-muted leading-relaxed">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
          why NAND is enough
        </div>
        <p>
          NAND is a <span className="text-green">universal gate</span>: every gate
          above can be built from NANDs alone. Let{" "}
          <span className="text-cyan">n(x,y) = NAND</span>.
        </p>
        <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <div>
            NOT A = <span className="text-text">n(A, A)</span>
          </div>
          <div>
            AND = <span className="text-text">n( n(A,B), n(A,B) )</span>
          </div>
          <div>
            OR = <span className="text-text">n( n(A,A), n(B,B) )</span>
          </div>
          <div>
            NOR = <span className="text-text">NOT( OR )</span>
          </div>
          <div>
            XOR ={" "}
            <span className="text-text">n( n(A,n(A,B)), n(B,n(A,B)) )</span>
          </div>
          <div>
            XNOR = <span className="text-text">NOT( XOR )</span>
          </div>
        </div>
        <p className="mt-3 text-faint">
          Because a half adder is just XOR + AND, and a full adder is just half
          adders + OR, an entire CPU&apos;s arithmetic can be etched from one
          repeated transistor pattern.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: Bit;
  onToggle: () => void;
}) {
  const on = value === 1;
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 border transition-colors"
      style={{
        background: on ? "rgba(63,185,80,0.12)" : "var(--color-surface)",
        borderColor: on ? "var(--color-green)" : "var(--color-border)",
      }}
      aria-pressed={on}
      title={`toggle ${label}`}
    >
      <span className="mono text-xs font-bold text-text">{label}</span>
      <span
        className="grid place-items-center rounded mono text-sm font-bold"
        style={{
          width: 30,
          height: 30,
          background: on ? "var(--color-green)" : "#10151d",
          color: on ? "#06121a" : "#5b6b7d",
          border: `1px solid ${on ? "var(--color-green)" : "#1e2630"}`,
        }}
      >
        {value}
      </span>
    </button>
  );
}

function GateCell({
  label,
  expr,
  value,
  color,
}: {
  label: string;
  expr: string;
  value: Bit;
  color: string;
}) {
  const on = value === 1;
  return (
    <div
      className="rounded-md border px-3 py-2.5 transition-all"
      style={{
        background: on ? color + "1f" : "var(--color-bg)",
        borderColor: on ? color : "var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="mono text-xs font-bold"
          style={{ color: on ? color : "var(--color-muted)" }}
        >
          {label}
        </span>
        <span
          className="grid place-items-center rounded mono text-sm font-bold"
          style={{
            width: 26,
            height: 26,
            background: on ? color : "#10151d",
            color: on ? "#06121a" : "#5b6b7d",
            border: `1px solid ${on ? color : "#1e2630"}`,
          }}
        >
          {value}
        </span>
      </div>
      <div className="mono text-[10px] text-faint mt-1.5">{expr}</div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: Bit }) {
  const on = value === 1;
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-[11px] text-muted w-7 text-right">{label}</span>
      <span
        className="grid place-items-center rounded mono text-xs font-bold"
        style={{
          width: 26,
          height: 26,
          background: on ? "var(--color-green)" : "#10151d",
          color: on ? "#06121a" : "#5b6b7d",
          border: `1px solid ${on ? "var(--color-green)" : "#1e2630"}`,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <div className="grid place-items-center px-1 mono text-base text-faint select-none">
      →
    </div>
  );
}

function WireBox({
  label,
  value,
  color,
}: {
  label: string;
  value: Bit;
  color: string;
}) {
  const on = value === 1;
  return (
    <div
      className="flex items-center gap-2.5 rounded-md border px-3 py-1.5"
      style={{
        background: on ? color + "1f" : "var(--color-bg)",
        borderColor: on ? color : "var(--color-border)",
      }}
    >
      <span
        className="grid place-items-center rounded mono text-xs font-bold"
        style={{
          width: 26,
          height: 26,
          background: on ? color : "#10151d",
          color: on ? "#06121a" : "#5b6b7d",
          border: `1px solid ${on ? color : "#1e2630"}`,
        }}
      >
        {value}
      </span>
      <span className="mono text-[11px]" style={{ color: on ? color : "var(--color-muted)" }}>
        {label}
      </span>
    </div>
  );
}

function Th({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <th
      className="text-center font-bold px-3 py-1.5 border-b border-border"
      style={{ color: color ?? "var(--color-faint)" }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  active,
  on,
  color,
}: {
  children: React.ReactNode;
  active: boolean;
  on?: boolean;
  color?: string;
}) {
  const lit = on === true;
  return (
    <td
      className="text-center px-3 py-1.5 border-b border-border font-bold"
      style={{
        color: lit
          ? (color ?? "var(--color-green)")
          : active
            ? "var(--color-text)"
            : "var(--color-muted)",
      }}
    >
      {children}
    </td>
  );
}
