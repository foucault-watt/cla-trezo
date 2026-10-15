import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/nav/back-link";
import { Stat, StatsBar } from "@/components/ui/stats";
import { getUserActivity } from "@/lib/analytics/stats";
import { auditActionLabel } from "@/lib/audit/labels";
import { formatShortDate } from "@/lib/dates";
import {
  DEVICE_LABELS,
  formatAgo,
  formatDateTime,
  formatDuration,
} from "../../_components/format";

export const metadata: Metadata = {
  title: "Statistiques · Fiche utilisateur",
};

const UUID = /^[0-9a-f-]{36}$/i;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function StatsUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  if (!UUID.test(userId)) notFound();
  const data = await getUserActivity(userId);
  if (!data) notFound();

  const { user, windows } = data;

  return (
    <div>
      <BackLink href="/app/admin/stats/utilisateurs" label="Utilisateurs" />
      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold">
          {user.firstname} {user.lastname}
          {user.isAdmin && (
            <span className="badge badge-outline ml-2 align-middle">Admin</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          {user.username} · compte créé le {formatShortDate(user.createdAt)}
        </p>
      </div>

      <StatsBar className="mb-6">
        <Stat
          title="Dernière activité"
          value={formatAgo(data.lastSeen)}
          desc={formatDateTime(data.lastSeen)}
          valueClassName="text-lg"
        />
        <Stat
          title="Dernière connexion SSO"
          value={formatAgo(data.lastLogin)}
          desc={`${data.loginCount} connexion(s) conservée(s)`}
          valueClassName="text-lg"
        />
        <Stat
          title="Jours actifs"
          value={windows[30].activeDays}
          desc={`7 j : ${windows[7].activeDays} · 90 j : ${windows[90].activeDays}`}
        />
        <Stat
          title="Visites (30 j)"
          value={windows[30].visits}
          desc={`≈ ${formatDuration(windows[30].activeMs)} d'utilisation`}
        />
        <Stat
          title="Pages vues (30 j)"
          value={windows[30].pageViews}
          desc={`7 j : ${windows[7].pageViews} · 90 j : ${windows[90].pageViews}`}
        />
      </StatsBar>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Assos et rôles">
          {user.memberships.length === 0 ? (
            <p className="text-sm text-base-content/60">
              Aucun rôle dans une Structure.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {user.memberships.map((membership) => (
                <li key={membership.asso.id} className="flex justify-between gap-3">
                  <Link
                    href={`/app/admin/associations/${membership.asso.slug}`}
                    className="link link-hover"
                  >
                    {membership.asso.name}
                  </Link>
                  <span className="text-base-content/70">
                    {membership.role} depuis le{" "}
                    {formatShortDate(membership.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Actions (depuis toujours)">
          {data.actionCounts.length === 0 ? (
            <p className="text-sm text-base-content/60">Aucune action enregistrée.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.actionCounts.map((row) => (
                <li key={row.action} className="flex justify-between gap-3">
                  <span>{auditActionLabel(row.action)}</span>
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Pages les plus vues (90 j)">
          {data.routes.length === 0 ? (
            <p className="text-sm text-base-content/60">Aucune page vue.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.routes.map((row) => (
                <li key={row.key} className="flex justify-between gap-3">
                  <span className="font-mono text-xs break-all">{row.key}</span>
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Appareils (90 j)">
          {data.devices.length === 0 ? (
            <p className="text-sm text-base-content/60">Aucune page vue.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.devices.map((row) => (
                <li key={row.key} className="flex justify-between gap-3">
                  <span>{DEVICE_LABELS[row.key] ?? row.key}</span>
                  <span className="tabular-nums">{row.count} page(s)</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="lg:col-span-2">
          <Section title="Activité récente">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-base-content/60">Aucune activité.</p>
            ) : (
              <ul className="divide-y divide-base-200 text-sm">
                {data.timeline.map((entry, index) => (
                  <li
                    key={`${entry.kind}-${entry.at.getTime()}-${index}`}
                    className="flex flex-wrap items-baseline gap-x-3 py-1.5"
                  >
                    <span className="w-40 shrink-0 text-xs text-base-content/60 tabular-nums">
                      {formatDateTime(entry.at)}
                    </span>
                    {entry.kind === "page" && (
                      <span>
                        <span className="badge badge-ghost badge-sm mr-2">Page</span>
                        <span className="font-mono text-xs break-all">{entry.path}</span>
                        <span className="ml-2 text-xs text-base-content/50">
                          {DEVICE_LABELS[entry.device] ?? entry.device}
                        </span>
                      </span>
                    )}
                    {entry.kind === "login" && (
                      <span>
                        <span className="badge badge-info badge-sm mr-2">Connexion</span>
                        via le SSO CLA
                      </span>
                    )}
                    {entry.kind === "action" && (
                      <span>
                        <span className="badge badge-primary badge-sm mr-2">Action</span>
                        {auditActionLabel(entry.action)}
                        {entry.assoName && (
                          <span className="text-base-content/70"> · {entry.assoName}</span>
                        )}
                        {entry.fromAdminSpace && (
                          <span className="text-base-content/50"> · espace Admin</span>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <p className="mt-6 text-sm">
        <Link
          href={`/app/admin/stats/audit?actor=${user.id}`}
          className="link link-hover"
        >
          Voir tout son journal d&apos;audit
        </Link>
      </p>
    </div>
  );
}
