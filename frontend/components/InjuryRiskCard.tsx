import { NextSessionRecommendation } from "@/lib/types";

interface InjuryRiskCardProps {
  injuryRiskPercent: number | null;
  injuryRiskMethod: "acwr" | "heuristic_awal" | null;
  nextSessionRecommendation: NextSessionRecommendation;
}

function riskColor(pct: number) {
  if (pct >= 50) return "#FF5470"; // critical
  if (pct >= 30) return "#FF8A4C"; // warning
  return "#2FE6A3"; // optimal
}

export default function InjuryRiskCard({
  injuryRiskPercent,
  injuryRiskMethod,
  nextSessionRecommendation
}: InjuryRiskCardProps) {
  if (injuryRiskPercent === null || injuryRiskPercent === undefined) return null;

  const color = riskColor(injuryRiskPercent);
  const methodLabel =
    injuryRiskMethod === "acwr"
      ? "Berdasarkan tren beban 7 sesi terakhir (ACWR)"
      : "Estimasi awal -- akurasi meningkat setelah 5+ sesi tercatat";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ivory">Risiko Cedera</p>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {injuryRiskPercent.toFixed(0)}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(injuryRiskPercent, 100)}%`, backgroundColor: color }}
        />
      </div>

      <p className="text-[11px] text-muted">{methodLabel}</p>

      {nextSessionRecommendation?.text && (
        <div className="mt-1 rounded-xl border border-hairline bg-ink p-3">
          <p className="text-xs font-semibold text-ivory">Rekomendasi sesi berikutnya</p>
          <p className="mt-1 text-sm leading-relaxed text-ivory">{nextSessionRecommendation.text}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextSessionRecommendation.target_hr_bpm && (
              <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-muted">
                Target HR: &lt;{nextSessionRecommendation.target_hr_bpm} bpm
              </span>
            )}
            {nextSessionRecommendation.target_hr_zone && (
              <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-muted">
                Zona {nextSessionRecommendation.target_hr_zone}
              </span>
            )}
            {nextSessionRecommendation.target_pace_range && (
              <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] text-muted">
                Pace: {nextSessionRecommendation.target_pace_range}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
