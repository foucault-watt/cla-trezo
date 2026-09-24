import { notFound } from "next/navigation";
import {
  assoStatusBadgeClass,
  assoStatusLabel,
  assoTypeLabel,
} from "@/lib/admin/asso-labels";
import { getAssociationDetail } from "@/lib/admin/associations";
import { AssoDetailTabs } from "./_components/asso-detail-tabs";
import { AssoTypePicker } from "./_components/asso-type-picker";

export default async function AdminAssociationDetailPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;
  const asso = await getAssociationDetail(assoSlug);
  if (!asso) {
    notFound();
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{asso.name}</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {asso.type ? assoTypeLabel[asso.type] : "Type non défini"}
          </p>
        </div>
        <span className={`badge ${assoStatusBadgeClass[asso.status]}`}>
          {assoStatusLabel[asso.status]}
        </span>
      </div>

      {asso.type === null ? (
        <div className="mt-6">
          <div role="alert" className="alert alert-warning alert-soft mb-4">
            <span>
              Le type de cette Asso n&apos;est pas encore défini.
              Choisissez-en un pour débloquer le reste de sa gestion (dont le
              Solde si c&apos;est un Club).
            </span>
          </div>
          <AssoTypePicker
            assoId={asso.id}
            assoSlug={asso.slug}
            current={null}
          />
        </div>
      ) : (
        <>
          <div className="stats stats-vertical mt-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
            <div className="stat">
              <div className="stat-title">Subventions publiées</div>
              <div className="stat-value text-2xl">
                {asso.subventionsPubliees}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Notes de frais en attente</div>
              <div className="stat-value text-2xl">
                {asso.notesDeFraisEnAttente}
              </div>
            </div>
          </div>

          <AssoDetailTabs asso={asso} />

          <div className="collapse-arrow collapse mt-8 border border-base-300 bg-base-100">
            <input type="checkbox" />
            <div className="collapse-title font-medium">
              Réglages : modifier le type de cette Asso
            </div>
            <div className="collapse-content">
              <AssoTypePicker
                assoId={asso.id}
                assoSlug={asso.slug}
                current={asso.type}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
