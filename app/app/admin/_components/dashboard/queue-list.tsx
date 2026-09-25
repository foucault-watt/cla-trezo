import Link from "next/link";
import { CalendarClock, Clock } from "lucide-react";
import { waitingLabel, type DashboardData } from "@/lib/admin/dashboard";
import { formatCents } from "@/lib/money";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

export function QueueList({ data }: { data: DashboardData }) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 shadow-md">
      <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <h2 className="font-semibold">En attente de traitement</h2>
        <span
          className={`badge ${data.queue.length > 0 ? "badge-warning" : "badge-ghost"}`}
        >
          {data.queue.length}
        </span>
      </div>
      <div>
        {data.queue.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-base-content/60">
            Aucune Note de frais en attente.
          </p>
        )}
        {data.queue.map((item, i) => (
          <Link
            key={item.id}
            href={`/app/admin/notes-de-frais/${item.id}`}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
              i % 2 === 1 ? "bg-base-200/60" : ""
            }`}
          >
            <Clock size={16} className="shrink-0 text-base-content/50" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {item.assoName}
              </div>
              <div className="truncate text-xs text-base-content/60">
                {item.title}
              </div>
            </div>
            <div className="shrink-0 text-right text-sm text-base-content/70">
              {formatCents(item.amountCents)}
            </div>
            <span className="badge badge-ghost shrink-0">
              {waitingLabel(item.daysWaiting)}
            </span>
          </Link>
        ))}
      </div>
      {data.campaignInfo && (
        <div className="flex items-center gap-2 border-t border-base-300 px-4 py-3 text-sm text-base-content/70">
          <CalendarClock size={14} className="shrink-0" />
          {data.campaignInfo.kind === "pending" ? (
            <span>
              Campagne en attente de publication —{" "}
              <span className="font-medium text-base-content">
                {data.campaignInfo.name}
              </span>
              ,{" "}
              {data.campaignInfo.publicationDate
                ? `se publiera le ${dateFormatter.format(data.campaignInfo.publicationDate)}`
                : "date non définie"}
            </span>
          ) : (
            <span>
              Dernière campagne publiée —{" "}
              <span className="font-medium text-base-content">
                {data.campaignInfo.name}
              </span>
              , le {dateFormatter.format(data.campaignInfo.publicationDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
