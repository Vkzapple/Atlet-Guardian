import { AlertItem } from "@/lib/types";
import { statusColor, statusLabel } from "@/lib/status";
import RelativeTime from "./RelativeTime";

interface AlertBannerProps {
  alert: AlertItem;
  onAcknowledge?: (id: string) => void;
  showAthleteName?: boolean;
}

export default function AlertBanner({ alert, onAcknowledge, showAthleteName }: AlertBannerProps) {
  const color = statusColor[alert.status];

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}12` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm font-semibold text-ivory">{statusLabel[alert.status]}</span>
            {showAthleteName && (
              <span className="text-xs text-muted">· {alert.athleteName}</span>
            )}
          </div>
          <ul className="mt-2 space-y-1">
            {alert.reasons.map((reason, index) => (
              <li key={index} className="text-xs text-muted">
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted">
            <RelativeTime timestamp={alert.timestamp} />
          </p>
        </div>
        {onAcknowledge && !alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ivory transition-colors active:bg-surface-raised"
          >
            Tandai selesai
          </button>
        )}
        {alert.acknowledged && (
          <span className="shrink-0 rounded-full bg-hairline px-3 py-1.5 text-xs font-medium text-muted">
            Selesai
          </span>
        )}
      </div>
    </div>
  );
}