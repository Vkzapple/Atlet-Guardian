-- Jalankan di Supabase SQL Editor (project "fitband" punya web developer,
-- BUKAN project AI service yang isinya tabel "sessions")

-- 1. Riwayat cedera user -- dipakai untuk personalisasi injury risk & warning
alter table athletes
  add column if not exists injury_history text not null default 'tidak_ada'
  check (injury_history in ('tidak_ada', 'lutut', 'pergelangan_kaki', 'punggung', 'lainnya'));

-- 2. Field hasil baru dari AI service, biar tersimpan permanen (bukan cuma
--    numpang lewat MQTT), supaya kalau user refresh/reload data tetap ada.
alter table readings
  add column if not exists injury_risk_percent numeric,
  add column if not exists injury_risk_method text,
  add column if not exists next_session_recommendation jsonb not null default '{}',
  add column if not exists pace_zones jsonb not null default '{}';
