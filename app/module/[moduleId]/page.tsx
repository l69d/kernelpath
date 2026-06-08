import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MODULES,
  moduleById,
  trackById,
  prevModule,
  nextModule,
  modulesInTrack,
  moduleIndex,
} from "@/lib/modules";
import { getContent } from "@/lib/content";
import { trackColor, TRACK_INDEX, RESOURCE_ICON } from "@/lib/ui";
import Markdown from "@/components/Markdown";
import Mermaid from "@/components/Mermaid";
import CodeBlock from "@/components/CodeBlock";
import Exercises from "@/components/Exercises";
import { CompleteToggle, CompletePill } from "@/components/ModuleComplete";
import { HeroViz } from "@/components/viz";
import { StatusDot } from "@/components/ProgressBits";

export const dynamicParams = false;

export function generateStaticParams() {
  return MODULES.map((m) => ({ moduleId: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const m = moduleById(moduleId);
  if (!m) return { title: "Not found" };
  const c = getContent(moduleId);
  return {
    title: m.title,
    description: c?.oneLiner ?? m.brief,
  };
}

function SectionTitle({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold mb-3 mt-10">
      <span
        className="inline-block h-4 w-1 rounded-full"
        style={{ background: color ?? "var(--color-green)" }}
      />
      {children}
    </h2>
  );
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const m = moduleById(moduleId);
  if (!m) notFound();

  const track = trackById(m.track);
  const content = getContent(moduleId);
  const color = trackColor(m.track);
  const prev = prevModule(moduleId);
  const next = nextModule(moduleId);
  const siblings = modulesInTrack(m.track);
  const idx = moduleIndex(moduleId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid gap-10 lg:grid-cols-[1fr_240px]">
      {/* -------- main column -------- */}
      <article className="min-w-0">
        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-xs mono text-faint mb-4">
          <Link href="/" className="hover:text-text">
            roadmap
          </Link>
          <span>/</span>
          <Link
            href={`/track/${track?.id}`}
            className="hover:text-text"
            style={{ color }}
          >
            {TRACK_INDEX[m.track]} {track?.title}
          </Link>
          <span>/</span>
          <span className="text-muted">{m.id}</span>
        </div>

        {/* title block */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className="mono text-[11px] font-bold rounded px-2 py-0.5"
              style={{ background: `${color}1f`, color, border: `1px solid ${color}44` }}
            >
              module {String(idx + 1).padStart(3, "0")} / {MODULES.length}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
              {m.title}
            </h1>
            {content?.oneLiner && (
              <p className="mt-2 text-lg text-muted">{content.oneLiner}</p>
            )}
          </div>
          <StatusDot id={m.id} size={16} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompleteToggle id={m.id} />
          {content?.estimatedHours ? (
            <span className="mono text-xs text-faint">
              ~{content.estimatedHours}h focused study
            </span>
          ) : null}
          {content?.concepts?.length ? (
            <span className="mono text-xs text-faint">
              {content.concepts.length} concepts
            </span>
          ) : null}
        </div>

        {!content && (
          <div className="card p-6 mt-8">
            <p className="text-muted">
              The full lesson for this module is being authored. In the meantime,
              here&apos;s what it covers:
            </p>
            <p className="mt-3 text-text">{m.brief}</p>
          </div>
        )}

        {content && (
          <>
            {/* overview */}
            <SectionTitle color={color}>Overview</SectionTitle>
            <Markdown>{content.overview}</Markdown>

            {/* why it matters */}
            <div className="card p-5 mt-6 border-l-2" style={{ borderLeftColor: color }}>
              <div className="mono text-[11px] uppercase tracking-widest text-faint mb-2">
                why this matters for the kernel
              </div>
              <Markdown>{content.whyItMatters}</Markdown>
            </div>

            {/* hero interactive viz (flagship modules only) */}
            <div className="mt-8">
              <HeroViz id={m.id} />
            </div>

            {/* diagram */}
            {content.diagram?.mermaid && (
              <>
                <SectionTitle color={color}>{content.diagram.title}</SectionTitle>
                <div className="card p-4">
                  <Mermaid code={content.diagram.mermaid} />
                  {content.diagram.caption && (
                    <p className="mt-3 text-xs text-faint text-center">
                      {content.diagram.caption}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* concepts */}
            <SectionTitle color={color}>The concepts</SectionTitle>
            <div className="space-y-5">
              {content.concepts.map((c, i) => (
                <div key={i} className="card p-5">
                  <h3 className="flex items-baseline gap-2 text-base font-bold text-white">
                    <span className="mono text-xs" style={{ color }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {c.name}
                  </h3>
                  <div className="mt-2">
                    <Markdown>{c.explanation}</Markdown>
                  </div>
                  {c.codeExample && c.codeExample.trim() && (
                    <div className="mt-3">
                      <CodeBlock code={c.codeExample} lang={c.codeLang} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* key insights */}
            {content.keyInsights?.length > 0 && (
              <>
                <SectionTitle color={color}>Key insights</SectionTitle>
                <ul className="space-y-2">
                  {content.keyInsights.map((k, i) => (
                    <li key={i} className="flex gap-3 card p-3">
                      <span className="text-green mono shrink-0">✦</span>
                      <span className="text-sm text-text">{k}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* pitfalls */}
            {content.commonPitfalls?.length > 0 && (
              <>
                <SectionTitle color="#f85149">Common pitfalls</SectionTitle>
                <ul className="space-y-2">
                  {content.commonPitfalls.map((p, i) => (
                    <li key={i} className="flex gap-3 card p-3">
                      <span className="text-red mono shrink-0">⚠</span>
                      <span className="text-sm text-muted">{p}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* exercises */}
            {content.exercises?.length > 0 && (
              <>
                <SectionTitle color={color}>Practice</SectionTitle>
                <Exercises items={content.exercises} />
              </>
            )}

            {/* resources */}
            {content.resources?.length > 0 && (
              <>
                <SectionTitle color={color}>Resources</SectionTitle>
                <div className="grid gap-2 sm:grid-cols-2">
                  {content.resources.map((r, i) => {
                    const inner = (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {RESOURCE_ICON[r.type] ?? "•"}
                          </span>
                          <span className="text-sm font-medium text-text group-hover:text-white">
                            {r.title}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] mono text-faint">
                          <span className="uppercase">{r.type}</span>
                          <span
                            className="rounded px-1"
                            style={{
                              color: r.free ? "var(--color-green)" : "var(--color-amber)",
                            }}
                          >
                            {r.free ? "free" : "paid"}
                          </span>
                          {r.where && <span className="truncate">{r.where}</span>}
                        </div>
                        {r.note && (
                          <p className="mt-1 text-xs text-muted">{r.note}</p>
                        )}
                      </>
                    );
                    return r.url ? (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="card card-hover group p-3 block"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={i} className="card group p-3">
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* checkpoints */}
            {content.checkpoints?.length > 0 && (
              <>
                <SectionTitle color={color}>
                  Checkpoints — you can now…
                </SectionTitle>
                <ul className="space-y-2">
                  {content.checkpoints.map((c, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span
                        className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px]"
                        style={{ borderColor: color, color }}
                      >
                        ✓
                      </span>
                      <span className="text-sm text-text">{c}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {/* complete + prev/next */}
        <div className="mt-12 border-t border-border pt-6">
          <div className="flex justify-center mb-6">
            <CompletePill id={m.id} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/module/${prev.id}`}
                className="card card-hover p-4 text-left"
              >
                <div className="mono text-[10px] text-faint">← previous</div>
                <div className="text-sm font-medium text-text mt-1 line-clamp-1">
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/module/${next.id}`}
                className="card card-hover p-4 text-right"
              >
                <div className="mono text-[10px] text-faint">next →</div>
                <div className="text-sm font-medium text-text mt-1 line-clamp-1">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </article>

      {/* -------- right rail: in-track nav -------- */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <div className="mono text-[11px] uppercase tracking-widest text-faint mb-3">
            {TRACK_INDEX[m.track]} · {track?.title}
          </div>
          <ul className="space-y-1">
            {siblings.map((s) => {
              const isCurrent = s.id === m.id;
              return (
                <li key={s.id}>
                  <Link
                    href={`/module/${s.id}`}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                      isCurrent
                        ? "bg-surface-2 text-text"
                        : "text-muted hover:text-text hover:bg-surface"
                    }`}
                  >
                    <StatusDot id={s.id} size={8} />
                    <span className="mono text-[10px] text-faint">{s.id}</span>
                    <span className="line-clamp-1">{s.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={`/track/${track?.id}`}
            className="mt-3 inline-block mono text-[11px] hover:underline"
            style={{ color }}
          >
            view full track →
          </Link>
        </div>
      </aside>
    </div>
  );
}
