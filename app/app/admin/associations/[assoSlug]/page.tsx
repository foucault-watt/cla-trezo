import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/nav/back-link";
import { Stat, StatsBar } from "@/components/ui/stats";
import {
  assoStatusBadgeClass,
  assoStatusLabel,
  assoTypeDisplayLabel,
} from "@/lib/admin/asso-labels";
import { getAssociationDetail } from "@/lib/admin/associations";
import { AssoDetailTabs } from "./_components/asso-detail-tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}): Promise<Metadata> {
  const { assoSlug } = await params;
  const asso = await getAssociationDetail(assoSlug);
  return { title: asso?.name ?? "Asso introuvable" };
}

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
      <BackLink href="/app/admin/associations" label="Toutes les Assos" />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{asso.name}</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {assoTypeDisplayLabel(asso.type)}
          </p>
        </div>
        <span className={`badge ${assoStatusBadgeClass[asso.status]}`}>
          {assoStatusLabel[asso.status]}
        </span>
      </div>

      <StatsBar className="mt-6">
        <Stat title="Subventions publiées" value={asso.subventionsPubliees} />
        <Stat
          title="Notes de frais en attente"
          value={asso.notesDeFraisEnAttente}
        />
      </StatsBar>

      <AssoDetailTabs asso={asso} />
    </div>
  );
}
