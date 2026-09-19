import Sparkline from "./Sparkline";

interface VitalCardProps {
  label: string;
  value: string;
  unit: string;
  trend: number[];
  color: string;
  featured?: boolean;
  live?: boolean;
}

export default function VitalCard({
  label,
  value,
  unit,
  trend,
  color,
  featured = false,
  live = false
}: VitalCardProps) {
  if (featured) {
    return (
      <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
        <div className="flex items-center gap-1.5">
          {live && (
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            </span>
          )}
          <p className="text-xs font-medium text-muted">{label}</p>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-5xl font-semibold tabular-nums text-ivory">{value}</span>
          <span className="text-sm text-muted">{unit}</span>
        </div>
        <div className="mt-3">
          <Sparkline values={trend} color={color} filled />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-3.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold tabular-nums text-ivory">{value}</span>
        <span className="text-[11px] text-muted">{unit}</span>
      </div>
      <div className="mt-1.5">
        <Sparkline values={trend} color={color} />
      </div>
    </div>
  );
}