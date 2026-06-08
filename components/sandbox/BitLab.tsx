"use client";

import { useMemo, useState } from "react";

type Width = 8 | 16 | 32;

function maskFor(w: Width): number {
  // 32-bit safe using unsigned shift; for 32 use 0xFFFFFFFF
  return w === 32 ? 0xffffffff : (1 << w) - 1;
}

function toUnsigned(v: number, w: Width): number {
  return (v & maskFor(w)) >>> 0;
}

function toSigned(v: number, w: Width): number {
  const u = toUnsigned(v, w);
  const signBit = 1 << (w - 1);
  // for w=32, 1<<31 is negative in JS; handle via >>>
  if (w === 32) {
    return u >= 0x80000000 ? u - 0x100000000 : u;
  }
  return u & signBit ? u - (1 << w) : u;
}

function bin(v: number, w: Width): string {
  return toUnsigned(v, w).toString(2).padStart(w, "0");
}

export default function BitLab() {
  const [width, setWidth] = useState<Width>(8);
  const [value, setValue] = useState<number>(42);
  const [shift, setShift] = useState<number>(1);
  const [operand, setOperand] = useState<number>(12);

  const u = toUnsigned(value, width);
  const s = toSigned(value, width);
  const bits = bin(value, width).split("");
  const popcount = bits.filter((b) => b === "1").length;

  const toggleBit = (idx: number) => {
    const bitPos = width - 1 - idx;
    setValue((v) => toUnsigned(v ^ (1 << bitPos), width));
  };

  const ops = useMemo(() => {
    const b = toUnsigned(operand, width);
    return [
      { label: `A & B`, val: toUnsigned(u & b, width) },
      { label: `A | B`, val: toUnsigned(u | b, width) },
      { label: `A ^ B`, val: toUnsigned(u ^ b, width) },
      { label: `~A`, val: toUnsigned(~u, width) },
      { label: `A << ${shift}`, val: toUnsigned(u << shift, width) },
      { label: `A >> ${shift}`, val: toUnsigned(u >>> shift, width) },
    ];
  }, [u, operand, shift, width]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono text-[11px] uppercase tracking-widest text-faint">
          width
        </span>
        {([8, 16, 32] as Width[]).map((w) => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            className="mono text-xs rounded px-3 py-1 border transition-colors"
            style={{
              background: width === w ? "var(--color-green)" : "transparent",
              color: width === w ? "#06121a" : "var(--color-muted)",
              borderColor: width === w ? "var(--color-green)" : "var(--color-border)",
            }}
          >
            {w}-bit
          </button>
        ))}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(toUnsigned(Number(e.target.value) || 0, width))}
          className="ml-auto w-32 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
        />
      </div>

      {/* bit grid */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex flex-wrap gap-1 justify-center">
          {bits.map((b, i) => {
            const bitPos = width - 1 - i;
            const isByteBoundary = bitPos % 8 === 0 && i !== bits.length - 1;
            return (
              <div key={i} className="flex">
                <button
                  onClick={() => toggleBit(i)}
                  className="grid place-items-center rounded mono text-sm font-bold transition-all"
                  style={{
                    width: 34,
                    height: 40,
                    background: b === "1" ? "var(--color-green)" : "#10151d",
                    color: b === "1" ? "#06121a" : "#5b6b7d",
                    border: `1px solid ${b === "1" ? "var(--color-green)" : "#1e2630"}`,
                  }}
                  title={`bit ${bitPos} (value ${1 << bitPos > 0 ? 2 ** bitPos : "—"})`}
                >
                  {b}
                </button>
                {isByteBoundary && <span className="w-2" />}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 justify-center mono text-[9px] text-faint">
          {bits.map((_, i) => (
            <span key={i} style={{ width: 34 }} className="text-center">
              {width - 1 - i}
            </span>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-faint">
          click any bit to flip it
        </p>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Read label="unsigned" value={u.toString()} color="#3fb950" />
        <Read label="signed (2's comp)" value={s.toString()} color="#bc8cff" />
        <Read label="hex" value={"0x" + u.toString(16).toUpperCase()} color="#39c5e0" />
        <Read label="set bits" value={String(popcount)} color="#e3a93c" />
      </div>

      {/* bitwise ops */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="mono text-xs text-muted">A = {u}</span>
          <label className="mono text-xs text-muted flex items-center gap-2">
            B =
            <input
              type="number"
              value={operand}
              onChange={(e) => setOperand(toUnsigned(Number(e.target.value) || 0, width))}
              className="w-24 bg-surface border border-border rounded px-2 py-1 mono text-sm text-text outline-none"
            />
          </label>
          <label className="mono text-xs text-muted flex items-center gap-2">
            shift =
            <input
              type="number"
              min={0}
              max={width}
              value={shift}
              onChange={(e) => setShift(Math.max(0, Math.min(width, Number(e.target.value) || 0)))}
              className="w-16 bg-surface border border-border rounded px-2 py-1 mono text-sm text-text outline-none"
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {ops.map((op) => (
            <div
              key={op.label}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg px-3 py-2"
            >
              <span className="mono text-xs text-cyan">{op.label}</span>
              <span className="mono text-xs text-faint truncate">
                {bin(op.val, width)}
              </span>
              <span className="mono text-sm text-text font-bold">{op.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Read({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-lg font-bold mt-1 truncate" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
