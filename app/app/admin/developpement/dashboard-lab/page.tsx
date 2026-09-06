import { DashboardLabTabs } from "./_components/dashboard-lab-tabs";

export default function DashboardLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-base-content/60">
          Développement
        </p>
        <h1 className="text-3xl font-bold">Atelier Dashboard</h1>
        <p className="mt-2 max-w-3xl text-base-content/70">
          Trois pistes pour enrichir le Dashboard Structure (/app/[assoSlug]),
          avec des données 100% statiques — rien n&apos;est lu ni écrit en base
          ici. Basculez entre Club et Commission/ Association pour vérifier que
          chaque variante reste cohérente quand il n&apos;y a pas de Solde à
          afficher.
        </p>
      </div>

      <DashboardLabTabs />
    </div>
  );
}
