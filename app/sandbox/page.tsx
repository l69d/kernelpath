"use client";

import { useState } from "react";
import Link from "next/link";
import BitLab from "@/components/sandbox/BitLab";
import JsPlayground from "@/components/sandbox/JsPlayground";
import RegexLab from "@/components/sandbox/RegexLab";
import SortingViz from "@/components/sandbox/SortingViz";

const TOOLS = [
  {
    id: "bits",
    name: "Bit Lab",
    glyph: "01",
    blurb: "Flip bits, watch binary, hex and two's-complement update live, and run bitwise operators.",
    relates: "Foundations · C · Architecture",
  },
  {
    id: "code",
    name: "JS Playground",
    glyph: "{}",
    blurb: "Write and run JavaScript in a sandboxed worker. Test recursion, closures, sorting — anything.",
    relates: "Programming · Algorithms",
  },
  {
    id: "regex",
    name: "Regex Lab",
    glyph: ".*",
    blurb: "Build a regular expression and watch it match in real time. Finite automata, made tangible.",
    relates: "Theory of Computation · Compilers",
  },
  {
    id: "sort",
    name: "Sorting Visualizer",
    glyph: "↕",
    blurb: "Watch five sorting algorithms work step by step, and feel the difference between O(n²) and O(n log n).",
    relates: "Algorithms · Data Structures",
  },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export default function SandboxPage() {
  const [active, setActive] = useState<ToolId>("bits");
  const tool = TOOLS.find((t) => t.id === active)!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2 text-xs mono text-faint mb-4">
        <Link href="/" className="hover:text-text">
          roadmap
        </Link>
        <span>/</span>
        <span className="text-muted">sandbox</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight">
        The <span className="text-green">Sandbox</span>
      </h1>
      <p className="mt-2 text-muted max-w-2xl">
        Reading is not understanding. Tinker here — flip bits, run code, break a
        regex, race a sorting algorithm — until the concepts feel obvious.
        Everything runs entirely in your browser.
      </p>

      {/* tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors"
            style={{
              background: active === t.id ? "var(--color-surface-2)" : "transparent",
              borderColor: active === t.id ? "#2b3a49" : "var(--color-border)",
              color: active === t.id ? "var(--color-text)" : "var(--color-muted)",
            }}
          >
            <span
              className="grid h-6 w-6 place-items-center rounded mono text-[10px] font-bold"
              style={{
                background: active === t.id ? "var(--color-green)" : "var(--color-surface)",
                color: active === t.id ? "#06121a" : "var(--color-faint)",
              }}
            >
              {t.glyph}
            </span>
            {t.name}
          </button>
        ))}
      </div>

      {/* active tool header */}
      <div className="mt-6 mb-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">{tool.name}</h2>
          <span className="mono text-[11px] text-faint">{tool.relates}</span>
        </div>
        <p className="text-sm text-muted mt-1">{tool.blurb}</p>
      </div>

      <div className="card p-5">
        {active === "bits" && <BitLab />}
        {active === "code" && <JsPlayground />}
        {active === "regex" && <RegexLab />}
        {active === "sort" && <SortingViz />}
      </div>

      <p className="mt-6 text-xs text-faint text-center">
        More tools coming — a SQL playground, a logic-gate builder, and a
        pathfinding visualizer are on the roadmap.
      </p>
    </div>
  );
}
