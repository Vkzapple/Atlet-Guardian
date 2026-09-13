import { getAthlete, getAthleteHistory, getAlerts } from "@/lib/api";
import AthleteDashboard from "@/components/AthleteDashboard";

export const dynamic = "force-dynamic";

export default async function AthleteDetailPage({ params }: { params: { id: string } }) {
  const [{ athlete }, { history }, { alerts }] = await Promise.all([
    getAthlete(params.id),
    getAthleteHistory(params.id),
    getAlerts({ userId: params.id, status: "active" })
  ]);

  return <AthleteDashboard initialAthlete={athlete} initialHistory={history} initialAlerts={alerts} />;
}