"use client";

import { useMemo, useState } from "react";
import CodeViz from "./codeviz/CodeViz";
import { ALGORITHMS, groupedAlgorithms } from "./codeviz/registry";
import type { Category } from "./codeviz/types";

const CAT_COLOR: Record<Category, string> = {
  Sorting: "#3fb950",
  Searching: "#39c5e0",
  Array: "#58a6ff",
  Graph: "#bc8cff",
  Tree: "#e3a93c",
  "Dynamic Programming": "#f778ba",
  Recursion: "#f85149",
  Math: "#56d364",
};

export default function AlgorithmViz() {
  const groups = useMemo(() => groupedAlgorithms(), []);
  const [activeId, setActiveId] = useState<string>(ALGORITHMS[0]?.id ?? "");
  const algo = ALGORITHMS.find((a) => a.id === activeId) ?? ALGORITHMS[0];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Pick an algorithm. The code runs step by step — the highlighted line and
        the note above it tell you exactly what is happening, while the panel on
        the right shows the data move. Use{" "}
        <span className="mono text-cyan">play</span>,{" "}
        <span className="mono text-cyan">step</span>, or drag the scrubber.
      </p>

      {/* algorithm picker, grouped by category */}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.category} className="flex flex-wrap items-center gap-2">
            <span
              className="mono text-[10px] uppercase tracking-widest w-full sm:w-36 shrink-0"
              style={{ color: CAT_COLOR[g.category] }}
            >
              {g.category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {g.algos.map((a) => {
                const on = a.id === activeId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveId(a.id)}
                    className="rounded-md border px-2.5 py-1 text-xs transition-colors"
                    style={{
                      background: on ? CAT_COLOR[g.category] : "transparent",
                      color: on ? "#06121a" : "var(--color-muted)",
                      borderColor: on ? CAT_COLOR[g.category] : "var(--color-border)",
                      fontWeight: on ? 600 : 400,
                    }}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* selected algorithm header */}
      {algo && (
        <>
          <div className="flex items-baseline justify-between flex-wrap gap-2 border-t border-border pt-4">
            <h3 className="text-lg font-bold">
              {algo.name}{" "}
              <span
                className="mono text-xs font-normal ml-1 rounded px-2 py-0.5"
                style={{
                  color: CAT_COLOR[algo.category],
                  background: CAT_COLOR[algo.category] + "18",
                  border: `1px solid ${CAT_COLOR[algo.category]}40`,
                }}
              >
                {algo.complexity}
              </span>
            </h3>
            <span className="mono text-[11px] text-faint">{algo.category}</span>
          </div>
          <p className="text-sm text-muted -mt-2">{algo.blurb}</p>
          <CodeViz key={algo.id} algo={algo} />
        </>
      )}
    </div>
  );
}
