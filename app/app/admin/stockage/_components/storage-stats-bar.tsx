import type { AssoStorageOverview } from "@/lib/admin/storage";
import { Stat, StatsBar } from "@/components/ui/stats";

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
    <StatsBar className="mb-6">
      <Stat title="Justificatifs" value={totalSupportingDocuments} />
      <Stat title="PDF générés" value={totalPdfs} />
      <Stat title="Structures avec des fichiers" value={structuresAvecFichiers} />
      <Stat title="Période couverte" value={periode} />
    </StatsBar>
  );
}
