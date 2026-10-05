"use client";

import { useActionState } from "react";
import type { TypeDepenseActionState } from "@/lib/admin/type-depense-actions";
import { useToast } from "@/components/ui/toast";

type TypeDepenseAction = (
  prevState: TypeDepenseActionState,
  formData: FormData,
) => Promise<TypeDepenseActionState>;

const initialState: TypeDepenseActionState = { ok: false };

/**
 * `useActionState` qui affiche le message de succès en toast dès le retour
 * de l'action, plutôt que dans un effet : une suppression ou un reclassement
 * fait disparaître la ligne au rafraîchissement, et un effet porté par cette
 * ligne n'aurait jamais l'occasion de s'exécuter.
 */
export function useTypeDepenseAction(action: TypeDepenseAction) {
  const { push: pushToast } = useToast();
  return useActionState(
    async (prevState: TypeDepenseActionState, formData: FormData) => {
      const result = await action(prevState, formData);
      if (result.ok && result.message) {
        pushToast({ type: "success", message: result.message });
      }
      return result;
    },
    initialState,
  );
}
