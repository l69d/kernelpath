"use client";

import { useEffect, useState } from "react";

/* ================================================================== *
 *  t11-04 — Kernel Security: Spectre / Meltdown side-channel.
 *  A conceptual stepper. The CPU speculatively runs past a bounds
 *  check, touches secret-dependent memory, gets rolled back
 *  architecturally — but the cache footprint survives, and a timing
 *  probe reads it back out. Self-contained client component.
 * ================================================================== */

type Phase = {
  k: string;
  title: string;
  body: string;
  c: string;
};

const PHASES: Phase[] = [
  {
    k: "00",
    title: "The bounds check",
    body: "Code runs if (i < array_len) array2[array1[i] * 64]. With i out of range the check SHOULD block it. The branch predictor, trained on earlier in-range calls, guesses 'taken' anyway.",
    c: "#39c5e0",
  },
  {
    k: "01",
    title: "Speculative execution",
    body: "While the real comparison is still resolving, the CPU runs ahead speculatively — it reads the out-of-bounds byte secret = array1[i]. This value is forbidden architecturally, but the hardware is already holding it.",
    c: "#e3a93c",
  },
  {
    k: "02",
    title: "Secret-dependent access",
    body: "Speculation continues: it loads array2[secret * 64]. The ADDRESS it touches depends on the secret. That load pulls one cache line into L1 — leaving a footprint at index = secret.",
    c: "#bc8cff",
  },
  {
    k: "03",
    title: "Architectural rollback",
    body: "The branch finally resolves: the bounds check was FALSE. The CPU discards the speculative work — registers, flags, the secret value: all gone. Nothing illegal ever 'happened'. Except…",
    c: "#f85149",
  },
  {
    k: "04",
    title: "The footprint persists",
    body: "Rollback rewinds registers — but NOT the cache. The line warmed in step 02 is still resident. The microarchitectural state outlived the architectural state. This is the leak.",
    c: "#3fb950",
  },
  {
    k: "05",
    title: "Timing probe (Flush+Reload)",
    body: "The attacker times a read of every cache line of array2. One line is fast (a hit) — the rest are slow (misses). The fast index IS the secret. Click a different secret below and watch the probe spell it out.",
    c: "#56d364",
  },
];

const N_LINES = 16; // probe array2 in 16 line-buckets
const HIT_NS = 28;
const MISS_NS = 210;

export default function SpectreViz() {
  const [step, setStep] = useState(0);
  const [secret, setSecret] = useState(0xb); // the byte we leak (0..15)
  const [auto, setAuto] = useState(false);

  // auto-advance through the conceptual phases
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(
      () => setStep((s) => (s + 1) % PHASES.length),
      2200,
    );
    return () => clearInterval(t);
  }, [auto]);

  const phase = PHASES[step];
  // the secret-dependent line is "warmed" once step >= 2; rollback (3)
  // does NOT clear it — that is the whole point.
  const cacheWarm = step >= 2;
  const probing = step >= 5;

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* phase rail */}
        <div className="flex items-center gap-1 pb-2 py-1">
          {PHASES.map((p, i) => (
            <div key={p.k} className="flex items-center shrink-0">
              <button
                onClick={() => {
                  setAuto(false);
                  setStep(i);
                }}
                className="grid place-items-center rounded-lg px-3 py-2 transition-all"
                style={{
                  background: i === step ? p.c : "#10151d",
                  border: `1px solid ${i === step ? p.c : "#1e2630"}`,
                  color: i === step ? "#06121a" : "#8a97a8",
                  transform: i === step ? "translateY(-2px)" : undefined,
                  boxShadow: i === step ? `0 0 22px -7px ${p.c}` : undefined,
                }}
              >
                <span className="mono text-[11px] font-bold">{p.k}</span>
              </button>
              {i < PHASES.length - 1 && (
                <span className="mx-0.5 text-faint">→</span>
              )}
            </div>
          ))}
        </div>

        {/* two-track diagram: architecture vs microarchitecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {/* architectural track */}
          <div
            className="rounded-lg p-3 transition-all"
            style={{
              background: step === 3 ? "#f8514915" : "#10151d",
              border: `1px solid ${step === 3 ? "#f85149" : "#1e2630"}`,
            }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
              architectural state · registers
            </div>
            <div className="flex items-center gap-2">
              <span className="mono text-xs text-muted">secret =</span>
              <span
                className="mono text-sm font-bold rounded px-2 py-1"
                style={{
                  background:
                    step >= 1 && step <= 2 ? "#e3a93c22" : "#161c26",
                  color:
                    step >= 3
                      ? "#5b6b7d"
                      : step >= 1
                        ? "#e3a93c"
                        : "#5b6b7d",
                  border: `1px solid ${
                    step >= 1 && step <= 2 ? "#e3a93c55" : "#1e2630"
                  }`,
                  textDecoration: step >= 3 ? "line-through" : undefined,
                }}
              >
                {step >= 1 && step <= 2
                  ? "0x" + secret.toString(16).toUpperCase()
                  : step >= 3
                    ? "—— discarded"
                    : "(unknown)"}
              </span>
            </div>
            <p className="mono text-[10px] text-faint mt-2 leading-relaxed">
              {step >= 3
                ? "rolled back: as if it never executed"
                : step >= 1
                  ? "held speculatively (forbidden value)"
                  : "branch not yet mispredicted"}
            </p>
          </div>

          {/* microarchitectural track — the cache */}
          <div
            className="rounded-lg p-3 transition-all"
            style={{
              background: cacheWarm ? "#3fb95012" : "#10151d",
              border: `1px solid ${cacheWarm ? "#3fb950" : "#1e2630"}`,
              boxShadow: cacheWarm ? "0 0 22px -9px #3fb950" : undefined,
            }}
          >
            <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
              microarchitectural state · L1 cache
            </div>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: N_LINES }).map((_, i) => {
                const warm = cacheWarm && i === secret;
                return (
                  <div
                    key={i}
                    className="grid place-items-center rounded mono text-[9px] h-6"
                    style={{
                      background: warm ? "#3fb950" : "#161c26",
                      border: `1px solid ${warm ? "#56d364" : "#1e2630"}`,
                      color: warm ? "#06121a" : "#5b6b7d",
                      fontWeight: warm ? 700 : 400,
                      boxShadow: warm ? "0 0 12px -3px #56d364" : undefined,
                    }}
                  >
                    {i.toString(16).toUpperCase()}
                  </div>
                );
              })}
            </div>
            <p className="mono text-[10px] text-faint mt-2 leading-relaxed">
              {cacheWarm
                ? `line 0x${secret.toString(16).toUpperCase()} resident — survives rollback`
                : "no secret-dependent line cached yet"}
            </p>
          </div>
        </div>

        {/* narrative card */}
        <div className="card p-4 mt-3 min-h-[92px]">
          <div
            className="mono text-xs font-bold"
            style={{ color: phase.c }}
          >
            {phase.k} · {phase.title}
          </div>
          <p className="text-sm text-muted mt-1.5">{phase.body}</p>
        </div>

        {/* timing probe — only meaningful at the final step */}
        <div className="card p-3 mt-3">
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2 flex items-center justify-between">
            <span>flush+reload timing probe (ns per line)</span>
            <span style={{ color: probing ? "#56d364" : "#5b6b7d" }}>
              {probing
                ? `leaked secret = 0x${secret.toString(16).toUpperCase()}`
                : "advance to step 05 to probe"}
            </span>
          </div>
          <div className="flex items-end gap-1 h-20">
            {Array.from({ length: N_LINES }).map((_, i) => {
              const hit = probing && i === secret;
              const ns = hit ? HIT_NS : MISS_NS;
              const h = probing ? (ns / MISS_NS) * 100 : 6;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                  title={probing ? `line 0x${i.toString(16)}: ${ns} ns` : undefined}
                >
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${h}%`,
                      background: hit ? "#56d364" : "#1e2630",
                      border: `1px solid ${hit ? "#56d364" : "#2b3a49"}`,
                      boxShadow: hit ? "0 0 14px -3px #56d364" : undefined,
                    }}
                  />
                  <span
                    className="mono text-[8px] mt-0.5"
                    style={{ color: hit ? "#56d364" : "#5b6b7d" }}
                  >
                    {i.toString(16).toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mono text-[10px] text-faint mt-1 text-center">
            {probing
              ? "one line reads back FAST (cache hit) — its index is the byte the bounds check was supposed to protect."
              : "every line still slow — nothing to read until the speculative load has warmed the cache."}
          </p>
        </div>

        {/* controls */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setAuto((a) => !a)}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            {auto ? "❚❚ pause" : "▶ play"}
          </button>
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            prev
          </button>
          <button
            onClick={() => {
              setAuto(false);
              setStep((s) => Math.min(PHASES.length - 1, s + 1));
            }}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            next
          </button>
          <label className="mono text-[11px] text-faint flex items-center gap-2">
            secret byte
            <input
              type="range"
              min={0}
              max={N_LINES - 1}
              value={secret}
              onChange={(e) => setSecret(Number(e.target.value))}
              className="accent-[#56d364] align-middle"
              style={{ width: 120 }}
            />
            <span className="mono text-xs font-bold text-green">
              0x{secret.toString(16).toUpperCase()}
            </span>
          </label>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Spectre leaks data the bounds check forbids: the rollback erases the value but not its cache shadow. Mitigations (retpolines, KPTI, lfence) break this chain.
      </p>
    </div>
  );
}
