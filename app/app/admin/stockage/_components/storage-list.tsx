import type { AssoStorageOverview } from "@/lib/admin/storage";
import { StorageArchiveButton } from "./storage-archive-button";

export function StorageList({
  associations,
}: {
  associations: AssoStorageOverview[];
}) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      {associations.map((asso, i) => {
        const hasFiles = asso.reportsWithFilesCount > 0;

        return (
          <div
            key={asso.id}
            className={`flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center ${
              i % 2 === 1 ? "bg-base-200/60" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{asso.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
                <span className="badge badge-sm badge-ghost">
                  {asso.supportingDocumentsCount} justificatif(s)
                </span>
                <span className="badge badge-sm badge-ghost">
                  {asso.pdfsCount} PDF
                </span>
                {asso.yearsSpan && (
                  <span>
                    {asso.yearsSpan.min === asso.yearsSpan.max
                      ? asso.yearsSpan.min
                      : `${asso.yearsSpan.min} – ${asso.yearsSpan.max}`}
                  </span>
                )}
              </div>
            </div>

            {hasFiles ? (
              <StorageArchiveButton assoSlug={asso.slug} assoName={asso.name} />
            ) : (
              <span className="shrink-0 text-xs text-base-content/50">
                Aucun fichier
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
