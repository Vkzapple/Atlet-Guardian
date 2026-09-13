# Athlete Guardian — Smart Coach Assistance & Monitoring with AI Integrity

Dashboard pemantauan kondisi fisik atlet secara real-time. Proyek ini terdiri dari dua
bagian:

- **backend/** — REST API berbasis Express yang **fetch ke AI service (model terlatih)**
  untuk prediksi kelelahan, tersambung ke **Supabase (Postgres)** untuk penyimpanan data
  dan ke broker **EMQX** melalui **MQTT murni** (tanpa WebSocket) untuk menerima data dari
  perangkat/aplikasi pencatat.
- **frontend/** — Dashboard mobile-first berbasis Next.js (App Router), mendukung
  **mode malam (default) dan mode terang**, membaca data lewat REST API dengan polling
  berkala tanpa WebSocket.

Semua data yang ditampilkan berasal dari data sungguhan yang dikirim lewat MQTT dan
diproses oleh model AI sungguhan. Tidak ada data dummy/acak yang dirender di UI — jika
belum ada data masuk, dashboard menampilkan status "belum ada data".

## AI: fetch ke model terlatih (FastAPI)

Prediksi kelelahan **tidak lagi dihitung secara rule-based di backend** — backend
sekarang memanggil (fetch) endpoint `/predict` milik model AI yang sudah dilatih dan
di-deploy sebagai service FastAPI terpisah (`backend/src/ai/predictClient.js`).

Bentuk request/response mengikuti persis dokumentasi Swagger service tersebut:

**Request** (`POST {AI_API_URL}`):

```json
{
  "age": 10,
  "gender": "male",
  "height_cm": 100,
  "weight_kg": 25,
  "training_history": "pemula",
  "hr_current": 30,
  "breathing_rate": 5,
  "duration_in_high_zone_min": 0,
  "speed_decline_pct": 0,
  "sleep_hours_last_night": 7,
  "rpe_self_report": 5,
  "hr_rest": 30
}
```

**Response**:

```json
{
  "fatigue_score": 31.1,
  "risk_level": "Aman",
  "hr_zone": 1,
  "hr_max": 201,
  "hr_pct_of_max": 0.149,
  "recommendation": "Disarankan jalan cepat / jogging interval, fokus di Zona 1-2 dulu. Mulai dengan sesi pendek 15-20 menit dan tingkatkan bertahap."
}
```

Backend memetakan `risk_level` ke status internal (`optimal` / `caution` / `warning` /
`critical`) memakai pencocokan kata kunci ("aman", "waspada", "bahaya", dst.), dengan
skor `fatigue_score` sebagai fallback penentu jika kata kunci tidak dikenali. Field
`recommendation` disimpan dan ditampilkan langsung di dashboard sebagai saran pelatihan
dari model.

Konfigurasi di `backend/.env`:

```
AI_API_URL=http://127.0.0.1:8000/predict
AI_API_TIMEOUT_MS=20000
```

- Default `AI_API_URL` mengarah ke `127.0.0.1:8000/predict` untuk pengembangan lokal
  (sesuai URL di dokumentasi Swagger service AI saat dijalankan di komputer yang sama).
- **Untuk produksi, ganti ke URL deployment Render** milik service FastAPI-nya, misalnya
  `https://nama-service-anda.onrender.com/predict`.
- `AI_API_TIMEOUT_MS` diberi nilai default cukup longgar (20 detik) karena layanan Render
  free-tier bisa mengalami cold start; bila service tidak merespons dalam batas waktu ini,
  reading tersebut gagal diproses dan dicatat sebagai error di log backend (tidak ada
  angka kelelahan palsu yang disimpan).

## Arsitektur

```
Perangkat / aplikasi pencatat
      │ publish MQTT (mqtt://)
      ▼
   Broker EMQX
      │ subscribe MQTT (mqtt://, TCP murni — bukan WebSocket)
      ▼
Backend Express  ──▶  fetch AI_API_URL (model FastAPI terlatih, mis. di Render)
      │                    terima: fatigue_score, risk_level, hr_zone,
      │                    hr_max, hr_pct_of_max, recommendation
      ▼
  Supabase (Postgres)  ◀── disimpan & dibaca kembali via REST API
      ▲
      │ HTTP polling berkala (tanpa WebSocket)
      │
Frontend Next.js (mobile-first, mode malam/terang)
```

Backend juga mem-publish kembali hasil prediksi ke topik MQTT
`athlete-guardian/{athleteId}/status` dan `athlete-guardian/{athleteId}/alerts`.

## Menyiapkan Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file `backend/docs/supabase-schema.sql` untuk membuat
   tabel `athletes`, `readings`, `alerts`, dan view `latest_readings`.
3. Ambil `Project URL` dan `service_role key` dari **Project Settings → API**, isi ke
   `backend/.env` sebagai `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.

> Backend menggunakan service role key karena semua validasi dilakukan di lapisan
> Express. Jangan pernah mengekspos key ini ke frontend.

## Menyiapkan EMQX

```bash
# Contoh menjalankan EMQX lokal via Docker
docker run -d --name emqx -p 1883:1883 -p 18083:18083 emqx/emqx:latest
```

Isi `backend/.env`:

```
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_TOPIC_PREFIX=athlete-guardian
```

Koneksi backend ke broker memakai **MQTT murni melalui TCP** (`mqtt://`), tanpa lapisan
WebSocket di seluruh sistem — baik untuk ingest data maupun update dashboard (dashboard
memakai polling REST, bukan push WebSocket).

## Menjalankan backend

```bash
cd backend
npm install
cp .env.example .env   # isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MQTT_URL, AI_API_URL, dst
npm run dev
```

### Endpoint REST

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/athletes` | Daftar atlet + status terbaru |
| POST | `/api/athletes` | Tambah atlet (`name`, `sport`, `age`, `gender`, `heightCm`, `weightKg`, `trainingHistory`) |
| GET | `/api/athletes/:id` | Detail atlet + pembacaan terbaru |
| GET | `/api/athletes/:id/history?limit=60` | Riwayat pembacaan |
| POST | `/api/athletes/:id/calibrate` | Kalibrasi ulang baseline HR dari riwayat data |
| DELETE | `/api/athletes/:id` | Hapus atlet |
| GET | `/api/alerts?status=active` | Daftar peringatan |
| PATCH | `/api/alerts/:id/acknowledge` | Tandai peringatan selesai |

### Topik MQTT

| Topik | Arah | Isi |
|---|---|---|
| `athlete-guardian/{athleteId}/readings` | → Backend (subscribe) | Payload fitur mentah |
| `athlete-guardian/{athleteId}/status` | Backend → | Hasil prediksi AI (fatigue_score, risk_level, dst.) |
| `athlete-guardian/{athleteId}/alerts` | Backend → | Alert baru bila warning/critical |

### Format payload (dipublikasikan ke topik `readings`)

```json
{
  "hrCurrent": 172,
  "breathingRate": 34,
  "sleepHoursLastNight": 6.5,
  "rpeSelfReport": 7,
  "speedDeclinePct": 8,
  "durationInHighZoneMin": 12
}
```

`speedDeclinePct` dan `durationInHighZoneMin` opsional (default 0 bila tidak dikirim).
Backend menggabungkan payload ini dengan profil atlet (umur, gender, tinggi, berat,
riwayat latihan, baseline HR istirahat) sebelum di-fetch ke `AI_API_URL`.

### Menguji tanpa perangkat fisik

```bash
cd backend
npm run simulate -- <athleteId> [intervalMs]
```

Skrip ini mem-publish data simulasi ke MQTT seperti perangkat asli, lalu menampilkan
hasil prediksi AI (fatigue score, risk level, zona HR) yang diterima balik dari backend.

## Menjalankan frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Dashboard memperbarui data dengan polling REST setiap `NEXT_PUBLIC_POLL_INTERVAL_MS`
(default 4000ms) — tanpa koneksi WebSocket sama sekali. Rekomendasi dari model AI
ditampilkan langsung sebagai kartu terpisah di halaman detail atlet.

### Mode malam & mode terang

Tombol bulat di pojok kanan atas (di semua halaman) menukar tema. **Mode malam adalah
default** setiap kali dashboard dibuka pertama kali di perangkat baru; pilihan tema
disimpan di `localStorage` browser sehingga tetap konsisten pada kunjungan berikutnya.
Implementasi memakai CSS variable di `app/globals.css` (`:root` = gelap, `html.light` =
terang) sehingga seluruh komponen otomatis ikut berganti tanpa perlu di-styling ulang
satu per satu.

### Halaman

- `/` — Dashboard utama: status ring kelelahan, vital signs, rekomendasi AI, profil atlet
- `/athletes` — Daftar atlet (tampilan pelatih), tambah/hapus atlet
- `/athletes/[id]` — Detail pemantauan satu atlet
- `/alerts` — Riwayat peringatan dini (aktif / selesai)

## Struktur folder

```
athlete-guardian/
├── backend/
│   ├── docs/
│   │   ├── supabase-schema.sql     # Skema tabel Supabase
│   │   └── feature_importance.csv  # Referensi bobot fitur dari model AI
│   ├── src/
│   │   ├── ai/predictClient.js     # Fetch ke AI service (FastAPI, mis. di Render)
│   │   ├── ai/baseline.js          # Kalibrasi baseline HR personal
│   │   ├── routes/                 # athletes, alerts (REST, baca/tulis Supabase)
│   │   ├── supabase.js             # Data access layer ke Supabase
│   │   ├── mqtt.js                 # Klien MQTT ke EMQX
│   │   └── server.js
│   └── tools/simulate-device.js    # Alat bantu dev, publish MQTT, opsional
└── frontend/
    ├── app/                        # Next.js App Router pages
    ├── components/                 # UI components (termasuk ThemeToggle)
    └── lib/                        # API client, hook polling, types
```
