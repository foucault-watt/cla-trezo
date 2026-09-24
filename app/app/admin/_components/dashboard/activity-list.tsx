import Link from "next/link";
import { CheckCircle2, FileText, HandCoins, Wallet } from "lucide-react";
import type { ActivityEventType, DashboardData } from "@/lib/admin/dashboard";
import { formatCents } from "@/lib/money";

const activityIcon: Record<ActivityEventType, React.ReactNode> = {
  note_finalisee: <CheckCircle2 size={16} className="text-success" />,
  note_soumise: <FileText size={16} className="text-info" />,
  subvention_creee: <HandCoins size={16} className="text-primary" />,
  mouvement: <Wallet size={16} className="text-secondary" />,
};

export function ActivityList({ data }: { data: DashboardData }) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 shadow-md">
      <div className="border-b border-base-300 px-4 py-3">
        <h2 className="font-semibold">Activité récente</h2>
      </div>
      <div>
        {data.recentActivity.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-base-content/60">
            Aucune activité récente.
          </p>
        )}
        {data.recentActivity.map((event, i) => (
          <Link
            key={event.id}
            href={event.href}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
              i % 2 === 1 ? "bg-base-200/60" : ""
            }`}
          >
            <span className="shrink-0">{activityIcon[event.type]}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {event.assoName}
              </div>
              <div className="truncate text-xs text-base-content/60">
                {event.label}
              </div>
            </div>
            {event.amountCents !== undefined && (
              <div className="shrink-0 text-right text-sm text-base-content/70">
                {formatCents(event.amountCents)}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
