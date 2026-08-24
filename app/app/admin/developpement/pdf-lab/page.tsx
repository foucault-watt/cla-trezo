import { PdfLabTabs } from "./_components/pdf-lab-tabs";
import { fixture as subsidyConventionFixture } from "@/pdf-lab/templates/convention/fixture";
import { fixture as expenseReportFixture } from "@/pdf-lab/templates/ndf-fn-sb/fixture";
import { fixture as expenseBalanceFixture } from "@/pdf-lab/templates/ndf-solde/fixture";

export default function PdfLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-base-content/60">
          Développement
        </p>
        <h1 className="text-3xl font-bold">Atelier PDF</h1>
        <p className="mt-2 max-w-3xl text-base-content/70">
          Modifiez les données de démonstration des notes de frais ou des
          conventions de subvention, ajoutez les lignes nécessaires et
          téléchargez le rendu React PDF. Les informations saisies ici ne sont
          pas enregistrées.
        </p>
      </div>

      <PdfLabTabs
        expenseReportData={expenseReportFixture}
        expenseBalanceData={expenseBalanceFixture}
        subsidyConventionData={subsidyConventionFixture}
      />
    </div>
  );
}
