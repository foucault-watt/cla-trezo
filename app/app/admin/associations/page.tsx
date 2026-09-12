import { listAssociations } from "@/lib/admin/associations";
import { StatsBar } from "./_components/stats-bar";
import { AssociationsList } from "./_components/associations-list";

export default async function AssociationsPage() {
  const associations = await listAssociations();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Associations</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Vue d&apos;ensemble des associations et de leurs soldes.
        </p>
      </div>

      <StatsBar associations={associations} />

      <AssociationsList associations={associations} />
    </div>
  );
}
