-- Migrasi: tambah tabel `users` untuk login (email + password).
-- Satu akun (users) terhubung ke satu profil atlet (athletes), sesuai
-- model "1 akun = 1 profil" yang dipakai frontend (lihat frontend/lib/myAthlete.ts).
--
-- Jalankan di Supabase SQL Editor SETELAH supabase-schema.sql.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  athlete_id uuid references athletes(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists users_athlete_id_idx on users (athlete_id);

-- Email disimpan huruf kecil semua supaya pencarian saat login tidak
-- case-sensitive (dilakukan juga di lapisan aplikasi, ini index pendukung saja).
create unique index if not exists users_email_lower_idx on users (lower(email));
