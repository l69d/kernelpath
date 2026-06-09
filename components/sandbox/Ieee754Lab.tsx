"use client";

import { useMemo, useState } from "react";

// Shared 4-byte buffer to read the real IEEE-754 single-precision bits.
const buf = new ArrayBuffer(4);
const f32 = new Float32Array(buf);
const u32 = new Uint32Array(buf);

function floatToBits(x: number): number {
  f32[0] = x;
  return u32[0] >>> 0;
}
function bitsToFloat(bits: number): number {
  u32[0] = bits >>> 0;
  return f32[0];
}

function decompose(bits: number) {
  const sign = (bits >>> 31) & 1;
  const exp = (bits >>> 23) & 0xff;
  const mant = bits & 0x7fffff;
  return { sign, exp, mant };
}

function classify(exp: number, mant: number): { kind: string; color: string } {
  if (exp === 0) {
    return mant === 0
      ? { kind: "zero", color: "#5b6b7d" }
      : { kind: "subnormal", color: "#e3a93c" };
  }
  if (exp === 0xff) {
    return mant === 0
      ? { kind: "infinity", color: "#bc8cff" }
      : { kind: "NaN", color: "#f85149" };
  }
  return { kind: "normal", color: "#3fb950" };
}

export default function Ieee754Lab() {
  const [bits, setBits] = useState<number>(() => floatToBits(3.14));
  const [input, setInput] = useState<string>("3.14");

  const { sign, exp, mant } = decompose(bits);
  const value = bitsToFloat(bits);
  const cls = classify(exp, mant);
  const unbiasedExp = exp - 127;

  const bitArray = useMemo(
    () => bits.toString(2).padStart(32, "0").split("").map(Number),
    [bits],
  );

  const toggleBit = (i: number) => {
    const pos = 31 - i;
    const next = (bits ^ (1 << pos)) >>> 0;
    setBits(next);
    setInput(formatNum(bitsToFloat(next)));
  };

  const applyInput = (raw: string) => {
    setInput(raw);
    const t = raw.trim().toLowerCase();
    const n = Number(raw);
    if (t === "nan") setBits(floatToBits(NaN));
    else if (t === "infinity" || t === "inf") setBits(floatToBits(Infinity));
    else if (t === "-infinity" || t === "-inf") setBits(floatToBits(-Infinity));
    else if (raw.trim() !== "" && Number.isFinite(n)) setBits(floatToBits(n));
  };

  // mantissa as actual fraction value 1.xxxx or 0.xxxx for subnormal
  const mantFraction = mant / 0x800000;
  const leading = exp === 0 ? 0 : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="mono text-xs text-muted flex items-center gap-2">
          float =
          <input
            value={input}
            onChange={(e) => applyInput(e.target.value)}
            className="w-40 bg-surface border border-border rounded px-3 py-1.5 mono text-sm text-text outline-none focus:border-faint/50"
            placeholder="e.g. 3.14"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "0.1", v: 0.1 },
            { label: "1/3", v: 1 / 3 },
            { label: "π", v: Math.PI },
            { label: "-2.5", v: -2.5 },
            { label: "∞", v: Infinity },
            { label: "NaN", v: NaN },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setBits(floatToBits(p.v));
                setInput(formatNum(p.v));
              }}
              className="mono text-[11px] rounded px-2 py-1 border border-border bg-surface text-muted hover:text-text"
            >
              {p.label}
            </button>
          ))}
        </div>
        <span
          className="ml-auto mono text-xs rounded px-2.5 py-1 border"
          style={{ color: cls.color, borderColor: cls.color + "55", background: cls.color + "14" }}
        >
          {cls.kind}
        </span>
      </div>

      {/* bit field */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex justify-center gap-1 min-w-max">
          {bitArray.map((b, i) => {
            const field = i === 0 ? "sign" : i <= 8 ? "exp" : "mant";
            const fieldColor =
              field === "sign" ? "#f85149" : field === "exp" ? "#39c5e0" : "#bc8cff";
            const on = b === 1;
            return (
              <button
                key={i}
                onClick={() => toggleBit(i)}
                className="grid place-items-center rounded mono text-xs font-bold transition-all"
                style={{
                  width: 22,
                  height: 34,
                  background: on ? fieldColor : "#10151d",
                  color: on ? "#06121a" : "#3a4654",
                  border: `1px solid ${on ? fieldColor : "#1e2630"}`,
                  marginRight: i === 0 || i === 8 ? 6 : 0,
                }}
                title={`${field} bit`}
              >
                {b}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-center gap-1.5 min-w-max">
          <FieldTag w={22} color="#f85149" label="sign" />
          <FieldTag w={22 * 8 + 7 * 4} color="#39c5e0" label="exponent · 8 bits" />
          <FieldTag w={22 * 23 + 22 * 4} color="#bc8cff" label="mantissa · 23 bits" />
        </div>
        <p className="mt-3 text-center text-xs text-faint">
          click any bit to flip it — watch the value jump
        </p>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Cell label="stored value" value={formatNum(value)} color="#3fb950" />
        <Cell label="sign" value={sign === 1 ? "− (1)" : "+ (0)"} color="#f85149" />
        <Cell label="exponent" value={`${exp} − 127 = ${unbiasedExp}`} color="#39c5e0" />
        <Cell label="hex" value={"0x" + bits.toString(16).toUpperCase().padStart(8, "0")} color="#e3a93c" />
      </div>

      {/* formula */}
      <div className="card p-4 mono text-xs text-muted leading-relaxed">
        <div className="text-faint uppercase tracking-widest text-[10px] mb-2">
          how the bits become a number
        </div>
        <div className="space-y-1 break-all">
          <div>
            value = (−1)<sup>{sign}</sup> × {leading}.{mant.toString(2).padStart(23, "0")}
            <sub>2</sub> × 2<sup>{exp === 0 ? -126 : unbiasedExp}</sup>
          </div>
          <div>
            = <span className="text-cyan">{sign === 1 ? "−" : "+"}</span>
            {" "}
            <span className="text-purple">{(leading + mantFraction).toPrecision(9)}</span>
            {" "}× 2<sup>{exp === 0 ? -126 : unbiasedExp}</sup> ={" "}
            <span className="text-green">{formatNum(value)}</span>
          </div>
        </div>
        <p className="mt-3 text-faint">
          {cls.kind === "subnormal"
            ? "Subnormal: exponent bits are all 0, so there is no implicit leading 1 — used for values very close to zero."
            : cls.kind === "NaN"
              ? "Not-a-Number: exponent all 1s and a non-zero mantissa. Any operation touching a NaN yields NaN."
              : cls.kind === "infinity"
                ? "Infinity: exponent all 1s, mantissa 0. Produced by overflow or x/0."
                : "Normal number: an implicit leading 1 is prepended to the 23 mantissa bits, giving 24 bits of precision (~7 decimal digits). This is why 0.1 can't be stored exactly."}
        </p>
      </div>
    </div>
  );
}

function formatNum(x: number): string {
  if (Number.isNaN(x)) return "NaN";
  if (!Number.isFinite(x)) return x > 0 ? "Infinity" : "-Infinity";
  if (x === 0) return Object.is(x, -0) ? "-0" : "0";
  const a = Math.abs(x);
  if (a < 1e-4 || a >= 1e7) return x.toExponential(6);
  return String(Number(x.toPrecision(8)));
}

function FieldTag({ w, color, label }: { w: number; color: string; label: string }) {
  return (
    <div
      className="text-center mono text-[9px] uppercase tracking-wider rounded-sm py-0.5 overflow-hidden whitespace-nowrap"
      style={{ width: w, color, background: color + "14", border: `1px solid ${color}33` }}
    >
      {label}
    </div>
  );
}

function Cell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className="mono text-base font-bold mt-1 truncate" style={{ color }} title={value}>
        {value}
      </div>
    </div>
  );
}
