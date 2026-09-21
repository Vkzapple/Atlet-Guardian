/* Athlete Guardian service worker
 *
 * ATURAN UTAMA: service worker ini TIDAK ikut campur dalam pengambilan data.
 *  - Semua request cross-origin (termasuk backend NEXT_PUBLIC_API_URL di Railway) dilewatkan apa adanya.
 *  - Semua request non-GET (login, register, calibrate, acknowledge, delete) dilewatkan apa adanya.
 *  - Path /api/ dilewatkan apa adanya.
 *  - Request RSC / _next/data milik Next.js dilewatkan apa adanya.
 * Yang ditangani hanya: aset statis Next.js, ikon, dan halaman fallback saat offline.
 *
 * Naikkan VERSION setiap kali isi file ini berubah supaya cache lama dibersihkan.
 */

const VERSION = "v1.2";
const STATIC_CACHE = `ag-static-${VERSION}`;
const RUNTIME_CACHE = `ag-runtime-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        // Satu aset gagal tidak boleh menggagalkan seluruh instalasi.
        Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)))
      )
  );
  // Sengaja TIDAK skipWaiting otomatis: versi baru menunggu sampai pengguna menekan "Perbarui"
  // (lihat PWARegister). Ini mencegah halaman yang sedang terbuka tiba-tiba memakai aset campuran.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("ag-") && !keep.has(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // 1) Bukan GET -> biarkan browser yang menangani.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 2) Cross-origin (backend API, Google Fonts, dll.) -> biarkan browser yang menangani.
  if (url.origin !== self.location.origin) return;

  // 3) Endpoint API / data Next.js / RSC -> biarkan browser yang menangani.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") ||
    request.headers.get("Next-Router-Prefetch")
  ) {
    return;
  }

  // 4) Navigasi halaman: selalu network. Kalau gagal (offline) -> tampilkan halaman /offline.
  //    HTML sengaja tidak di-cache supaya sesi/token tidak pernah "terbekukan" di cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return (
          cached ||
          new Response("Kamu sedang offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      })
    );
    return;
  }

  // 5) Aset build Next.js yang di-hash (immutable) -> cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 6) Ikon & manifest -> stale-while-revalidate.
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 7) Selain itu -> biarkan browser yang menangani.
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return hit || (await network) || Response.error();
}
