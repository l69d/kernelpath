import Link from "next/link";
import { TRACKS, MODULES, TOTAL_MODULES, TOTAL_TRACKS } from "@/lib/modules";
import {
  contentCount,
  totalConcepts,
  totalResources,
  totalEstimatedHours,
} from "@/lib/content";
import { trackColor, TRACK_INDEX } from "@/lib/ui";
import TrackSection from "@/components/TrackSection";
import { FetchExecuteViz } from "@/components/viz";

export default function Home() {
  const concepts = totalConcepts();
  const resources = totalResources();
  const hours = totalEstimatedHours();
  const ready = contentCount();

  const stats = [
    { label: "modules", value: TOTAL_MODULES.toString() },
    { label: "tracks", value: TOTAL_TRACKS.toString() },
    { label: "concepts", value: concepts > 0 ? `${concepts}` : "600+" },
    { label: "resources", value: resources > 0 ? `${resources}` : "500+" },
    {
      label: "est. hours",
      value: hours > 0 ? `${Math.round(hours)}` : "—",
    },
  ];

  return (
    <div>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green/5 px-3 py-1 mono text-[11px] text-green mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse-ring" />
              from transistors to your first merged patch
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
              The complete path to
              <br />
              <span className="text-green glow-green">Linux kernel</span>{" "}
              development
            </h1>
            <p className="mt-5 text-lg text-muted max-w-xl">
              An exhaustive, visual, and totally free roadmap — {TOTAL_MODULES}{" "}
              modules across {TOTAL_TRACKS} tracks. Start with what a{" "}
              <span className="text-text">bit</span> is. Finish by sending a
              patch to the <span className="text-text">kernel mailing list</span>.
              Every concept explained, visualized, and linked to the best
              resources on Earth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/module/t0-01"
                className="rounded-lg bg-green px-5 py-2.5 font-semibold text-[#06121a] hover:bg-green-bright transition-colors"
              >
                Begin the path →
              </Link>
              <Link
                href="/progress"
                className="rounded-lg border border-border bg-surface px-5 py-2.5 font-semibold text-text hover:border-faint/50 transition-colors"
              >
                Track my progress
              </Link>
            </div>
            <p className="mt-4 text-xs text-faint mono">
              press <kbd className="border border-border rounded px-1">⌘K</kbd> to
              jump to any topic
            </p>
          </div>

          <div className="lg:pl-4">
            <FetchExecuteViz />
          </div>
        </div>

        {/* stats strip */}
        <div className="relative border-t border-border bg-bg-soft/60">
          <div className="mx-auto max-w-6xl px-4 py-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="mono text-2xl font-black text-text">{s.value}</div>
                <div className="mono text-[10px] uppercase tracking-widest text-faint mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Learn in order, or jump in",
              d: "The tracks build on each other — but every module is self-contained, with its own diagram, code, and curated resources.",
              c: "#3fb950",
            },
            {
              t: "See it, don't just read it",
              d: "Hard ideas — paging, pipelines, the syscall boundary — come with hand-built interactive visualizations and a diagram per module.",
              c: "#39c5e0",
            },
            {
              t: "Track every step",
              d: "Mark modules complete as you go. Your progress is saved in your browser and shown across the whole roadmap.",
              c: "#bc8cff",
            },
          ].map((x) => (
            <div key={x.t} className="card p-5">
              <div
                className="h-1 w-10 rounded-full mb-3"
                style={{ background: x.c }}
              />
              <h3 className="font-bold text-text">{x.t}</h3>
              <p className="mt-2 text-sm text-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- track jump nav ---------------- */}
      <div className="sticky top-14 z-30 border-y border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex gap-2 overflow-x-auto">
          {TRACKS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted hover:text-text transition-colors"
            >
              <span
                className="mono font-bold"
                style={{ color: trackColor(t.id) }}
              >
                {TRACK_INDEX[t.id]}
              </span>
              <span className="whitespace-nowrap">{t.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ---------------- the path ---------------- */}
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-16">
        {ready === 0 && (
          <div className="card p-4 text-sm text-amber/90">
            Module content is being authored by the build pipeline. Structure and
            navigation are live now.
          </div>
        )}
        {TRACKS.map((t) => (
          <TrackSection key={t.id} track={t} />
        ))}
      </div>

      {/* ---------------- closing CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="card p-8 text-center grid-bg">
          <h2 className="text-2xl font-black">
            {MODULES.length} modules between you and Ring&nbsp;0.
          </h2>
          <p className="mt-2 text-muted max-w-xl mx-auto">
            The kernel is just C, patience, and a thousand small ideas you can
            actually learn. Start at the very beginning.
          </p>
          <Link
            href="/module/t0-01"
            className="inline-block mt-6 rounded-lg bg-green px-6 py-3 font-semibold text-[#06121a] hover:bg-green-bright transition-colors"
          >
            Start with module 01 →
          </Link>
        </div>
      </section>
    </div>
  );
}
