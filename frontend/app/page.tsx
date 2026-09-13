import Link from "next/link";
import { getAthletes, getAthleteHistory, getAlerts } from "@/lib/api";
import AthleteDashboard from "@/components/AthleteDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { athletes } = await getAthletes();

  if (athletes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 pt-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <span className="text-2xl">🛡️</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-ivory">Athlete Guardian</h1>
          <p className="mt-1 text-sm text-muted">
            Belum ada atlet yang terdaftar. Tambahkan profil atlet untuk mulai memantau kondisi
            fisik secara real-time dari wearable device.
          </p>
        </div>
        <Link
          href="/athletes"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-ivory"
        >
          Tambah Atlet
        </Link>
      </div>
    );
  }

  const primary = [...athletes].sort((a, b) => {
    const aTime = a.latestReading ? new Date(a.latestReading.timestamp).getTime() : 0;
    const bTime = b.latestReading ? new Date(b.latestReading.timestamp).getTime() : 0;
    return bTime - aTime;
  })[0];

  const { history } = await getAthleteHistory(primary.id);
  const { alerts } = await getAlerts({ userId: primary.id, status: "active" });

  return (
    <div className="flex flex-col gap-3">
      {athletes.length > 1 && (
        <div className="flex items-center justify-end px-5 pt-4">
          <Link href="/athletes" className="text-xs font-medium text-brand">
            Lihat semua atlet
          </Link>
        </div>
      )}
      <AthleteDashboard initialAthlete={primary} initialHistory={history} initialAlerts={alerts} />
    </div>
  );
}