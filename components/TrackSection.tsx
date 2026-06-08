import Link from "next/link";
import type { Track } from "@/lib/modules";
import { modulesInTrack } from "@/lib/modules";
import { getContent } from "@/lib/content";
import { trackColor, TRACK_INDEX } from "@/lib/ui";
import ModuleCard from "@/components/ModuleCard";
import { TrackProgressBar } from "@/components/ProgressBits";

export default function TrackSection({ track }: { track: Track }) {
  const mods = modulesInTrack(track.id);
  const color = trackColor(track.id);
  return (
    <section id={track.id} className="scroll-mt-20">
      <div className="flex items-start gap-4 mb-5">
        <Link
          href={`/track/${track.id}`}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg mono text-lg font-bold transition-transform hover:scale-105"
          style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}
        >
          {TRACK_INDEX[track.id]}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link href={`/track/${track.id}`}>
              <h2 className="text-xl font-bold tracking-tight hover:text-white" style={{ color }}>
                {track.title}
              </h2>
            </Link>
            <span className="mono text-[11px] text-faint">{mods.length} modules</span>
          </div>
          <p className="text-sm text-muted mt-0.5">{track.blurb}</p>
          <div className="mt-2 max-w-xs">
            <TrackProgressBar trackId={track.id} />
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
