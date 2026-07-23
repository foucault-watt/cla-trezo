import { ViewToggle } from "@/components/nav/view-toggle";
import { listVisibleSubventions } from "@/lib/subventions/visible-subventions";
import { ListView } from "./_components/list-view";
import { GridView } from "./_components/grid-view";

export default async function SubventionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ assoSlug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { assoSlug } = await params;
  const { view } = await searchParams;
  const current = view === "grid" ? "grid" : "list";
  const subventions = await listVisibleSubventions(assoSlug);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subventions</h1>
          <p className="mt-2 text-base-content/70">
            Subventions accordées à l&apos;association.
          </p>
        </div>
        {subventions.length > 0 && <ViewToggle current={current} />}
      </div>

      {subventions.length === 0 ? (
        <p className="mt-6 text-base-content/70">
          Aucune Subvention publiée pour l&apos;instant.
        </p>
      ) : current === "list" ? (
        <div className="mt-6">
          <ListView subventions={subventions} />
        </div>
      ) : (
        <div className="mt-6">
          <GridView subventions={subventions} />
        </div>
      )}
    </div>
  );
}
