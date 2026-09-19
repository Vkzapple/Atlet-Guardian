import { ConditionStatus } from "@/lib/types";
import { statusColor, statusLabel } from "@/lib/status";

interface StatusRingProps {
  status: ConditionStatus;
  fatigueScore: number;
  subtitle: string;
}

const TICK_COUNT = 40;

export default function StatusRing({ status, fatigueScore, subtitle }: StatusRingProps) {
  const size = 216;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, fatigueScore)) / 100;
  const offset = circumference * (1 - progress);
  const color = statusColor[status];
  const center = size / 2;
  const tickInner = radius - stroke / 2 - 6;
  const tickOuter = radius - stroke / 2 - 2;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = (i / TICK_COUNT) * 2 * Math.PI;
          const active = i / TICK_COUNT <= progress;
          const x1 = center + tickInner * Math.cos(angle);
          const y1 = center + tickInner * Math.sin(angle);
          const x2 = center + tickOuter * Math.cos(angle);
          const y2 = center + tickOuter * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? color : "#243252"}
              strokeWidth={1.5}
              opacity={active ? 0.9 : 0.5}
            />
          );
        })}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#161F35" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-[3.25rem] font-semibold leading-none tabular-nums text-ivory">
          {Math.round(fatigueScore)}
        </span>
        <span className="mt-1.5 text-[11px] text-muted">skor kelelahan</span>
        <span
          className="mt-2.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          {statusLabel[status]}
        </span>
        <span className="mt-2 max-w-[150px] text-center text-[11px] leading-snug text-muted">
          {subtitle}
        </span>
      </div>
    </div>
  );
}