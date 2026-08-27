"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SubventionRow } from "./subvention-row";
import { NewSubventionRow } from "./new-subvention-row";

export function SubventionsTable({
  campaignId,
  subventions,
  assos,
}: {
  campaignId: string;
  subventions: {
    id: string;
    assoName: string;
    reason: string;
    amountCents: number;
    commentary: string | null;
  }[];
  assos: { id: string; name: string }[];
}) {
  const [isAdding, setIsAdding] = useState(false);

  if (subventions.length === 0 && !isAdding) {
    return (
      <div className="flex flex-col gap-4 rounded-field bg-base-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Aucune Subvention pour l&apos;instant</p>
          <p className="mt-1 text-sm text-base-content/70">
            Ajoutez la première Subvention accordée dans cette campagne.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={() => setIsAdding(true)}
        >
          <Plus size={16} />
          Ajouter une Subvention
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-box border border-base-300 bg-base-100">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Asso</th>
            <th>Raison</th>
            <th>Montant</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {subventions.map((subvention) => (
            <SubventionRow
              key={subvention.id}
              campaignId={campaignId}
              subvention={subvention}
            />
          ))}

          {isAdding && (
            <NewSubventionRow
              campaignId={campaignId}
              assos={assos}
              onSaved={() => setIsAdding(false)}
              onCancel={() => setIsAdding(false)}
            />
          )}

          {!isAdding && (
            <tr>
              <td colSpan={4} className="p-0">
                <button
                  type="button"
                  className="btn btn-ghost btn-block justify-start rounded-t-none rounded-b-box text-base-content/70"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={16} />
                  Ajouter une Subvention
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
