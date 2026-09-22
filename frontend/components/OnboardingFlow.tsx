"use client";

import { useState } from "react";
import Logo from "./Logo";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type OnboardingStep = "intro" | "authChoice" | "login" | "register";

interface OnboardingFlowProps {
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onRegister: (payload: any) => Promise<void>;
}

// Alur: Intro ("siap?") -> pilih Masuk/Daftar -> form masing-masing.
// Register form-nya sendiri (RegisterForm.tsx) yang punya 2 langkah
// internal (akun -> profil & role), bukan diatur di sini.
export default function OnboardingFlow({ onLogin, onRegister }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("intro");

  if (step === "intro") {
    return (
      <div className="flex min-h-[calc(100dvh-3rem)] flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-volt/15 blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-volt/30 bg-surface shadow-card">
              <Logo size={56} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ivory">Athlete Guardian</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Pantau kondisi fisikmu secara real-time dari wearable device -- deteksi kelelahan
              sebelum jadi cedera, dapatkan rekomendasi latihan yang personal untuk kondisimu.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-ivory">Apakah kamu siap?</p>
          <p className="text-xs text-muted">Butuh kurang dari 2 menit untuk mulai.</p>
        </div>

        <button
          onClick={() => setStep("authChoice")}
          className="w-full max-w-xs rounded-full bg-volt py-3.5 text-sm font-bold text-ink"
        >
          Lanjutkan
        </button>
      </div>
    );
  }

  if (step === "authChoice") {
    return (
      <div className="flex min-h-[calc(100dvh-3rem)] flex-col items-center justify-center gap-6 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-volt/30 bg-surface">
          <Logo size={36} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-ivory">Mulai dengan Athlete Guardian</h2>
          <p className="mt-1 text-sm text-muted">Sudah punya akun, atau mau daftar baru?</p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => setStep("login")}
            className="rounded-full bg-volt py-3.5 text-sm font-bold text-ink"
          >
            Masuk
          </button>
          <button
            onClick={() => setStep("register")}
            className="rounded-full border border-hairline py-3.5 text-sm font-semibold text-ivory"
          >
            Buat Akun Baru
          </button>
        </div>

        <button onClick={() => setStep("intro")} className="text-xs text-muted underline">
          Kembali
        </button>
      </div>
    );
  }

  if (step === "login") {
    return (
      <div className="flex flex-col gap-4 px-5 pt-6">
        <button onClick={() => setStep("authChoice")} className="flex items-center gap-1 text-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali
        </button>
        <LoginForm onSubmit={onLogin} onSwitchToRegister={() => setStep("register")} />
      </div>
    );
  }

  // step === "register"
  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <button onClick={() => setStep("authChoice")} className="flex items-center gap-1 text-xs text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Kembali
      </button>
      <RegisterForm onSubmit={onRegister} onSwitchToLogin={() => setStep("login")} />
    </div>
  );
}