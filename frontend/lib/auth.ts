/**
 * Penyimpanan token JWT hasil login/register.
 * Dipakai bersama dengan myAthleteId (lib/myAthlete.ts) -- token untuk otorisasi
 * request ke backend, myAthleteId untuk tahu profil mana yang sedang ditampilkan.
 */

const TOKEN_KEY = "athlete-guardian-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
