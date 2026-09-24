import type { Metadata } from "next";
import { listAssoStorageOverview } from "@/lib/admin/storage";
import { StorageList } from "./_components/storage-list";
import { StorageStatsBar } from "./_components/storage-stats-bar";

export const metadata: Metadata = {
  title: "Stockage",
};

export default async function StoragePage() {
  const associations = await listAssoStorageOverview();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Stockage</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Justificatifs et PDF générés de chaque Asso, classés par année.
        </p>
      </div>

      <StorageStatsBar associations={associations} />

      <StorageList associations={associations} />
    </div>
  );
}
