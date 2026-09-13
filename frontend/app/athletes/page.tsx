"use client";

import { useEffect, useState } from "react";
import { createAthlete, deleteAthlete, getAthletes } from "@/lib/api";
import { Athlete, Gender, TrainingHistory } from "@/lib/types";
import AthleteCard from "@/components/AthleteCard";
import AddAthleteForm from "@/components/AddAthleteForm";

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await getAthletes();
      setAthletes(res.athletes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data atlet");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(payload: {
    name: string;
    sport: string;
    age: number;
    gender: Gender;
    heightCm: number;
    weightKg: number;
    trainingHistory: TrainingHistory;
  }) {
    const res = await createAthlete(payload);
    setAthletes((prev) => [...prev, res.athlete]);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await deleteAthlete(id);
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ivory">Atlet</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-ivory"
        >
          {showForm ? "Batal" : "+ Tambah"}
        </button>
      </header>

      {showForm && <AddAthleteForm onSubmit={handleCreate} />}

      {error && <p className="text-sm text-critical">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : athletes.length === 0 ? (
        <p className="text-sm text-muted">Belum ada atlet terdaftar.</p>
      ) : (
        <div className="flex flex-col gap-2 pb-6">
          {athletes.map((athlete) => (
            <div key={athlete.id} className="group relative">
              <AthleteCard athlete={athlete} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(athlete.id);
                }}
                className="absolute right-3 top-3 rounded-full bg-ink/60 px-2 py-1 text-[10px] text-muted"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
