import type { CustomLabelUsage } from "@/lib/admin/type-depense-labels";
import { CustomLabelRow } from "./custom-label-row";

export function CustomLabelsTable({
  customLabels,
  types,
}: {
  customLabels: CustomLabelUsage[];
  types: { id: string; label: string }[];
}) {
  if (customLabels.length === 0) {
    return (
      <div className="rounded-field bg-base-200 p-5">
        <p className="font-semibold">Aucun libellé personnalisé</p>
        <p className="mt-1 text-sm text-base-content/70">
          Tous les Remboursements utilisent un Type de la liste.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Libellé saisi</th>
            <th>Utilisation</th>
            <th>Structures</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customLabels.map((customLabel) => (
            <CustomLabelRow
              key={customLabel.label}
              customLabel={customLabel}
              types={types}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
