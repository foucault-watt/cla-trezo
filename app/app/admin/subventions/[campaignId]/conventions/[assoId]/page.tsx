import Link from "next/link";
import { requireConventionPreparation } from "@/lib/admin/subsidy-convention";
import { ConventionPreparationForm } from "./_components/convention-preparation-form";

export default async function ConventionPreparationPage({
  params,
}: {
  params: Promise<{ campaignId: string; assoId: string }>;
}) {
  const { campaignId, assoId } = await params;
  const preparation = await requireConventionPreparation(campaignId, assoId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/admin/subventions/${campaignId}`}
          className="link link-hover text-sm text-base-content/70"
        >
          ← Retour à la campagne
        </Link>
        <p className="mt-4 text-sm font-medium text-base-content/60">
          {preparation.campaignName}
        </p>
        <h1 className="text-3xl font-bold">
          Convention — {preparation.assoName}
        </h1>
        <p className="mt-2 max-w-3xl text-base-content/70">
          Vérifiez les données récupérées automatiquement, complétez les
          informations manquantes, puis téléchargez la convention.
        </p>
      </div>

      <ConventionPreparationForm
        campaignId={preparation.campaignId}
        assoId={preparation.assoId}
        publicationDateMissing={!preparation.publicationDate}
        initialData={preparation.data}
      />
    </div>
  );
}
