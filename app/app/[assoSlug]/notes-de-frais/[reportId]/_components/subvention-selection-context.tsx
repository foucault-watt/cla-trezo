"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SubventionTarget = {
  selectedId: string;
  onSelect: (subventionId: string) => void;
};

type ActionsValue = {
  registerTarget: (consumerId: string, target: SubventionTarget) => void;
  clearTarget: (consumerId: string) => void;
};

const SubventionActionsContext = createContext<ActionsValue | null>(null);
const SubventionTargetContext = createContext<SubventionTarget | null>(null);

/**
 * Permet à un formulaire (Ajouter une Ligne, édition inline) de déléguer le
 * choix de la Subvention aux cartes affichées dans FundingSourcesPanel : le
 * formulaire "actif" (celui dont la source de financement est Subvention)
 * s'enregistre ici, et FundingSourcesPanel lit cette cible pour savoir quelle
 * carte est cliquable / sélectionnée.
 *
 * Deux contextes séparés (actions stables vs. cible qui change) pour que les
 * formulaires consommateurs ne se re-rendent pas à chaque changement de
 * sélection — seul FundingSourcesPanel a besoin de la cible elle-même.
 */
export function SubventionSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [entry, setEntry] = useState<{
    consumerId: string;
    target: SubventionTarget;
  } | null>(null);

  const registerTarget = useCallback(
    (consumerId: string, target: SubventionTarget) => {
      setEntry({ consumerId, target });
    },
    [],
  );
  const clearTarget = useCallback((consumerId: string) => {
    setEntry((current) =>
      current?.consumerId === consumerId ? null : current,
    );
  }, []);

  const actions = useMemo(
    () => ({ registerTarget, clearTarget }),
    [registerTarget, clearTarget],
  );

  return (
    <SubventionActionsContext.Provider value={actions}>
      <SubventionTargetContext.Provider value={entry?.target ?? null}>
        {children}
      </SubventionTargetContext.Provider>
    </SubventionActionsContext.Provider>
  );
}

/** Cible active à afficher côté FundingSourcesPanel, ou null si aucun formulaire n'attend un choix de Subvention. */
export function useSubventionSelectionTarget() {
  return useContext(SubventionTargetContext);
}

function useSubventionSelectionActions() {
  const ctx = useContext(SubventionActionsContext);
  if (!ctx) {
    throw new Error(
      "useSubventionSelectionConsumer doit être utilisé dans un SubventionSelectionProvider.",
    );
  }
  return ctx;
}

/** À appeler depuis un formulaire qui propose la source de financement Subvention. */
export function useSubventionSelectionConsumer({
  active,
  selectedId,
  onSelect,
}: {
  active: boolean;
  selectedId: string;
  onSelect: (subventionId: string) => void;
}) {
  const { registerTarget, clearTarget } = useSubventionSelectionActions();
  const consumerId = useId();

  useEffect(() => {
    if (!active) {
      clearTarget(consumerId);
      return;
    }
    registerTarget(consumerId, { selectedId, onSelect });
    return () => clearTarget(consumerId);
    // onSelect ne capture que le setter d'état (stable) : l'omettre des
    // dépendances évite de ré-enregistrer la cible à chaque frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, selectedId, consumerId, registerTarget, clearTarget]);
}
