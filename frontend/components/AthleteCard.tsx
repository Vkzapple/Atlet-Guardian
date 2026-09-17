import Link from "next/link";
import { Athlete } from "@/lib/types";
import { statusColor, statusLabel, formatRelativeTime } from "@/lib/status";

export default function AthleteCard({ athlete }: { athlete: Athlete }) {
  const reading = athlete.latestReading;
  const status = reading?.conditionStatus ?? null;
  const color = status ? statusColor[status] : "#7C8AA8";

  return (
    <Link
      href={`/athletes/${athlete.id}`}
      className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4 shadow-card transition-colors active:bg-surface-raised"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-ivory"
        style={{ backgroundColor: `${color}1F`, color }}
      >
        {athlete.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ivory">{athlete.name}</p>
        <p className="text-xs text-muted">{athlete.sport}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {reading ? (
          <>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${color}1F`, color }}>
              {statusLabel[status as keyof typeof statusLabel]}
            </span>
            <span className="text-[11px] text-muted">{formatRelativeTime(reading.timestamp)}</span>
          </>
        ) : (
          <span className="rounded-full bg-hairline px-2 py-0.5 text-[11px] font-medium text-muted">
            Belum ada data
          </span>
        )}
      </div>
    </Link>
  );
}
