"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { calibrateAthlete, deleteAthlete, getAthlete, uploadAthletePhoto, removeAthletePhoto } from "@/lib/api";
import { clearMyAthleteId, getMyAthleteId } from "@/lib/myAthlete";
import { clearToken } from "@/lib/auth";
import { Athlete } from "@/lib/types";
import Logo from "@/components/Logo";
import HistorySection from "@/components/HistorySection";

const labelMap = {
  gender: { male: "Laki-laki", female: "Perempuan" },
  trainingHistory: { pemula: "Pemula", rutin: "Rutin", terlatih: "Terlatih" },
};

export default function ProfilSayaPage() {
  const router = useRouter();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handlePhotoPick() {
    fileInputRef.current?.click();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !athlete) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("Ukuran foto maksimal 3MB");
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    try {
      const res = await uploadAthletePhoto(athlete.id, file);
      setAthlete(res.athlete);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload foto");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemovePhoto() {
    if (!athlete) return;
    setUploadingPhoto(true);
    try {
      const res = await removeAthletePhoto(athlete.id);
      setAthlete(res.athlete);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

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

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-surface p-6 shadow-card">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-volt/40 bg-surface-raised">
            {athlete.photoUrl ? (
              <img src={athlete.photoUrl} alt={athlete.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Logo size={44} className="opacity-70" />
              </div>
            )}
          </div>
          <button
            onClick={handlePhotoPick}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-volt text-ink shadow-card disabled:opacity-50"
            aria-label="Ubah foto profil"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 20h4l10-10a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16v4z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-ivory">{athlete.name}</p>
          <p className="text-xs text-muted">{athlete.sport}</p>
        </div>
        {athlete.photoUrl && (
          <button onClick={handleRemovePhoto} disabled={uploadingPhoto} className="text-[11px] text-muted underline disabled:opacity-50">
            {uploadingPhoto ? "Memproses…" : "Hapus foto"}
          </button>
        )}
      </div>

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

      <div>
        <p className="mb-2 text-sm font-medium text-ivory">Riwayat</p>
        <HistorySection athleteId={athlete.id} />
      </div>

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