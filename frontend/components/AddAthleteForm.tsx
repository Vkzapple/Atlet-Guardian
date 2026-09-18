"use client";

import { FormEvent, useState } from "react";
import { Gender, InjuryHistory, TrainingHistory } from "@/lib/types";

interface AddAthleteFormProps {
  onSubmit: (payload: {
    email: string;
    password: string;
    name: string;
    sport: string;
    age: number;
    gender: Gender;
    heightCm: number;
    weightKg: number;
    trainingHistory: TrainingHistory;
    injuryHistory: InjuryHistory;
  }) => Promise<void>;
  onSwitchToLogin: () => void;
}

export default function AddAthleteForm({ onSubmit, onSwitchToLogin }: AddAthleteFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory>("rutin");
  const [injuryHistory, setInjuryHistory] = useState<InjuryHistory>("tidak_ada");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim() || !sport.trim() || !age || !heightCm || !weightKg) {
      setError("Semua kolom wajib diisi");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        email: email.trim(),
        password,
        name: name.trim(),
        sport: sport.trim(),
        age: Number(age),
        gender,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        trainingHistory,
        injuryHistory
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-xl border border-hairline bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-brand";
  const labelClass = "text-xs font-medium text-muted";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="kamu@email.com"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Nama kamu</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Raka Pratama"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Cabang olahraga</label>
        <input
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Contoh: Lari 400m"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Usia</label>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="number"
            placeholder="21"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Jenis kelamin</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className={inputClass}
          >
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Tinggi (cm)</label>
          <input
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            type="number"
            placeholder="175"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Berat (kg)</label>
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            type="number"
            placeholder="68"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Riwayat latihan</label>
        <select
          value={trainingHistory}
          onChange={(e) => setTrainingHistory(e.target.value as TrainingHistory)}
          className={inputClass}
        >
          <option value="pemula">Pemula</option>
          <option value="rutin">Rutin</option>
          <option value="terlatih">Terlatih</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Riwayat cedera</label>
        <select
          value={injuryHistory}
          onChange={(e) => setInjuryHistory(e.target.value as InjuryHistory)}
          className={inputClass}
        >
          <option value="tidak_ada">Tidak ada</option>
          <option value="lutut">Lutut</option>
          <option value="pergelangan_kaki">Pergelangan kaki</option>
          <option value="punggung">Punggung</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
      {error && <p className="text-xs text-critical">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-ivory disabled:opacity-50"
      >
        {submitting ? "Membuat akun…" : "Buat Akun & Profil"}
      </button>
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-center text-xs font-medium text-muted underline-offset-2 hover:underline"
      >
        Sudah punya akun? Masuk
      </button>
    </form>
  );
}
