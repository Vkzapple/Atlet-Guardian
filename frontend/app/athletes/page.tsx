"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calibrateAthlete, deleteAthlete, getAthlete } from "@/lib/api";
import { clearMyAthleteId, getMyAthleteId } from "@/lib/myAthlete";
import { clearToken } from "@/lib/auth";
import { Athlete } from "@/lib/types";

const labelMap = {
  gender: { male: "Laki-laki", female: "Perempuan" },
  trainingHistory: { pemula: "Pemula", rutin: "Rutin", terlatih: "Terlatih" },
};

export default function ProfilSayaPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const id = getMyAthleteId();
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const res = await getAthlete(id);
      setAthlete(res.athlete);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCalibrate() {
    if (!athlete) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await calibrateAthlete(athlete.id);
      setAthlete(res.athlete);
      setMessage("Baseline berhasil dikalibrasi ulang dari data sensor terbaru.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal kalibrasi -- minimal 5 data sensor diperlukan."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResetProfile() {
    if (!athlete) return;
    const confirmed = window.confirm(
      "Yakin mau hapus profil dan mulai dari awal? Semua riwayat data kamu akan hilang."
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await deleteAthlete(athlete.id);
      clearMyAthleteId();
      clearToken();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus profil");
      setBusy(false);
    }
  }

  function handleLogout() {
    clearMyAthleteId();
    clearToken();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="px-5 pt-6">
        <p className="text-sm text-muted">Memuat…</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex flex-col gap-3 px-5 pt-8 text-center">
        <p className="text-sm text-muted">
          Kamu belum login. Kembali ke Dasbor untuk masuk atau membuat akun terlebih dahulu.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6 pb-10">
      <h1 className="text-xl font-bold text-ivory">Profil Saya</h1>

      <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4 shadow-card">
        <Row label="Nama" value={athlete.name} />
        <Row label="Cabang olahraga" value={athlete.sport} />
        <Row label="Usia" value={`${athlete.age} tahun`} />
        <Row label="Jenis kelamin" value={labelMap.gender[athlete.gender]} />
        <Row label="Tinggi" value={`${athlete.heightCm} cm`} />
        <Row label="Berat" value={`${athlete.weightKg} kg`} />
        <Row label="Riwayat latihan" value={labelMap.trainingHistory[athlete.trainingHistory]} />
        <Row label="HR Istirahat (baseline)" value={`${athlete.baseline.restingHR} bpm`} />
        <Row label="HR Maksimal" value={`${athlete.baseline.maxHR} bpm`} />
        {athlete.baseline.calibratedAt && (
          <Row
            label="Terakhir dikalibrasi"
            value={new Date(athlete.baseline.calibratedAt).toLocaleString("id-ID")}
          />
        )}
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}
      {message && <p className="text-sm text-optimal">{message}</p>}

      <button
        onClick={handleCalibrate}
        disabled={busy}
        className="rounded-full bg-brand py-2.5 text-sm font-semibold text-ivory disabled:opacity-50"
      >
        {busy ? "Memproses…" : "Kalibrasi Ulang Baseline"}
      </button>
      <p className="text-center text-[11px] text-muted">
        Baseline (HR istirahat personal) otomatis dihitung ulang dari 20% data sensor terendah
        di sesi-sesi terakhir kamu. Butuh minimal 5 data.
      </p>

      <button
        onClick={handleResetProfile}
        disabled={busy}
        className="mt-4 rounded-full border border-hairline py-2.5 text-sm font-semibold text-critical disabled:opacity-50"
      >
        Hapus Profil & Mulai Ulang
      </button>

      <button
        onClick={handleLogout}
        disabled={busy}
        className="rounded-full border border-hairline py-2.5 text-sm font-semibold text-muted disabled:opacity-50"
      >
        Keluar
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium text-ivory">{value}</span>
    </div>
  );
}
