create extension if not exists pgcrypto;

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text not null,
  age integer not null,
  gender text not null check (gender in ('male', 'female')),
  height_cm numeric not null,
  weight_kg numeric not null,
  training_history text not null check (training_history in ('pemula', 'rutin', 'terlatih')),
  resting_hr numeric not null default 65,
  max_hr numeric not null default 190,
  calibrated_at timestamptz,
  sample_size integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  hr_current numeric not null,
  hr_pct_of_max numeric not null,
  breathing_rate numeric not null,
  sleep_hours_last_night numeric not null,
  rpe_self_report numeric not null,
  speed_decline_pct numeric not null default 0,
  duration_in_high_zone_min numeric not null default 0,
  bmi numeric not null,
  fatigue_score numeric not null,
  risk_level text not null,
  hr_zone integer not null,
  recommendation text not null default '',
  condition_status text not null,
  recovery_estimate_minutes integer not null,
  early_warning boolean not null default false,
  warning_reasons jsonb not null default '[]'
);

create index if not exists readings_athlete_id_recorded_at_idx
  on readings (athlete_id, recorded_at desc);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  athlete_name text not null,
  created_at timestamptz not null default now(),
  status text not null,
  reasons jsonb not null default '[]',
  fatigue_score numeric not null,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz
);

create index if not exists alerts_athlete_id_created_at_idx
  on alerts (athlete_id, created_at desc);

create or replace view latest_readings as
select distinct on (athlete_id) *
from readings
order by athlete_id, recorded_at desc;
