"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useProgress } from "@/components/ProgressProvider";
import SearchPalette from "@/components/SearchPalette";

const LINKS = [
  { href: "/", label: "Roadmap" },
  { href: "/progress", label: "Progress" },
  { href: "/about", label: "About" },
];

const GITHUB = "https://github.com/l69d/kernelpath";

export default function Nav() {
  const pathname = usePathname();
  const { fraction, hydrated, doneCount, total } = useProgress();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pct = hydrated ? Math.round(fraction * 100) : 0;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-green/40 bg-green/10 mono text-xs font-bold text-green glow-green">
              R0
            </span>
            <span className="font-bold tracking-tight">
              Kernel<span className="text-green">Path</span>
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-surface-2 text-text"
                      : "text-muted hover:text-text hover:bg-surface"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-faint hover:text-text hover:border-faint/40 transition-colors"
              aria-label="Search modules"
            >
              <span>Search</span>
              <kbd className="mono hidden sm:inline border border-border rounded px-1 py-0.5 text-[10px]">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/progress"
              className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 md:flex"
              title="Your progress"
            >
              <span className="mono text-xs text-green">{pct}%</span>
              <span className="text-[11px] text-faint">
                {hydrated ? `${doneCount}/${total}` : `0/${total}`}
              </span>
            </Link>

            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-muted hover:text-text transition-colors"
              aria-label="GitHub repository"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
        </div>
        {/* global progress sliver */}
        <div className="h-0.5 w-full bg-transparent">
          <div
            className="h-full bg-green transition-all duration-700"
            style={{
              width: `${pct}%`,
              boxShadow: pct > 0 ? "0 0 8px var(--color-green)" : undefined,
            }}
          />
        </div>
      </header>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
