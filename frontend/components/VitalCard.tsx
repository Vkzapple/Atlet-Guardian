import Sparkline from "./Sparkline";

interface VitalCardProps {
  label: string;
  value: string;
  unit: string;
  trend: number[];
  color: string;
}

export default function VitalCard({ label, value, unit, trend, color }: VitalCardProps) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold text-ivory">{value}</span>
        <span className="text-xs text-muted">{unit}</span>
      </div>
      <div className="mt-2">
        <Sparkline values={trend} color={color} />
      </div>
    </div>
  );
}
