"use client";

import { useState } from "react";
import { DIFFICULTY_COLOR } from "@/lib/ui";

export interface ExerciseItem {
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  hint?: string;
}

export default function Exercises({ items }: { items: ExerciseItem[] }) {
  return (
    <ol className="space-y-3">
      {items.map((ex, i) => (
        <ExerciseRow key={i} ex={ex} n={i + 1} />
      ))}
    </ol>
  );
}

function ExerciseRow({ ex, n }: { ex: ExerciseItem; n: number }) {
  const [open, setOpen] = useState(false);
  const color = DIFFICULTY_COLOR[ex.difficulty] ?? "#8a97a8";
  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <span className="mono text-xs font-bold text-faint mt-0.5">
          {String(n).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5"
              style={{ background: `${color}1f`, color, border: `1px solid ${color}44` }}
            >
              {ex.difficulty}
            </span>
          </div>
          <p className="text-sm text-text">{ex.prompt}</p>
          {ex.hint && (
            <div className="mt-2">
              <button
                onClick={() => setOpen((o) => !o)}
                className="mono text-[11px] text-cyan hover:underline"
              >
                {open ? "− hide hint" : "+ show hint"}
              </button>
              {open && (
                <p className="mt-1.5 text-sm text-muted border-l-2 border-cyan/50 pl-3">
                  {ex.hint}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
