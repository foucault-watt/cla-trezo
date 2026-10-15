import type { Metadata } from "next";
import Link from "next/link";
import { listUserActivity, USERS_PAGE_SIZE } from "@/lib/analytics/stats";
import {
  formatAgo,
  formatDateTime,
  includeAdminsParam,
  pageParam,
  stringParam,
} from "../_components/format";
import { StatsHeader } from "../_components/stats-header";

export const metadata: Metadata = {
  title: "Statistiques · Utilisateurs",
};

export default async function StatsUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const includeAdmins = includeAdminsParam(params.admins);
  const query = stringParam(params.q);
  const page = pageParam(params.page);
  const { rows, total } = await listUserActivity({
    includeAdmins,
    query,
    page,
  });
  const pageCount = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    if (includeAdmins) search.set("admins", "1");
    if (query) search.set("q", query);
    if (target > 1) search.set("page", String(target));
    const value = search.toString();
    return `/app/admin/stats/utilisateurs${value ? `?${value}` : ""}`;
  };

  return (
    <div>
      <StatsHeader
        active="/app/admin/stats/utilisateurs"
        includeAdmins={includeAdmins}
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/app/admin/stats/utilisateurs">
        {includeAdmins && <input type="hidden" name="admins" value="1" />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Nom, prénom ou identifiant"
          className="input input-sm w-full sm:w-72"
        />
        <button type="submit" className="btn btn-sm">
          Rechercher
        </button>
      </form>

      <p className="mb-2 text-sm text-base-content/70">
        {total} utilisateur(s), du plus récemment actif au moins récent.
      </p>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Assos</th>
              <th>Dernière activité</th>
              <th>Dernière connexion SSO</th>
              <th className="text-right">Jours actifs (30 j)</th>
              <th className="text-right">Pages (30 j)</th>
              <th className="text-right">Actions (30 j)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-base-200">
                <td>
                  <Link
                    href={`/app/admin/stats/utilisateurs/${row.id}`}
                    className="link link-hover font-medium"
                  >
                    {row.firstname} {row.lastname}
                  </Link>
                  <div className="text-xs text-base-content/60">
                    {row.username}
                    {row.isAdmin && (
                      <span className="badge badge-xs badge-outline ml-2">Admin</span>
                    )}
                  </div>
                </td>
                <td className="max-w-56 text-xs text-base-content/70">
                  {row.assos ?? "—"}
                </td>
                <td title={formatDateTime(row.lastSeen)}>
                  {formatAgo(row.lastSeen)}
                </td>
                <td title={formatDateTime(row.lastLogin)}>
                  {formatAgo(row.lastLogin)}
                </td>
                <td className="text-right tabular-nums">{row.days30}</td>
                <td className="text-right tabular-nums">{row.views30}</td>
                <td className="text-right tabular-nums">{row.actions30}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-base-content/60">
                  Aucun utilisateur ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="join mt-4">
          {page > 1 && (
            <Link href={hrefFor(page - 1)} className="join-item btn btn-sm">
              Précédent
            </Link>
          )}
          <span className="join-item btn btn-sm btn-disabled">
            Page {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link href={hrefFor(page + 1)} className="join-item btn btn-sm">
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
