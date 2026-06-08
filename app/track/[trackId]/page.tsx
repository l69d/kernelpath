import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TRACKS, trackById, modulesInTrack } from "@/lib/modules";
import { getContent } from "@/lib/content";
import { trackColor, TRACK_INDEX } from "@/lib/ui";
import ModuleCard from "@/components/ModuleCard";
import { TrackProgressBar } from "@/components/ProgressBits";

export const dynamicParams = false;

export function generateStaticParams() {
  return TRACKS.map((t) => ({ trackId: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackId: string }>;
}): Promise<Metadata> {
  const { trackId } = await params;
  const t = trackById(trackId);
  if (!t) return { title: "Not found" };
  return { title: t.title, description: t.blurb };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;
  const track = trackById(trackId);
  if (!track) notFound();

  const mods = modulesInTrack(trackId);
  const color = trackColor(trackId);
  const tIndex = TRACKS.findIndex((t) => t.id === trackId);
  const prevTrack = tIndex > 0 ? TRACKS[tIndex - 1] : undefined;
  const nextTrack = tIndex < TRACKS.length - 1 ? TRACKS[tIndex + 1] : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2 text-xs mono text-faint mb-6">
        <Link href="/" className="hover:text-text">
          roadmap
        </Link>
        <span>/</span>
        <span className="text-muted">track {TRACK_INDEX[trackId]}</span>
      </div>

      <div className="flex items-start gap-5">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-xl mono text-2xl font-black"
          style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}
        >
          {TRACK_INDEX[trackId]}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color }}>
            {track.title}
          </h1>
          <p className="mt-2 text-muted">{track.blurb}</p>
          <div className="mt-4 max-w-sm">
            <TrackProgressBar trackId={trackId} />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mods.map((m) => {
          const c = getContent(m.id);
          return (
            <ModuleCard
              key={m.id}
              id={m.id}
              track={m.track}
              title={m.title}
              oneLiner={c?.oneLiner ?? m.brief}
              hours={c?.estimatedHours}
              conceptCount={c?.concepts?.length}
              ready={Boolean(c)}
            />
          );
        })}
      </div>

      {/* track nav */}
      <div className="mt-12 grid grid-cols-2 gap-3">
        {prevTrack ? (
          <Link href={`/track/${prevTrack.id}`} className="card card-hover p-4">
            <div className="mono text-[10px] text-faint">← previous track</div>
            <div className="text-sm font-medium mt-1" style={{ color: trackColor(prevTrack.id) }}>
              {prevTrack.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextTrack ? (
          <Link href={`/track/${nextTrack.id}`} className="card card-hover p-4 text-right">
            <div className="mono text-[10px] text-faint">next track →</div>
            <div className="text-sm font-medium mt-1" style={{ color: trackColor(nextTrack.id) }}>
              {nextTrack.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
