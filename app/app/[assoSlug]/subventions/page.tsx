import { listStructureGrantDocuments } from "@/lib/subventions/grant-documents";
import { listVisibleSubventions } from "@/lib/subventions/visible-subventions";
import { createSubventionAgeDemoData } from "./_components/subventions-demo-data";
import { GrantDocumentsList } from "./_components/grant-documents-list";
import { SubventionsLedger } from "./_components/subventions-ledger";

export default async function SubventionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ assoSlug: string }>;
  searchParams: Promise<{
    demo?: string | string[];
  }>;
}) {
  const [{ assoSlug }, query] = await Promise.all([params, searchParams]);
  const [realSubventions, grantDocuments] = await Promise.all([
    listVisibleSubventions(assoSlug),
    listStructureGrantDocuments(assoSlug),
  ]);
  const requestedDemo = Array.isArray(query.demo) ? query.demo[0] : query.demo;
  const showAgeDemo =
    process.env.NODE_ENV !== "production" && requestedDemo === "ages";
  const subventions = showAgeDemo
    ? [...realSubventions, ...createSubventionAgeDemoData()]
    : realSubventions;

  return (
    <div className="space-y-10">
      <SubventionsLedger subventions={subventions} isDemo={showAgeDemo} />
      <GrantDocumentsList assoSlug={assoSlug} documents={grantDocuments} />
    </div>
  );
}
