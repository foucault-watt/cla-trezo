import { listAssoStorageOverview } from "@/lib/admin/storage";
import { StorageList } from "./_components/storage-list";
import { StorageStatsBar } from "./_components/storage-stats-bar";

export default async function StoragePage() {
  const associations = await listAssoStorageOverview();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Stockage</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Justificatifs et PDF générés, par Structure. Les fichiers sont
          rangés sur le disque par Structure puis par année, pour rester
          navigables même hors de l&apos;application.
        </p>
      </div>

      <StorageStatsBar associations={associations} />

      <StorageList associations={associations} />
    </div>
  );
}
