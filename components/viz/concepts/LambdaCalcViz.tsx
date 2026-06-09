"use client";

import { useEffect, useMemo, useState } from "react";

/* ----------------------------------------------------------------- *
 *  cs6-01 — Beta-reduction stepper for the untyped lambda calculus.
 *  A term reduces by repeatedly finding the leftmost-outermost redex
 *  (\x.body) arg  and substituting arg for x inside body (capture-
 *  avoiding). We step until no redex remains: normal form.
 * ----------------------------------------------------------------- */

type Term =
  | { tag: "var"; name: string }
  | { tag: "lam"; param: string; body: Term }
  | { tag: "app"; fn: Term; arg: Term };

const V = (name: string): Term => ({ tag: "var", name });
const L = (param: string, body: Term): Term => ({ tag: "lam", param, body });
const A = (fn: Term, arg: Term): Term => ({ tag: "app", fn, arg });

/* free variables of a term */
function freeVars(t: Term, acc: Set<string> = new Set()): Set<string> {
  if (t.tag === "var") acc.add(t.name);
  else if (t.tag === "lam") {
    const inner = freeVars(t.body);
    inner.forEach((v) => v !== t.param && acc.add(v));
  } else {
    freeVars(t.fn, acc);
    freeVars(t.arg, acc);
  }
  return acc;
}

/* a fresh name not clashing with `avoid` */
function fresh(base: string, avoid: Set<string>): string {
  const n = base.replace(/['0-9]+$/, "");
  let candidate = n;
  let i = 0;
  while (avoid.has(candidate)) {
    i += 1;
    candidate = n + "'".repeat(i);
  }
  return candidate;
}

/* capture-avoiding substitution: replace free `name` with `value` in t */
function substitute(t: Term, name: string, value: Term): Term {
  if (t.tag === "var") return t.name === name ? value : t;
  if (t.tag === "app")
    return A(substitute(t.fn, name, value), substitute(t.arg, name, value));
  // lam
  if (t.param === name) return t; // shadowed — stop
  const fvValue = freeVars(value);
  if (fvValue.has(t.param)) {
    const avoid = new Set<string>([...fvValue, ...freeVars(t.body), name]);
    const np = fresh(t.param, avoid);
    const renamed = substitute(t.body, t.param, V(np));
    return L(np, substitute(renamed, name, value));
  }
  return L(t.param, substitute(t.body, name, value));
}

/* find the leftmost-outermost redex; return the path of branch keys */
type Path = ("fn" | "arg" | "body")[];
function findRedex(t: Term, path: Path = []): Path | null {
  if (t.tag === "app") {
    if (t.fn.tag === "lam") return path; // this application is a redex
    const inFn = findRedex(t.fn, [...path, "fn"]);
    if (inFn) return inFn;
    return findRedex(t.arg, [...path, "arg"]);
  }
  if (t.tag === "lam") return findRedex(t.body, [...path, "body"]);
  return null;
}

/* perform one beta step at the given redex path */
function reduceAt(t: Term, path: Path): Term {
  if (path.length === 0) {
    if (t.tag === "app" && t.fn.tag === "lam")
      return substitute(t.fn.body, t.fn.param, t.arg);
    return t;
  }
  const [head, ...rest] = path;
  if (t.tag === "app" && head === "fn") return A(reduceAt(t.fn, rest), t.arg);
  if (t.tag === "app" && head === "arg") return A(t.fn, reduceAt(t.arg, rest));
  if (t.tag === "lam" && head === "body") return L(t.param, reduceAt(t.body, rest));
  return t;
}

/* run the full normal-order reduction, capped to avoid runaway terms */
function reduceAll(t: Term, cap = 40): Term[] {
  const steps: Term[] = [t];
  let cur = t;
  for (let i = 0; i < cap; i += 1) {
    const p = findRedex(cur);
    if (!p) break;
    cur = reduceAt(cur, p);
    steps.push(cur);
  }
  return steps;
}

/* ---- rendering: pretty-print, highlighting the redex on `hotPath` ---- */
function Rendered({
  t,
  hot,
  path = [],
  outer = true,
}: {
  t: Term;
  hot: Path | null;
  path?: Path;
  outer?: boolean;
}) {
  const isHot =
    hot !== null &&
    hot.length === path.length &&
    hot.every((k, i) => k === path[i]);

  if (t.tag === "var")
    return <span style={{ color: "#39c5e0" }}>{t.name}</span>;

  if (t.tag === "lam") {
    const inner = (
      <>
        <span style={{ color: "#bc8cff" }}>λ{t.param}.</span>
        <Rendered t={t.body} hot={hot} path={[...path, "body"]} outer={false} />
      </>
    );
    return outer ? inner : <>({inner})</>;
  }

  // app
  const body = (
    <>
      <Rendered t={t.fn} hot={hot} path={[...path, "fn"]} outer={false} />
      <span style={{ color: "#5b6b7d" }}> </span>
      <Rendered t={t.arg} hot={hot} path={[...path, "arg"]} outer={false} />
    </>
  );
  const wrapped = outer ? body : <>({body})</>;
  if (isHot)
    return (
      <span
        style={{
          background: "#e3a93c22",
          border: "1px solid #e3a93c",
          borderRadius: 4,
          padding: "1px 3px",
          boxShadow: "0 0 14px -4px #e3a93c",
        }}
      >
        {wrapped}
      </span>
    );
  return wrapped;
}

/* ---- presets ---- */
const PRESETS: { name: string; note: string; term: Term }[] = [
  {
    name: "K combinator",
    note: "(λx.λy.x) A B  — keep the first argument, drop the second.",
    term: A(A(L("x", L("y", V("x"))), V("A")), V("B")),
  },
  {
    name: "identity ∘ identity",
    note: "(λx.x) (λy.y) z  — applying identity peels one layer at a time.",
    term: A(A(L("x", V("x")), L("y", V("y"))), V("z")),
  },
  {
    name: "Church succ 0",
    note: "succ 0 — increment the Church numeral 0 (λf.λx.x) up to 1.",
    term: A(
      L("n", L("f", L("x", A(V("f"), A(A(V("n"), V("f")), V("x")))))),
      L("f", L("x", V("x"))),
    ),
  },
];

export default function LambdaCalcViz() {
  const [preset, setPreset] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(() => reduceAll(PRESETS[preset].term), [preset]);
  const last = steps.length - 1;
  const cur = steps[Math.min(step, last)];
  const redex = findRedex(cur);
  const atNormalForm = redex === null;

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const id = setInterval(() => setStep((s) => Math.min(s + 1, last)), 1100);
    return () => clearInterval(id);
  }, [playing, step, last]);

  const choose = (i: number) => {
    setPreset(i);
    setStep(0);
    setPlaying(false);
  };

  return (
    <div className="card p-5 grid-bg">
      <div className="overflow-x-auto">
        {/* preset selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => choose(i)}
              className="mono text-[11px] rounded px-3 py-1.5 transition-all"
              style={{
                background: i === preset ? "#3fb950" : "#10151d",
                border: `1px solid ${i === preset ? "#3fb950" : "#1e2630"}`,
                color: i === preset ? "#06121a" : "#8a97a8",
                fontWeight: i === preset ? 700 : 400,
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* current term */}
        <div className="card p-4 text-center" style={{ minHeight: 72 }}>
          <div className="mono text-[10px] uppercase tracking-widest text-faint mb-2">
            {atNormalForm
              ? "normal form — no redex left"
              : "current term · redex highlighted"}
          </div>
          <div
            className="mono text-base md:text-lg leading-relaxed break-words"
            style={{ color: "#d6dee8" }}
          >
            <Rendered t={cur} hot={redex} />
          </div>
        </div>

        {/* substitution readout */}
        <div className="grid grid-cols-3 gap-3 text-center mt-4">
          <Stat
            label="step"
            value={`${Math.min(step, last)} / ${last}`}
            color="#39c5e0"
          />
          <Stat
            label="next action"
            value={atNormalForm ? "done" : "β-reduce"}
            color={atNormalForm ? "#56d364" : "#e3a93c"}
          />
          <Stat
            label="redex"
            value={atNormalForm ? "—" : describeRedex(cur, redex)}
            color="#bc8cff"
          />
        </div>

        {/* controls */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setPlaying(false);
              setStep(0);
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            ⏮ reset
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text"
          >
            prev
          </button>
          <div className="flex gap-1 px-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-4 rounded-full"
                style={{ background: i <= step ? "#3fb950" : "#1e2630" }}
              />
            ))}
          </div>
          <button
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.min(last, s + 1));
            }}
            disabled={atNormalForm}
            className="mono text-xs rounded border border-border px-3 py-1 text-faint hover:text-text disabled:opacity-40"
          >
            β-step →
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={atNormalForm}
            className="mono text-[11px] rounded border border-border px-3 py-1 text-faint hover:text-text disabled:opacity-40"
          >
            {playing ? "❚❚ pause" : "▶ play"}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-muted">
          {PRESETS[preset].note}
        </p>
      </div>
      <p className="mt-3 text-xs text-faint mono text-center">
        β-reduction: (λx.M) N → M[x ≔ N]. Normal order picks the
        leftmost-outermost redex; substitution renames bound vars to avoid
        capture.
      </p>
    </div>
  );
}

function describeRedex(t: Term, path: Path | null): string {
  if (!path) return "—";
  let node: Term = t;
  for (const k of path) {
    if (node.tag === "app" && k === "fn") node = node.fn;
    else if (node.tag === "app" && k === "arg") node = node.arg;
    else if (node.tag === "lam" && k === "body") node = node.body;
  }
  if (node.tag === "app" && node.fn.tag === "lam")
    return `${node.fn.param} ≔ ${pretty(node.arg)}`;
  return "—";
}

function pretty(t: Term): string {
  if (t.tag === "var") return t.name;
  if (t.tag === "lam") return `λ${t.param}.${pretty(t.body)}`;
  return `(${pretty(t.fn)} ${pretty(t.arg)})`;
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card py-2">
      <div className="mono text-[10px] uppercase tracking-widest text-faint">
        {label}
      </div>
      <div className="mono text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
