import type { Metadata } from "next";
import { getTypeDepensesAdminView } from "@/lib/admin/type-depenses";
import { CustomLabelsTable } from "./_components/custom-labels-table";
import { TypeDepensesTable } from "./_components/type-depenses-table";

export const metadata: Metadata = {
  title: "Types de dépense",
};

export default async function AdminTypeDepensesPage() {
  const { types, customLabels } = await getTypeDepensesAdminView();
  const typeOptions = types.map((type) => ({ id: type.id, label: type.label }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Types de dépense</h1>
        <p className="mt-1 max-w-3xl text-sm text-base-content/70">
          Liste proposée aux Structures pour classer chaque Remboursement.
          Renommer, supprimer ou reclasser s&apos;applique à tous les
          Remboursements concernés, y compris dans les Notes de frais déjà
          validées — les PDF finaux déjà générés ne changent pas.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Types proposés</h2>
        <TypeDepensesTable types={types} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Libellés personnalisés</h2>
          <p className="mt-1 max-w-3xl text-sm text-base-content/70">
            Saisis par les Structures via « Autre (à préciser) » quand aucun
            Type ne convenait. Renommez-les pour harmoniser l&apos;orthographe,
            ou imposez un Type existant à la place.
          </p>
        </div>
        <CustomLabelsTable customLabels={customLabels} types={typeOptions} />
      </section>
    </div>
  );
}
