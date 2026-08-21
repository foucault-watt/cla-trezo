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

  return (
    <div className="rounded-box border border-base-300 bg-base-100 shadow-md">
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
          {subventions.length === 0 && !isAdding ? (
            <tr>
              <td colSpan={4} className="text-base-content/70">
                Aucune Subvention pour l&apos;instant.
              </td>
            </tr>
          ) : (
            subventions.map((subvention) => (
              <SubventionRow
                key={subvention.id}
                campaignId={campaignId}
                subvention={subvention}
              />
            ))
          )}

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
                  className="btn btn-ghost btn-block justify-start rounded-none text-base-content/70"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={16} />
                  Nouvelle ligne
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
