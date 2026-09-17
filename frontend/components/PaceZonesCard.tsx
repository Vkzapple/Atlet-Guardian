import { PaceZoneInfo } from "@/lib/types";

interface PaceZonesCardProps {
  paceZones: Record<string, PaceZoneInfo>;
  currentZone: number;
}

const ZONE_LABEL: Record<string, string> = {
  "1": "Recovery",
  "2": "Easy",
  "3": "Tempo",
  "4": "Threshold",
  "5": "Interval"
};

export default function PaceZonesCard({ paceZones, currentZone }: PaceZonesCardProps) {
  const entries = Object.entries(paceZones || {});
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <p className="text-sm font-medium text-ivory">Referensi Pace per Zona</p>
      <p className="mt-0.5 text-[11px] text-muted">Dihitung personal dari HR max & HR rest kamu</p>
      <div className="mt-3 flex flex-col gap-1.5">
        {entries.map(([zone, info]) => {
          const isActive = Number(zone) === currentZone;
          return (
            <div
              key={zone}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs ${
                isActive ? "bg-brand/15 text-ivory" : "text-muted"
              }`}
            >
              <span>
                Zona {zone} · {ZONE_LABEL[zone] || ""}
              </span>
              <span className="font-medium">{info.pace_range}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
