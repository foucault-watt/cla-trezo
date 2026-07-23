import Link from "next/link";
import { NewCampaignForm } from "./_components/new-campaign-form";

export default function NewSubventionCampaignPage() {
  return (
    <div>
      <Link
        href="/app/admin/subventions"
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les campagnes
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Nouvelle campagne</h1>
      <p className="mt-2 text-base-content/70">
        Une campagne regroupe les Subventions accordées aux Structures pour un
        même type et une même période.
      </p>

      <div className="card mt-6 max-w-xl border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <NewCampaignForm />
        </div>
      </div>
    </div>
  );
}
