import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/nav/back-link";
import {
  grantDocumentKindLabels,
  requireGrantDocumentPreparation,
} from "@/lib/admin/grant-documents";
import { getCampaignStatus } from "@/lib/subventions/status";
import { ConventionPreparationForm } from "./_components/convention-preparation-form";
import { OrdreDeFinancementForm } from "./_components/ordre-de-financement-form";

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignId: string; assoId: string }>;
}): Promise<Metadata> {
  const { campaignId, assoId } = await params;
  const preparation = await requireGrantDocumentPreparation(campaignId, assoId);
  const kindLabel = preparation.kind
    ? grantDocumentKindLabels[preparation.kind]
    : "Document d’octroi";
  return { title: `${kindLabel} — ${preparation.assoName}` };
}

export default async function GrantDocumentPreparationPage({
  params,
}: {
  params: Promise<{ campaignId: string; assoId: string }>;
}) {
  const { campaignId, assoId } = await params;
  const preparation = await requireGrantDocumentPreparation(campaignId, assoId);
  const published =
    getCampaignStatus(preparation.publicationDate) === "PUBLIEE";
  const kindLabel = preparation.kind
    ? grantDocumentKindLabels[preparation.kind]
    : "Document d’octroi";
  const actionLabel = preparation.existingDocument
    ? `Régénérer ${preparation.kind === "CONVENTION" ? "la convention" : "l’ordre de financement"}`
    : `Générer ${preparation.kind === "CONVENTION" ? "la convention" : "l’ordre de financement"}`;

  return (
    <div className="space-y-6">
      <div>
        <BackLink
          href={`/app/admin/subventions/${campaignId}`}
          label={preparation.campaignName}
        />
        <h1 className="mt-3 text-2xl font-semibold">
          {kindLabel} — {preparation.assoName}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-base-content/70">
          Vérifiez les données récupérées automatiquement, complétez les
          informations manquantes, puis générez le document. Il sera stocké et
          téléchargeable par la Structure.
        </p>
      </div>

      {preparation.existingDocument && (
        <div role="alert" className="alert alert-info alert-soft">
          <span>
            Document déjà généré le{" "}
            {dateTimeFormatter.format(preparation.existingDocument.generatedAt)}
            . Une nouvelle génération le remplacera.
          </span>
        </div>
      )}

      {!published && (
        <div role="alert" className="alert alert-warning alert-soft">
          <span>
            Cette campagne n’est pas encore publiée. Le document ne peut être
            généré qu’une fois la date de publication atteinte.
          </span>
        </div>
      )}

      {preparation.kind === "CONVENTION" ? (
        <ConventionPreparationForm
          campaignId={preparation.campaignId}
          assoId={preparation.assoId}
          canGenerate={published}
          label={actionLabel}
          initialData={preparation.data}
        />
      ) : preparation.kind === "ORDRE_DE_FINANCEMENT" ? (
        <OrdreDeFinancementForm
          campaignId={preparation.campaignId}
          assoId={preparation.assoId}
          canGenerate={published}
          label={actionLabel}
          initialData={preparation.data}
        />
      ) : (
        <div role="alert" className="alert alert-error alert-soft">
          <span>
            Le type de cette Structure n’est pas renseigné : impossible de
            savoir s’il faut une Convention de subvention (Association loi 1901)
            ou un Ordre de financement (Club, Commission).{" "}
            <Link
              className="link font-medium"
              href={`/app/admin/associations/${preparation.assoSlug}`}
            >
              Classer la Structure
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
