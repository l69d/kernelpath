"use client";

interface Props {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
}

export default function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color = "var(--color-green)",
  trackColor = "#1e2630",
  label,
  sublabel,
  showPercent = true,
}: Props) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const pct = Math.round(clamped * 100);

  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)",
            filter: clamped > 0 ? `drop-shadow(0 0 6px ${color})` : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {showPercent && (
          <span
            className="mono font-bold leading-none"
            style={{ fontSize: size * 0.24, color }}
          >
            {pct}%
          </span>
        )}
        {label && (
          <span className="mono text-[10px] uppercase tracking-widest text-faint mt-1">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[11px] text-muted mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
