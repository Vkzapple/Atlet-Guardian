export type SignalQuality = "good" | "weak" | "unknown";

export function assessSignalQuality(trend: number[]): SignalQuality {
  const recent = trend.slice(-5);
  if (recent.length < 3) return "unknown";

  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (mean === 0) return "weak";

  const variance = recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / recent.length;
  const stdev = Math.sqrt(variance);
  const coefficientOfVariation = stdev / mean;

  return coefficientOfVariation > 0.25 ? "weak" : "good";
}