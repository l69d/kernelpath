"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODULES, TRACKS, trackById } from "@/lib/modules";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Hit {
  id: string;
  title: string;
  track: string;
  brief: string;
  score: number;
}

function scoreMatch(q: string, text: string): number {
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) {
    // earlier match = better; title-start best
    const idx = t.indexOf(q);
    return 100 - Math.min(idx, 60);
  }
  // crude subsequence match
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length ? 20 : -1;
}

export default function SearchPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const query = q.trim().toLowerCase();
    const scored: Hit[] = MODULES.map((m) => {
      const trackTitle = trackById(m.track)?.title ?? "";
      const s = Math.max(
        scoreMatch(query, m.title) + 5,
        scoreMatch(query, m.brief),
        scoreMatch(query, trackTitle) - 2,
      );
      return { id: m.id, title: m.title, track: m.track, brief: m.brief, score: s };
    });
    if (!query) {
      return scored.slice(0, 8);
    }
    return scored
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const go = (id: string) => {
    onClose();
    router.push(`/module/${id}`);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && hits[active]) {
            go(hits[active].id);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="text-green mono">&gt;</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 112 modules… (e.g. RCU, paging, eBPF, pointers)"
            className="flex-1 bg-transparent outline-none text-text placeholder:text-faint mono text-sm"
          />
          <kbd className="mono text-[10px] text-faint border border-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto py-2">
          {hits.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-faint">
              No modules match “{q}”.
            </li>
          )}
          {hits.map((h, i) => {
            const track = trackById(h.track);
            return (
              <li key={h.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h.id)}
                  className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 ${
                    i === active ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="mono text-[10px] text-green">{h.id}</span>
                    <span className="text-sm text-text font-medium">
                      {h.title}
                    </span>
                  </span>
                  <span className="text-[11px] text-faint truncate">
                    {track?.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-faint mono">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>{TRACKS.length} tracks · {MODULES.length} modules</span>
        </div>
      </div>
    </div>
  );
}
