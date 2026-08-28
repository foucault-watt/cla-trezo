import type { AssoStorageOverview } from "@/lib/admin/storage";

export function StorageStatsBar({
  associations,
}: {
  associations: AssoStorageOverview[];
}) {
  const totalSupportingDocuments = associations.reduce(
    (sum, a) => sum + a.supportingDocumentsCount,
    0,
  );
  const totalPdfs = associations.reduce((sum, a) => sum + a.pdfsCount, 0);
  const structuresAvecFichiers = associations.filter(
    (a) => a.reportsWithFilesCount > 0,
  ).length;

  const years = associations.flatMap((a) =>
    a.yearsSpan ? [a.yearsSpan.min, a.yearsSpan.max] : [],
  );
  const periode =
    years.length > 0
      ? `${Math.min(...years)} – ${Math.max(...years)}`
      : "—";

  return (
    <div className="stats stats-vertical mb-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Justificatifs</div>
        <div className="stat-value text-2xl">{totalSupportingDocuments}</div>
      </div>
      <div className="stat">
        <div className="stat-title">PDF générés</div>
        <div className="stat-value text-2xl">{totalPdfs}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Structures avec des fichiers</div>
        <div className="stat-value text-2xl">{structuresAvecFichiers}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Période couverte</div>
        <div className="stat-value text-2xl">{periode}</div>
      </div>
    </div>
  );
}
