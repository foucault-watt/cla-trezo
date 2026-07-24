import Link from "next/link";
import { NewExpenseReportForm } from "./_components/new-expense-report-form";

export default async function NewExpenseReportPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;

  return (
    <div>
      <Link
        href={`/app/${assoSlug}/notes-de-frais`}
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les Notes de frais
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Nouvelle Note de frais</h1>
      <p className="mt-2 text-base-content/70">
        Créez la Note en Brouillon, puis ajoutez ses Lignes une fois créée.
      </p>

      <div className="card mt-6 max-w-xl border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <NewExpenseReportForm assoSlug={assoSlug} />
        </div>
      </div>
    </div>
  );
}
