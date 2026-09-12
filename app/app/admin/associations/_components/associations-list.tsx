import type { AssoOverview } from "@/lib/admin/associations";
import { AssociationRow } from "./association-row";

export function AssociationsList({
  associations,
}: {
  associations: AssoOverview[];
}) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      {associations.map((asso, i) => (
        <AssociationRow key={asso.id} asso={asso} striped={i % 2 === 1} />
      ))}
    </div>
  );
}
