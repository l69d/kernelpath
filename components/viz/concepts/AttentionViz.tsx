"use client";

import { useEffect, useMemo, useState } from "react";

/* ================================================================== *
 *  cs13-04 — Attention & Transformers
 *  A sentence of tokens + an attention matrix (query rows × key cols).
 *  Cell intensity = a softmax row (a learned weighted lookup over the
 *  sequence). Click a query token to see what it attends to most.
 * ================================================================== */

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];

// Hand-authored, fully deterministic affinity logits (pre-softmax).
// Encodes a few linguistic intuitions so the pattern reads as "learned".
function affinity(qi: number, ki: number): number {
  const q = TOKENS[qi].toLowerCase();
  const k = TOKENS[ki].toLowerCase();
  let s = 0;
  if (qi === ki) s += 1.2; // attend to self
  if (q === k) s += 1.6; // same word ("the" ↔ "the")
  if (Math.abs(qi - ki) === 1) s += 1.0; // local adjacency
  if (q === "sat" && (k === "cat" || k === "mat")) s += 2.2; // verb → subj/obj
  if (q === "on" && k === "mat") s += 1.8; // preposition → object
  if (q === "mat" && k === "on") s += 1.3;
  if (q === "cat" && k === "sat") s += 1.5;
  if (k === "the") s -= 0.4; // function words attended to less
  return s;
}

function softmax(row: number[], temp: number): number[] {
  const scaled = row.map((v) => v / temp);
  const m = Math.max(...scaled);
  const ex = scaled.map((v) => Math.exp(v - m));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / sum);
}

// blend two hex colors by t∈[0,1]
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export default function AttentionViz() {
  const [query, setQuery] = useState(2); // "sat" — the most illustrative row
  const [temp, setTemp] = useState(1.0);
  const [auto, setAuto] = useState(true);

  // sweep the query token automatically until the user takes over
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(
      () => setQuery((q) => (q + 1) % TOKENS.length),
      1600,
    );
    return () => clearInterval(t);
  }, [auto]);

  const matrix = useMemo(
    () =>
      TOKENS.map((_, q) => softmax(TOKENS.map((_, k) => affinity(q, k)), temp)),
    [temp],
  );

  const row = matrix[query];
  const topK = row.indexOf(Math.max(...row));
  const CYAN = "#39c5e0";
  const SURF = "#10151d";

  const pick = (i: number) => {
    setAuto(false);
    setQuery(i);
  };

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* token sentence — click a query */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
          {TOKENS.map((tok, i) => {
            const isQ = i === query;
            const w = row[i]; // how much the current query attends to token i
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                className="mono text-xs font-bold rounded px-2.5 py-1.5 transition-all"
                style={{
                  background: isQ ? CYAN : mix(SURF, "#bc8cff", w * 0.9),
                  border: `1px solid ${isQ ? CYAN : i === topK ? "#bc8cff" : "#1e2630"}`,
                  color: isQ ? "#06121a" : "#d6dee8",
                  boxShadow: isQ ? `0 0 20px -6px ${CYAN}` : undefined,
                }}
                title={isQ ? "query token" : `attention ${(w * 100).toFixed(0)}%`}
              >
                {tok}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-center text-[11px] text-faint mono">
          query =&nbsp;
          <b className="text-cyan">{TOKENS[query]}</b>
          &nbsp;·&nbsp;purple = how strongly it looks at each token
        </p>

        {/* attention matrix */}
        <div className="mt-4 flex justify-center">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `52px repeat(${TOKENS.length}, 1fr)`,
              minWidth: 360,
              maxWidth: 460,
            }}
          >
            <div className="mono text-[9px] text-faint flex items-end justify-center pb-1">
              q╲k
            </div>
            {TOKENS.map((t, k) => (
              <div
                key={k}
                className={`mono text-[10px] text-center pb-1 ${k === topK && "text-purple"}`}
                style={{ color: k === topK ? "#bc8cff" : "#5b6b7d" }}
              >
                {t}
              </div>
            ))}

            {matrix.map((mrow, q) => (
              <Row
                key={q}
                q={q}
                mrow={mrow}
                active={q === query}
                topK={q === query ? topK : -1}
                onPick={() => pick(q)}
              />
            ))}
          </div>
        </div>

        {/* temperature + readout */}
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] items-center">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="mono text-[10px] uppercase tracking-widest text-faint">
                softmax temperature
              </span>
              <span className="mono text-xs font-bold text-cyan">
                {temp.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={3}
              step={0.1}
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="w-full accent-[#39c5e0]"
            />
            <p className="mt-1 text-[11px] text-muted">
              Low → sharp, near one-hot lookup. High → diffuse, averages the
              whole sequence.
            </p>
          </div>
          <div className="card py-2 px-4 text-center">
            <div className="mono text-[10px] uppercase tracking-widest text-faint">
              attends most to
            </div>
            <div className="mono text-lg font-bold mt-0.5 text-purple">
              {TOKENS[topK]}
            </div>
            <div className="mono text-[11px] text-muted">
              {(row[topK] * 100).toFixed(0)}% of weight
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setAuto((a) => !a)}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            {auto ? "❚❚ pause sweep" : "▶ sweep queries"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint mono text-center">
        Each row is one softmax over the keys: a learned weighted lookup. The
        output for a token = Σ (weightₖ × valueₖ) over the whole sequence.
      </p>
    </div>
  );
}

function Row({
  q,
  mrow,
  active,
  topK,
  onPick,
}: {
  q: number;
  mrow: number[];
  active: boolean;
  topK: number;
  onPick: () => void;
}) {
  return (
    <>
      <button
        onClick={onPick}
        className="mono text-[10px] text-right pr-1 flex items-center justify-end rounded transition-all"
        style={{
          color: active ? "#39c5e0" : "#8a97a8",
          fontWeight: active ? 700 : 400,
        }}
      >
        {TOKENS[q]}
      </button>
      {mrow.map((w, k) => {
        const isTop = k === topK;
        return (
          <div
            key={k}
            className="grid place-items-center rounded mono text-[9px] h-8 transition-all"
            style={{
              background: mix("#10151d", "#bc8cff", w),
              border: `1px solid ${
                active ? (isTop ? "#bc8cff" : "#39c5e055") : "#1e2630"
              }`,
              color: w > 0.4 ? "#06121a" : "#5b6b7d",
              opacity: active ? 1 : 0.5,
            }}
          >
            {w >= 0.1 ? w.toFixed(2).slice(1) : ""}
          </div>
        );
      })}
    </>
  );
}