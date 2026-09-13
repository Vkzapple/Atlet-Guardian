import { ReactNode } from "react";
import { ConditionStatus } from "@/lib/types";
import { statusColor, statusLabel } from "@/lib/status";

interface StatusRingProps {
  status: ConditionStatus;
  fatigueScore: number;
  subtitle: ReactNode;
}

export default function StatusRing({ status, fatigueScore, subtitle }: StatusRingProps) {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, fatigueScore)) / 100;
  const offset = circumference * (1 - progress);
  const color = statusColor[status];

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1C2740"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
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
        <span className="font-mono text-4xl font-semibold text-ivory">
          {Math.round(fatigueScore)}
        </span>
        <span className="text-xs text-muted">skor kelelahan</span>
        <span
          className="mt-2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          {statusLabel[status]}
        </span>
        <span className="mt-1 max-w-[140px] text-center text-[11px] text-muted">{subtitle}</span>
      </div>
    </div>
  );
}