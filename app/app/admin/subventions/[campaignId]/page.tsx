import { notFound } from "next/navigation";
import Link from "next/link";
import { FileDown } from "lucide-react";
import {
  getSubventionCampaign,
  listAssosForSelect,
} from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import {
  campaignStatusLabel,
  campaignStatusBadgeClass,
} from "@/lib/subventions/status";
import { formatCents } from "@/lib/money";
import { EditCampaignForm } from "./_components/edit-campaign-form";
import { DeleteCampaignButton } from "./_components/delete-campaign-button";
import { SubventionsTable } from "./_components/subventions-table";

export default async function AdminSubventionCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const [campaign, assos] = await Promise.all([
    getSubventionCampaign(campaignId),
    listAssosForSelect(),
  ]);
  if (!campaign) {
    notFound();
  }

  const conventionGroups = Array.from(
    campaign.subventions
      .reduce(
        (groups, subvention) => {
          const current = groups.get(subvention.assoId);
          groups.set(subvention.assoId, {
            assoId: subvention.assoId,
            assoName: subvention.assoName,
            linesCount: (current?.linesCount ?? 0) + 1,
            totalAmountCents:
              (current?.totalAmountCents ?? 0) + subvention.amountCents,
          });
          return groups;
        },
        new Map<
          string,
          {
            assoId: string;
            assoName: string;
            linesCount: number;
            totalAmountCents: number;
          }
        >(),
      )
      .values(),
  );

  return (
    <div>
      <Link
        href="/app/admin/subventions"
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les campagnes
      </Link>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {subventionTypeLabel[campaign.type]} {campaign.name}
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            {campaign.date.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`badge ${campaignStatusBadgeClass[campaign.status]}`}
          >
            {campaignStatusLabel[campaign.status]}
          </span>
          <DeleteCampaignButton
            campaignId={campaign.id}
            name={`${subventionTypeLabel[campaign.type]} ${campaign.name}`}
          />
        </div>
      </div>

      <div className="stats stats-vertical mt-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Subventions</div>
          <div className="stat-value text-2xl">{campaign.subventionsCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Montant total</div>
          <div className="stat-value text-2xl">
            {formatCents(campaign.totalAmountCents)}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SubventionsTable
          campaignId={campaign.id}
          subventions={campaign.subventions}
          assos={assos}
        />
      </div>

      <div className="card card-border mt-8 bg-base-100">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title">Conventions de subvention</h2>
            <p className="text-sm text-base-content/60">
              Une convention regroupe toutes les lignes accordées à une même
              association dans cette campagne.
            </p>
          </div>

          {conventionGroups.length === 0 ? (
            <p className="text-sm text-base-content/70">
              Ajoutez une ligne de subvention pour préparer une convention.
            </p>
          ) : (
            <ul className="list rounded-box border border-base-300">
              {conventionGroups.map((group) => (
                <li className="list-row items-center" key={group.assoId}>
                  <FileDown size={20} className="text-base-content/60" />
                  <div>
                    <p className="font-medium">{group.assoName}</p>
                    <p className="text-xs text-base-content/60">
                      {group.linesCount} ligne
                      {group.linesCount > 1 ? "s" : ""} ·{" "}
                      {formatCents(group.totalAmountCents)}
                    </p>
                  </div>
                  <Link
                    href={`/app/admin/subventions/${campaign.id}/conventions/${group.assoId}`}
                    className="btn btn-sm"
                  >
                    Préparer le PDF
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="collapse-arrow collapse mt-8 border border-base-300 bg-base-100">
        <input type="checkbox" />
        <div className="collapse-title font-medium">
          Réglages : modifier la campagne
        </div>
        <div className="collapse-content">
          <EditCampaignForm
            campaignId={campaign.id}
            type={campaign.type}
            name={campaign.name}
            date={campaign.date}
            publicationDate={campaign.publicationDate}
          />
        </div>
      </div>
    </div>
  );
}
