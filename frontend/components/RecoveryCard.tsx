interface RecoveryCardProps {
  minutes: number;
  badgeLabel: string;
}

export default function RecoveryCard({ minutes, badgeLabel }: RecoveryCardProps) {
  const capped = Math.min(120, minutes);
  const percent = Math.round((capped / 120) * 100);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">Estimasi waktu pemulihan</p>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
          {badgeLabel}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold text-ivory">{minutes}</span>
        <span className="text-xs text-muted">menit</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
