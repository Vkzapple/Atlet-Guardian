"use client";

import { useEffect, useState } from "react";

interface Goals {
  targetHrZone: number;
  weeklySessionTarget: number;
}

const DEFAULT_GOALS: Goals = { targetHrZone: 2, weeklySessionTarget: 3 };

function storageKey(athleteId: string) {
  return `athlete-guardian-goals-${athleteId}`;
}

// Target/goal MURNI di frontend (localStorage) untuk sekarang -- belum ada
// kolom di database. Kalau nanti mau goals ini tersimpan permanen & bisa
// dilihat lintas device, tambahkan kolom `target_hr_zone` dan
// `weekly_session_target` di tabel athletes + endpoint PATCH baru.
export default function TargetGoals({ athleteId }: { athleteId: string }) {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(athleteId));
    if (saved) {
      const parsed = JSON.parse(saved) as Goals;
      setGoals(parsed);
      setDraft(parsed);
    }
  }, [athleteId]);

  function handleSave() {
    setGoals(draft);
    localStorage.setItem(storageKey(athleteId), JSON.stringify(draft));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="text-sm font-medium text-ivory">Atur target</p>

        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted">Target zona HR latihan</label>
            <div className="mt-1.5 flex gap-2">
              {[1, 2, 3, 4, 5].map((zone) => (
                <button
                  key={zone}
                  onClick={() => setDraft((d) => ({ ...d, targetHrZone: zone }))}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${
                    draft.targetHrZone === zone ? "bg-volt text-ink" : "bg-surface-raised text-muted"
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted">Target sesi latihan per minggu</label>
            <input
              type="number"
              min={1}
              max={14}
              value={draft.weeklySessionTarget}
              onChange={(e) => setDraft((d) => ({ ...d, weeklySessionTarget: Number(e.target.value) }))}
              className="mt-1.5 w-full rounded-xl border border-hairline bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-volt"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setDraft(goals);
              setEditing(false);
            }}
            className="flex-1 rounded-full border border-hairline py-2.5 text-xs font-medium text-muted"
          >
            Batal
          </button>
          <button onClick={handleSave} className="flex-1 rounded-full bg-volt py-2.5 text-xs font-bold text-ink">
            Simpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ivory">Target latihan</p>
        <button onClick={() => setEditing(true)} className="text-xs font-medium text-volt">
          Ubah
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-raised p-3">
          <p className="font-mono text-xl font-semibold text-ivory">Zona {goals.targetHrZone}</p>
          <p className="text-[11px] text-muted">Target intensitas</p>
        </div>
        <div className="rounded-xl bg-surface-raised p-3">
          <p className="font-mono text-xl font-semibold text-ivory">{goals.weeklySessionTarget}x</p>
          <p className="text-[11px] text-muted">Sesi per minggu</p>
        </div>
      </div>
    </div>
  );
}