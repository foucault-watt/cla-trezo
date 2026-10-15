import type { Metadata } from "next";
import Link from "next/link";
import { AUDIT_PAGE_SIZE, listAuditLog } from "@/lib/analytics/stats";
import { auditActionLabel } from "@/lib/audit/labels";
import { formatDateTime, pageParam, stringParam } from "../_components/format";
import { StatsHeader } from "../_components/stats-header";

export const metadata: Metadata = {
  title: "Statistiques · Journal d'audit",
};

const UUID = /^[0-9a-f-]{36}$/i;

function uuidParam(value: string | string[] | undefined) {
  const text = stringParam(value);
  return UUID.test(text) ? text : undefined;
}

export default async function StatsAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const actorId = uuidParam(params.actor);
  const assoId = uuidParam(params.asso);
  const action = stringParam(params.action) || undefined;
  const page = pageParam(params.page);

  const { entries, total, actions } = await listAuditLog({
    actorId,
    assoId,
    action,
    page,
  });
  const pageCount = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    if (actorId) search.set("actor", actorId);
    if (assoId) search.set("asso", assoId);
    if (action) search.set("action", action);
    if (target > 1) search.set("page", String(target));
    const value = search.toString();
    return `/app/admin/stats/audit${value ? `?${value}` : ""}`;
  };

  return (
    <div>
      <StatsHeader
        active="/app/admin/stats/audit"
        includeAdmins={false}
        showAdminToggle={false}
      />

      <form
        className="mb-4 flex flex-wrap items-center gap-2"
        action="/app/admin/stats/audit"
      >
        {actorId && <input type="hidden" name="actor" value={actorId} />}
        {assoId && <input type="hidden" name="asso" value={assoId} />}
        <select
          name="action"
          defaultValue={action ?? ""}
          className="select select-sm w-full sm:w-80"
        >
          <option value="">Toutes les actions</option>
          {actions.map((value) => (
            <option key={value} value={value}>
              {auditActionLabel(value)}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-sm">
          Filtrer
        </button>
        {(actorId || assoId || action) && (
          <Link href="/app/admin/stats/audit" className="btn btn-ghost btn-sm">
            Retirer les filtres
          </Link>
        )}
      </form>

      <p className="mb-2 text-sm text-base-content/70">
        {total} écriture(s) enregistrée(s). Une ligne par écriture en base :
        une seule action peut en produire plusieurs.
      </p>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Auteur</th>
              <th>Action</th>
              <th>Asso</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const details = entry.details as {
                fields?: string[];
                count?: number;
              } | null;
              return (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-xs tabular-nums">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td>
                    <Link
                      href={`/app/admin/stats/audit?actor=${entry.actorId}`}
                      className="link link-hover"
                    >
                      {entry.actorName ?? "Utilisateur inconnu"}
                    </Link>
                    <div className="text-xs text-base-content/50">
                      {entry.fromAdminSpace
                        ? "espace Admin"
                        : entry.actorIsAdmin
                          ? "Admin, espace Structure"
                          : "espace Structure"}
                    </div>
                  </td>
                  <td>
                    {auditActionLabel(entry.action)}
                    {entry.entityId && (
                      <div className="font-mono text-xs text-base-content/50">
                        {entry.entityId}
                      </div>
                    )}
                  </td>
                  <td>
                    {entry.assoId ? (
                      <Link
                        href={`/app/admin/stats/audit?asso=${entry.assoId}`}
                        className="link link-hover"
                      >
                        {entry.assoName ?? "Asso inconnue"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-xs text-base-content/70">
                    {details?.fields && <div>{details.fields.join(", ")}</div>}
                    {details?.count !== undefined && (
                      <div>{details.count} ligne(s)</div>
                    )}
                    {entry.path && (
                      <div className="font-mono text-base-content/50 break-all">
                        {entry.path}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-base-content/60">
                  Aucune écriture enregistrée.
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
