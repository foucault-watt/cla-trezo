import { AssociationsLabTabs } from "./_components/associations-lab-tabs";

export default function AssociationsLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Atelier Associations</h1>
        <p className="mt-1 max-w-3xl text-sm text-base-content/70">
          Trois pistes pour la page admin détail d&apos;association
          (/admin/associations/[assoSlug]), avec des données 100% statiques —
          rien n&apos;est lu ni écrit en base ici. Basculez entre Club et
          Association loi 1901, et entre Initialisé / Pas encore, pour
          vérifier que chaque variante reste claire quand la structure n&apos;a
          pas de Solde, ou n&apos;a pas encore de Solde/Subvention.
        </p>
      </div>

      <AssociationsLabTabs />
    </div>
  );
}
