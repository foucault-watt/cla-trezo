"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { TypeDepenseAdminRow } from "@/lib/admin/type-depenses";
import { NewTypeDepenseRow } from "./new-type-depense-row";
import { TypeDepenseRow } from "./type-depense-row";

export function TypeDepensesTable({ types }: { types: TypeDepenseAdminRow[] }) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Libellé</th>
            <th>Utilisation</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {types.length === 0 && !isAdding && (
            <tr>
              <td colSpan={3} className="text-sm text-base-content/70">
                Aucun Type de dépense : les Structures ne peuvent saisir que
                des libellés personnalisés.
              </td>
            </tr>
          )}

          {types.map((type) => (
            <TypeDepenseRow
              key={type.id}
              type={type}
              replacementOptions={types.filter((other) => other.id !== type.id)}
            />
          ))}

          {isAdding ? (
            <NewTypeDepenseRow
              onSaved={() => setIsAdding(false)}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <tr>
              <td colSpan={3} className="p-0">
                <button
                  type="button"
                  className="btn btn-ghost btn-block justify-start rounded-t-none rounded-b-box text-base-content/70"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={16} />
                  Ajouter un Type de dépense
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
