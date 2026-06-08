import Link from "next/link";
import { StatusDot } from "@/components/ProgressBits";
import { trackColor } from "@/lib/ui";

interface Props {
  id: string;
  track: string;
  title: string;
  oneLiner?: string;
  hours?: number;
  conceptCount?: number;
  ready?: boolean;
}

export default function ModuleCard({
  id,
  track,
  title,
  oneLiner,
  hours,
  conceptCount,
  ready,
}: Props) {
  const color = trackColor(track);
  return (
    <Link
      href={`/module/${id}`}
      className="card card-hover group flex flex-col p-4 h-full"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="mono text-[10px] font-bold rounded px-1.5 py-0.5"
          style={{ background: `${color}1f`, color, border: `1px solid ${color}44` }}
        >
          {id}
        </span>
        <StatusDot id={id} />
      </div>
      <h3 className="text-sm font-semibold leading-snug text-text group-hover:text-white">
        {title}
      </h3>
      {oneLiner && (
        <p className="mt-1.5 text-xs text-muted line-clamp-2 flex-1">{oneLiner}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-[10px] mono text-faint">
        {typeof conceptCount === "number" && conceptCount > 0 && (
          <span>{conceptCount} concepts</span>
        )}
        {typeof hours === "number" && hours > 0 && <span>~{hours}h</span>}
        {!ready && <span className="text-amber/70">drafting…</span>}
      </div>
    </Link>
  );
}
