import type { Metadata } from "next";
import { listAssociations } from "@/lib/admin/associations";
import { StatsBar } from "./_components/stats-bar";
import { AssociationsList } from "./_components/associations-list";

export const metadata: Metadata = {
  title: "Assos",
};

export default async function AssociationsPage() {
  const associations = await listAssociations();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Assos</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Vue d&apos;ensemble des Assos et de leurs Soldes.
        </p>
      </div>

      <StatsBar associations={associations} />

      <AssociationsList associations={associations} />
    </div>
  );
}
