import { getDashboardData } from "@/lib/admin/dashboard";
import { ActivityList } from "./_components/dashboard/activity-list";
import { QueueList } from "./_components/dashboard/queue-list";
import { StatsBar } from "./_components/dashboard/stats-bar";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Vue d&apos;ensemble de l&apos;activité de CLA.
        </p>
      </div>

      <StatsBar data={data} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QueueList data={data} />
        <ActivityList data={data} />
      </div>
    </div>
  );
}
