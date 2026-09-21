import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Athlete Guardian",
    short_name: "Athlete Guardian",
    description: "Pemantauan kondisi fisik atlet berbasis AI dan wearable secara real-time",
    lang: "id",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0F1A",
    theme_color: "#0A0F1A",
    categories: ["health", "fitness", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      {
        name: "Peringatan",
        short_name: "Peringatan",
        description: "Lihat peringatan kondisi fisik",
        url: "/alerts",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Profil Saya",
        short_name: "Profil",
        description: "Lihat profil dan baseline",
        url: "/athletes",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
