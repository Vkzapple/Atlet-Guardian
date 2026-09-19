import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"]
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "Athlete Guardian",
  applicationName: "Athlete Guardian",
  description: "Pemantauan kondisi fisik atlet berbasis AI dan wearable secara real-time",
  // <link rel="manifest"> otomatis dibuat Next.js dari app/manifest.ts
  appleWebApp: {
    capable: true,
    title: "Guardian",
    // "black": status bar hitam solid dengan teks putih -- terbaca di tema gelap maupun terang.
    statusBarStyle: "black"
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0F1A"
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("athlete-guardian-theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} font-body antialiased`}>
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-ink">
          <AppHeader />
          <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
          <BottomNav />
          <InstallPrompt />
          <PWARegister />
        </div>
      </body>
    </html>
  );
}
