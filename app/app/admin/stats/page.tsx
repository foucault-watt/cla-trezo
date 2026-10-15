import type { Metadata } from "next";
import { Stat, StatsBar } from "@/components/ui/stats";
import { getUsageOverview } from "@/lib/analytics/stats";
import { auditActionLabel } from "@/lib/audit/labels";
import {
  DEVICE_LABELS,
  formatDayKey,
  includeAdminsParam,
} from "./_components/format";
import { StatsHeader } from "./_components/stats-header";

export const metadata: Metadata = {
  title: "Statistiques",
};

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

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

function Empty() {
  return (
    <p className="text-sm text-base-content/60">Aucune donnée sur la période.</p>
  );
}

export default async function StatsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const includeAdmins = includeAdminsParam((await searchParams).admins);
  const data = await getUsageOverview({ includeAdmins });
  const maxDailyUsers = Math.max(1, ...data.days.map((day) => day.users));

  return (
    <div>
      <StatsHeader active="/app/admin/stats" includeAdmins={includeAdmins} />

      <StatsBar className="mb-6">
        <Stat title="Actifs aujourd'hui" value={data.activeUsers.d1} />
        <Stat title="Actifs sur 7 jours" value={data.activeUsers.d7} />
        <Stat title="Actifs sur 30 jours" value={data.activeUsers.d30} />
        <Stat title="Actifs sur 90 jours" value={data.activeUsers.d90} />
        <Stat title="Pages vues (30 j)" value={data.pageViews30} />
      </StatsBar>

      <StatsBar className="mb-6">
        <Stat title="Membres d'une Asso" value={data.adoption.members} />
        <Stat
          title="Actifs (30 j)"
          value={data.adoption.active30}
          desc="ont ouvert Trézo ce mois-ci"
        />
        <Stat
          title="Inactifs depuis 90 j"
          value={data.adoption.dormant}
          desc="déjà venus, plus revenus"
        />
        <Stat
          title="Jamais venus"
          value={data.adoption.neverSeen}
          desc="ni connexion ni page vue"
        />
      </StatsBar>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Section title="Utilisateurs actifs par jour (30 derniers jours)">
            <div className="flex h-40 items-end gap-1">
              {data.days.map((day) => (
                <div
                  key={day.day}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                  title={`${formatDayKey(day.day)} : ${day.users} utilisateur(s), ${day.views} page(s)`}
                >
                  <div
                    className="rounded-t bg-primary/70 group-hover:bg-primary"
                    style={{
                      height: `${(day.users / maxDailyUsers) * 100}%`,
                      minHeight: day.users > 0 ? 2 : 0,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-base-content/60">
              <span>{formatDayKey(data.days[0].day)}</span>
              <span>{formatDayKey(data.days[data.days.length - 1].day)}</span>
            </div>
          </Section>
        </div>

        <Section title="Fonctionnalités utilisées (30 j)">
          {data.features.length === 0 ? (
            <Empty />
          ) : (
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Action</th>
                  <th className="text-right">Fois</th>
                  <th className="text-right">Personnes</th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((row) => (
                  <tr key={row.action}>
                    <td>{auditActionLabel(row.action)}</td>
                    <td className="text-right tabular-nums">{row.count}</td>
                    <td className="text-right tabular-nums">{row.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Pages les plus vues (30 j)">
          {data.routes.length === 0 ? (
            <Empty />
          ) : (
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Page</th>
                  <th className="text-right">Vues</th>
                  <th className="text-right">Personnes</th>
                </tr>
              </thead>
              <tbody>
                {data.routes.map((row) => (
                  <tr key={row.route}>
                    <td className="font-mono text-xs break-all">{row.route}</td>
                    <td className="text-right tabular-nums">{row.views}</td>
                    <td className="text-right tabular-nums">{row.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Assos les plus actives (30 j)">
          {data.assos.length === 0 ? (
            <Empty />
          ) : (
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Asso</th>
                  <th className="text-right">Personnes</th>
                  <th className="text-right">Pages</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.assos.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td className="text-right tabular-nums">{row.users}</td>
                    <td className="text-right tabular-nums">{row.views}</td>
                    <td className="text-right tabular-nums">{row.actions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Appareils (30 j)">
          {data.devices.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-1 text-sm">
              {data.devices.map((row) => (
                <li key={row.device} className="flex justify-between">
                  <span>{DEVICE_LABELS[row.device] ?? row.device}</span>
                  <span className="tabular-nums">{row.users} personne(s)</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {data.archive.length > 0 && (
          <div className="lg:col-span-2">
            <Section title="Archives anonymes (au-delà de 13 mois, hors Admins)">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th className="text-right">Utilisateurs actifs</th>
                    <th className="text-right">Pages vues</th>
                    <th className="text-right">Connexions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.archive.map((row) => (
                    <tr key={row.month}>
                      <td>
                        {MONTH_FORMATTER.format(new Date(`${row.month}-01T00:00:00Z`))}
                      </td>
                      <td className="text-right tabular-nums">{row.activeUsers}</td>
                      <td className="text-right tabular-nums">{row.pageViews}</td>
                      <td className="text-right tabular-nums">{row.logins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
