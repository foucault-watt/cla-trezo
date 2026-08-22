import { listVisibleSubventions } from "@/lib/subventions/visible-subventions";
import { createSubventionAgeDemoData } from "./_components/subventions-demo-data";
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
  const realSubventions = await listVisibleSubventions(assoSlug);
  const requestedDemo = Array.isArray(query.demo) ? query.demo[0] : query.demo;
  const showAgeDemo =
    process.env.NODE_ENV !== "production" && requestedDemo === "ages";
  const subventions = showAgeDemo
    ? [...realSubventions, ...createSubventionAgeDemoData()]
    : realSubventions;

  return <SubventionsLedger subventions={subventions} isDemo={showAgeDemo} />;
}
