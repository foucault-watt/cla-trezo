import { StatsBar } from "./_components/stats-bar";
import { ViewToggle } from "./_components/view-toggle";
import { ListView } from "./_components/list-view";
import { GridView } from "./_components/grid-view";

export default async function AssociationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const current = view === "grid" ? "grid" : "list";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Associations</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Vue d&apos;ensemble des associations et de leurs soldes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle current={current} />
          <button className="btn">Nouvelle association</button>
        </div>
      </div>

      <StatsBar />

      {current === "list" ? <ListView /> : <GridView />}
    </div>
  );
}
