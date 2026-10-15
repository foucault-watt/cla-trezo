import Link from "next/link";

const TABS = [
  { href: "/app/admin/stats", label: "Vue d'ensemble" },
  { href: "/app/admin/stats/utilisateurs", label: "Utilisateurs" },
  { href: "/app/admin/stats/audit", label: "Journal d'audit" },
] as const;

/**
 * En-tête commun des pages de suivi. Ces pages ne figurent volontairement
 * dans aucune navigation (décision CLA) : on y accède par l'URL directe
 * /app/admin/stats, sous le contrôle Admin habituel.
 */
export function StatsHeader({
  active,
  includeAdmins,
  showAdminToggle = true,
}: {
  active: (typeof TABS)[number]["href"];
  includeAdmins: boolean;
  showAdminToggle?: boolean;
}) {
  const toggleHref = includeAdmins ? active : `${active}?admins=1`;

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">Statistiques d&apos;usage</h1>
      <p className="mt-1 text-sm text-base-content/70">
        Connexions, pages vues et actions par utilisateur. Détail nominatif
        conservé 13 mois, journal d&apos;audit 10 ans.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="tabs tabs-box">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              role="tab"
              href={includeAdmins ? `${tab.href}?admins=1` : tab.href}
              className={`tab ${tab.href === active ? "tab-active" : ""}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        {showAdminToggle && (
          <Link
            href={toggleHref}
            className="label cursor-pointer gap-2 text-sm"
            aria-pressed={includeAdmins}
          >
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={includeAdmins}
              readOnly
              tabIndex={-1}
            />
            Inclure les Admins
          </Link>
        )}
      </div>
    </div>
  );
}
