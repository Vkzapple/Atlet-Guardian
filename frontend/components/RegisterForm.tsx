"use client";

import { FormEvent, useState } from "react";
import { Gender, InjuryHistory, TrainingHistory } from "@/lib/types";

export type UserRole = "pegiat_olahraga" | "athlete" | "coach";

export interface RegisterPayload {
  role: UserRole;
  email: string;
  password: string;
  name: string;
  // Field di bawah ini hanya relevan untuk role "athlete" / "pegiat_olahraga"
  sport?: string;
  age?: number;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  trainingHistory?: TrainingHistory;
  injuryHistory?: InjuryHistory;
  // Khusus role "athlete"
  hasCoach?: boolean;
  coachEmail?: string;
}

interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => Promise<void>;
  onSwitchToLogin: () => void;
}

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  { value: "pegiat_olahraga", label: "Pegiat Olahraga", desc: "Pantau kondisi fisik pribadi secara mandiri" },
  { value: "athlete", label: "Atlet", desc: "Pantau performa, opsional terhubung ke coach" },
  { value: "coach", label: "Coach", desc: "Pantau banyak atlet dalam satu dashboard" }
];

export default function RegisterForm({ onSubmit, onSwitchToLogin }: RegisterFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [role, setRole] = useState<UserRole>("athlete");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Step 2 (profil fisiologis -- tidak berlaku untuk role coach)
  const [sport, setSport] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory>("pemula");
  const [hasCoach, setHasCoach] = useState<boolean | null>(null);
  const [coachEmail, setCoachEmail] = useState("");

  const inputClass =
    "rounded-xl border border-hairline bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-volt";
  const labelClass = "text-xs font-medium text-muted";

  function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) {
      setError("Nama, email, dan password wajib diisi");
      return;
    }
    setError(null);

    // Coach tidak butuh profil fisiologis -- langsung submit dari step 1.
    if (role === "coach") {
      handleFinalSubmit();
      return;
    }
    setStep(2);
  }

  async function handleFinalSubmit(e?: FormEvent) {
    e?.preventDefault();

    if (role !== "coach") {
      if (!sport.trim() || !age || !heightCm || !weightKg) {
        setError("Lengkapi semua field profil");
        return;
      }
      if (role === "athlete" && hasCoach === true && !coachEmail.trim()) {
        setError("Masukkan email coach kamu, atau pilih 'Tidak punya coach'");
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        role,
        email: email.trim(),
        password,
        name: name.trim(),
        ...(role !== "coach" && {
          sport: sport.trim(),
          age: Number(age),
          gender,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          trainingHistory,
          injuryHistory: "tidak_ada" as InjuryHistory
        }),
        ...(role === "athlete" && {
          hasCoach: hasCoach === true,
          coachEmail: hasCoach ? coachEmail.trim() : undefined
        })
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar");
      setSubmitting(false);
    }
  }

  if (step === 1) {
    return (
      <form onSubmit={handleStep1Submit} className="flex flex-col gap-4 rounded-2xl border border-hairline bg-surface p-4">
        <div>
          <p className="text-sm font-semibold text-ivory">Kamu ini siapa?</p>
          <div className="mt-2 flex flex-col gap-2">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  role === opt.value ? "border-volt bg-volt/10" : "border-hairline bg-ink"
                }`}
              >
                <p className={`text-sm font-semibold ${role === opt.value ? "text-volt" : "text-ivory"}`}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nama</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" className={inputClass} />
        </div>
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
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-critical">{error}</p>}

        <button type="submit" disabled={submitting} className="rounded-full bg-volt py-2.5 text-sm font-bold text-ink disabled:opacity-50">
          {role === "coach" ? (submitting ? "Mendaftar…" : "Daftar") : "Lanjutkan"}
        </button>
        <button type="button" onClick={onSwitchToLogin} className="text-center text-xs font-medium text-muted underline-offset-2 hover:underline">
          Sudah punya akun? Masuk
        </button>
      </form>
    );
  }

  // Step 2: profil fisiologis (role athlete / pegiat_olahraga)
  return (
    <form onSubmit={handleFinalSubmit} className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4">
      <p className="text-sm font-semibold text-ivory">Lengkapi profil kamu</p>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Cabang olahraga</label>
        <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="mis. Lari 300m" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Usia</label>
          <input value={age} onChange={(e) => setAge(e.target.value)} type="number" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Jenis kelamin</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputClass}>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Tinggi (cm)</label>
          <input value={heightCm} onChange={(e) => setHeightCm(e.target.value)} type="number" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Berat (kg)</label>
          <input value={weightKg} onChange={(e) => setWeightKg(e.target.value)} type="number" className={inputClass} />
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

      {role === "athlete" && (
        <div>
          <p className={labelClass}>Apakah kamu punya coach?</p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={() => setHasCoach(true)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${
                hasCoach === true ? "bg-volt text-ink" : "bg-ink text-muted border border-hairline"
              }`}
            >
              Ya, punya coach
            </button>
            <button
              type="button"
              onClick={() => setHasCoach(false)}
              className={`flex-1 rounded-xl py-2.5 text-xs font-semibold ${
                hasCoach === false ? "bg-volt text-ink" : "bg-ink text-muted border border-hairline"
              }`}
            >
              Tidak
            </button>
          </div>
          {hasCoach === true && (
            <input
              value={coachEmail}
              onChange={(e) => setCoachEmail(e.target.value)}
              placeholder="Email coach kamu"
              className={`${inputClass} mt-2 w-full`}
            />
          )}
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
            Coach hanya bisa melihat data yang kamu bagikan. Kamu bisa putuskan koneksi kapan saja dari halaman Profil.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-critical">{error}</p>}

      <div className="mt-1 flex gap-2">
        <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-full border border-hairline py-2.5 text-xs font-medium text-muted">
          Kembali
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-volt py-2.5 text-xs font-bold text-ink disabled:opacity-50">
          {submitting ? "Mendaftar…" : "Selesai"}
        </button>
      </div>
    </form>
  );
}