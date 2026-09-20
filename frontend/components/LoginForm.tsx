"use client";

import { FormEvent, useState } from "react";

interface LoginFormProps {
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSubmit, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal login");
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-xl border border-hairline bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-brand";
  const labelClass = "text-xs font-medium text-muted";

  return (
    <div className="flex flex-col items-center gap-6 px-5 pt-10">
      <p className="text-center text-sm text-muted">
        Masuk untuk memantau kondisi fisik kamu secara real-time.
      </p>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        {error && <p className="text-xs text-critical">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-ivory disabled:opacity-50"
        >
          {submitting ? "Masuk…" : "Masuk"}
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-center text-xs font-medium text-muted underline-offset-2 hover:underline"
        >
          Belum punya akun? Buat profil baru
        </button>
      </form>
    </div>
  );
}