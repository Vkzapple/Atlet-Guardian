import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";

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
  description: "Pemantauan kondisi fisik atlet berbasis AI dan wearable secara real-time"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <div className="mx-auto flex min-h-screen max-w-md flex-col bg-ink">
          <ThemeToggle />
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
