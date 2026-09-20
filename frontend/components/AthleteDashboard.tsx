"use client";

import { useMemo, useState } from "react";
import { calibrateAthlete, acknowledgeAlert, getAlerts, getAthlete } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { Athlete, AlertItem, Reading } from "@/lib/types";
import { statusColor, trainingHistoryLabel, genderLabel, formatRelativeTime } from "@/lib/status";
import StatusRing from "./StatusRing";
import VitalCard from "./VitalCard";
import RecoveryCard from "./RecoveryCard";
import AlertBanner from "./AlertBanner";
import InjuryRiskCard from "./InjuryRiskCard";
import PaceZonesCard from "./PaceZonesCard";
import AthleteHero from "./AthleteHero";

interface AthleteDashboardProps {
  initialAthlete: Athlete;
  initialHistory: Reading[];
  initialAlerts: AlertItem[];
}

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 4000;

export default function AthleteDashboard({
  initialAthlete,
  initialHistory,
  initialAlerts
}: AthleteDashboardProps) {
  const [athlete, setAthlete] = useState(initialAthlete);
  const [history, setHistory] = useState(initialHistory);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>(initialAlerts);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrateError, setCalibrateError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  usePolling(async () => {
    try {
      const [athleteRes, alertsRes] = await Promise.all([
        getAthlete(initialAthlete.id),
        getAlerts({ athleteId: initialAthlete.id, status: "active" })
      ]);

      const nextReading = athleteRes.athlete.latestReading;
      if (nextReading && nextReading.id !== athlete.latestReading?.id) {
        setHistory((prev) => [...prev.slice(-59), nextReading]);
      }
      setAthlete(athleteRes.athlete);
      setActiveAlerts(alertsRes.alerts);
      setLastSynced(new Date());
    } catch {
      return;
    }
  }, POLL_INTERVAL_MS);

  const reading = athlete.latestReading;

  const trends = useMemo(
    () => ({
      hr: history.map((r) => r.hrCurrent),
      breathing: history.map((r) => r.breathingRate),
      sleep: history.map((r) => r.sleepHoursLastNight),
      rpe: history.map((r) => r.rpeSelfReport)
    }),
    [history]
  );

  async function handleCalibrate() {
    setCalibrating(true);
    setCalibrateError(null);
    try {
      const res = await calibrateAthlete(athlete.id);
      setAthlete(res.athlete);
    } catch (err) {
      setCalibrateError(err instanceof Error ? err.message : "Kalibrasi gagal");
    } finally {
      setCalibrating(false);
    }
  }

  async function handleAcknowledge(alertId: string) {
    await acknowledgeAlert(alertId);
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-6">
      <AthleteHero
        name={athlete.name}
        sport={athlete.sport}
        syncLabel={lastSynced ? `Sinkron ${formatRelativeTime(lastSynced.toISOString())}` : "Menyinkronkan…"}
      />

      {!reading ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface p-8 text-center">
          <p className="text-sm font-medium text-ivory">Belum ada data sensor</p>
          <p className="mt-1 text-xs text-muted">
            Hubungkan perangkat wearable untuk {athlete.name} agar mulai memantau kondisi fisik
            secara real-time.
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-center py-2">
            <StatusRing
              status={reading.conditionStatus}
              fatigueScore={reading.fatigueScore}
              subtitle={`Zona HR ${reading.hrZone} · ${reading.riskLevel} · ${formatRelativeTime(reading.timestamp)}`}
            />
          </div>

          {reading.recommendation && (
            <div className="relative overflow-hidden rounded-3xl border border-volt/25 bg-[linear-gradient(135deg,rgba(196,255,61,0.14),rgba(76,141,255,0.06))] p-4">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-volt/20 blur-2xl animate-ai-glow"
                aria-hidden
              />
              <div className="relative flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-volt">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"
                      fill="#0A0F1A"
                    />
                  </svg>
                </span>
                <p className="text-xs font-bold uppercase tracking-wide text-volt">Rekomendasi AI</p>
              </div>
              <p className="relative mt-2 text-sm leading-relaxed text-ivory">{reading.recommendation}</p>
            </div>
          )}

          {activeAlerts.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeAlerts.map((alert) => (
                <AlertBanner key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
              ))}
            </div>
          )}

          <VitalCard
            label="Detak Jantung"
            value={reading.hrCurrent.toString()}
            unit="bpm"
            trend={trends.hr}
            color="#FF4D6D"
            featured
            live
          />

          <div className="grid grid-cols-3 gap-2.5">
            <VitalCard
              label="Napas"
              value={reading.breathingRate.toString()}
              unit="npm"
              trend={trends.breathing}
              color={statusColor.optimal}
            />
            <VitalCard
              label="Tidur"
              value={reading.sleepHoursLastNight.toString()}
              unit="jam"
              trend={trends.sleep}
              color={statusColor.caution}
            />
            <VitalCard
              label="RPE"
              value={reading.rpeSelfReport.toString()}
              unit="/10"
              trend={trends.rpe}
              color="#4C8DFF"
            />
          </div>

          <InjuryRiskCard
            injuryRiskPercent={reading.injuryRiskPercent}
            injuryRiskMethod={reading.injuryRiskMethod}
            nextSessionRecommendation={reading.nextSessionRecommendation}
          />

          <RecoveryCard minutes={reading.recoveryEstimateMinutes} badgeLabel={`Zona ${reading.hrZone}`} />

          <PaceZonesCard paceZones={reading.paceZones} currentZone={reading.hrZone} />
        </>
      )}

      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="text-sm font-medium text-ivory">Profil atlet</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
          <span>Jenis kelamin: {genderLabel[athlete.gender]}</span>
          <span>Usia: {athlete.age} tahun</span>
          <span>Tinggi: {athlete.heightCm} cm</span>
          <span>Berat: {athlete.weightKg} kg</span>
          <span>Riwayat latihan: {trainingHistoryLabel[athlete.trainingHistory]}</span>
          {reading && <span>BMI: {reading.bmi}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ivory">Baseline detak jantung</p>
            <p className="text-xs text-muted">
              Istirahat {athlete.baseline.restingHR} bpm · Maks {Math.round(athlete.baseline.maxHR)} bpm
            </p>
          </div>
          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-ivory transition-colors active:bg-surface-raised disabled:opacity-50"
          >
            {calibrating ? "Mengkalibrasi…" : "Kalibrasi ulang"}
          </button>
        </div>
        {athlete.baseline.calibratedAt && (
          <p className="mt-2 text-[11px] text-muted">
            Terakhir dikalibrasi {formatRelativeTime(athlete.baseline.calibratedAt)} dari{" "}
            {athlete.baseline.sampleSize} pembacaan
          </p>
        )}
        {calibrateError && <p className="mt-2 text-[11px] text-critical">{calibrateError}</p>}
      </div>
    </div>
  );
}