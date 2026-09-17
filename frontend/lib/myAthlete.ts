/**
 * Personal mode: 1 device/browser = 1 profil ("kamu").
 * ID profil disimpan di localStorage, bukan dipilih dari daftar banyak atlet.
 *
 * Kalau nanti mau dikembangkan jadi versi coach/tim, tinggal ganti sumber
 * "myAthleteId" ini dari auth/session, tanpa perlu ubah backend sama sekali.
 */

const STORAGE_KEY = "myAthleteId";

export function getMyAthleteId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setMyAthleteId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function clearMyAthleteId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
