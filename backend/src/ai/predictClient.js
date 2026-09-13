import "dotenv/config";

const AI_API_URL = process.env.AI_API_URL || "http://127.0.0.1:8000/predict";
const AI_API_TIMEOUT_MS = Number(process.env.AI_API_TIMEOUT_MS) || 20000;

function computeBmi(heightCm, weightKg) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function mapRiskLevelToStatus(riskLevel, fatigueScore) {
  const normalized = (riskLevel || "").toLowerCase();
  if (normalized.includes("bahaya") || normalized.includes("kritis") || normalized.includes("tinggi")) {
    return "critical";
  }
  if (normalized.includes("waspada") || normalized.includes("sedang")) {
    return "warning";
  }
  if (normalized.includes("hati") || normalized.includes("ringan")) {
    return "caution";
  }
  if (normalized.includes("aman") || normalized.includes("rendah")) {
    return "optimal";
  }
  if (fatigueScore >= 80) return "critical";
  if (fatigueScore >= 60) return "warning";
  if (fatigueScore >= 40) return "caution";
  return "optimal";
}

export async function predictFatigue({ athlete, reading }) {
  const payload = {
    user_id: athlete.id,
    age: athlete.age,
    gender: athlete.gender,
    height_cm: athlete.heightCm,
    weight_kg: athlete.weightKg,
    training_history: athlete.trainingHistory,
    hr_current: reading.hrCurrent,
    breathing_rate: reading.breathingRate,
    duration_in_high_zone_min: reading.durationInHighZoneMin ?? 0,
    speed_decline_pct: reading.speedDeclinePct ?? 0,
    sleep_hours_last_night: reading.sleepHoursLastNight,
    rpe_self_report: reading.rpeSelfReport,
    hr_rest: athlete.baseline.restingHR
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_API_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`AI service tidak merespons dalam ${AI_API_TIMEOUT_MS}ms (mungkin sedang cold start)`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI service merespons status ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const result = await response.json();

  const fatigueScore = Number(result.fatigue_score);
  const riskLevel = result.risk_level;
  const conditionStatus = mapRiskLevelToStatus(riskLevel, fatigueScore);
  const earlyWarning = conditionStatus === "warning" || conditionStatus === "critical";

  return {
    fatigueScore,
    riskLevel,
    hrZone: result.hr_zone,
    hrMax: result.hr_max,
    hrPctOfMax: Math.round(Number(result.hr_pct_of_max) * 1000) / 10,
    recommendation: result.recommendation,
    bmi: Math.round(computeBmi(athlete.heightCm, athlete.weightKg) * 10) / 10,
    conditionStatus,
    earlyWarning,
    warningReasons: earlyWarning ? [`Tingkat risiko: ${riskLevel}`, result.recommendation] : [],
    recoveryEstimateMinutes: Math.round(fatigueScore * 1.1 + (conditionStatus === "critical" ? 15 : 0))
  };
}