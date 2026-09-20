import { SignalQuality } from "@/lib/sensorQuality";

interface SignalQualityBadgeProps {
  quality: SignalQuality;
}

const config: Record<SignalQuality, { label: string; color: string }> = {
  good: { label: "Sinyal baik", color: "#2FE6A3" },
  weak: { label: "Sinyal lemah -- perbaiki posisi jari", color: "#FFB84D" },
  unknown: { label: "Menganalisis sinyal…", color: "#7C8AA8" }
};

export default function SignalQualityBadge({ quality }: SignalQualityBadgeProps) {
  const { label, color } = config[quality];
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px]" style={{ color }}>
        {label}
      </span>
    </div>
  );
}