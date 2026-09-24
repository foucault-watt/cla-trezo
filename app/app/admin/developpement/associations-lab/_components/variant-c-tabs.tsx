"use client";

import { useState } from "react";
import {
  Building2,
  Scale,
  FileText,
  Download,
  ChevronDown,
  TriangleAlert,
} from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  getAsso1901Fixtures,
  getClubFixtures,
  getSubventionAgeBand,
  members,
  type MockAssoType,
  type MockMovement,
  type MockSubvention,
} from "./fixtures";
import { MemberLoginBadge, formatMemberDate } from "./member-login-badge";
import { formatDay } from "./month-groups";

type InnerTab = "apercu" | "solde" | "subventions" | "notes-de-frais" | "documents";

const monthDividerFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

const statutBadgeClass: Record<string, string> = {
  "En attente": "badge-warning",
  Validée: "badge-info",
  Remboursée: "badge-success",
};

/**
 * Variante C — un résumé "Aperçu" (Membres + le seul chiffre du Solde/des
 * Subventions), puis un onglet par domaine repris quasiment tel quel de la
 * vue application : Solde avec son vrai historique mensuel (cf. SoldeCard),
 * Subventions, Notes de frais (lecture seule — on ne crée rien depuis
 * l'admin) et Documents (avec un "Télécharger tout", qui pourrait à terme
 * remplacer l'onglet Stockage pour le téléchargement par Asso).
 */
export function VariantCTabs({
  assoType,
  initialized,
}: {
  assoType: MockAssoType;
  initialized: boolean;
}) {
  const [tab, setTab] = useState<InnerTab>("apercu");
  const isClub = assoType === "CLUB";
  const club = getClubFixtures(initialized);
  const asso1901 = getAsso1901Fixtures(initialized);
  const name = isClub ? club.name : asso1901.name;
  const Icon = isClub ? Building2 : Scale;
  const subventions = isClub ? club.subventions : asso1901.subventions;
  const notesDeFrais = isClub ? club.notesDeFrais : asso1901.notesDeFrais;

  const tabs: { key: InnerTab; label: string }[] = [
    { key: "apercu", label: "Aperçu" },
    ...(isClub
      ? [{ key: "solde" as const, label: "Solde" }]
      : []),
    { key: "subventions", label: `Subventions (${subventions.length})` },
    {
      key: "notes-de-frais",
      label: `Notes de frais (${notesDeFrais.length})`,
    },
    { key: "documents", label: "Documents" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon size={24} className="text-primary" />
        <div>
          <h2 className="text-xl font-semibold">{name}</h2>
          <span className="badge badge-sm badge-outline mt-1">
            {isClub ? "Club" : "Association loi 1901"}
          </span>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-box mt-4 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? "tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-md">
        {tab === "apercu" && (
          <ApercuTab
            isClub={isClub}
            solde={club.solde}
            subventions={subventions}
            initialized={initialized}
          />
        )}

        {tab === "solde" &&
          isClub &&
          (club.solde.status === "not_initialized" ? (
            <div className="alert alert-info">
              <span>
                Le solde de ce Club n&apos;a pas encore été initialisé.
              </span>
            </div>
          ) : (
            <SoldeHistory
              balanceCents={club.solde.balanceCents}
              movements={club.solde.movements}
            />
          ))}

        {tab === "subventions" &&
          (subventions.length === 0 ? (
            <div className="alert alert-info">
              <span>Aucune Subvention publiée pour l&apos;instant.</span>
            </div>
          ) : (
            <SubventionsLedger subventions={subventions} />
          ))}

        {tab === "notes-de-frais" && (
          <div>
            <p className="mb-3 text-sm text-base-content/60">
              Notes de frais de cette Asso, lecture seule — on ne peut pas en
              créer depuis l&apos;admin.
            </p>
            {notesDeFrais.length === 0 ? (
              <p className="text-sm text-base-content/60">
                Aucune Note de frais pour l&apos;instant.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-base-200">
                {notesDeFrais.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{n.beneficiaire}</span>
                      <span
                        className={`ml-2 badge badge-sm badge-soft ${statutBadgeClass[n.statut]}`}
                      >
                        {n.statut}
                      </span>
                      <div className="mt-0.5 text-xs text-base-content/50">
                        {formatDay(n.date)} · Financée sur {n.fundingSource}
                      </div>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatCents(n.montantCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "documents" && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-base-content/60">
                Documents PDF de cette Asso. À terme, cet onglet pourrait
                remplacer l&apos;onglet Stockage pour le téléchargement par
                Asso.
              </p>
              {subventions.length > 0 && (
                <a href="#" className="btn btn-outline btn-sm gap-2">
                  <Download size={14} />
                  Télécharger tout
                </a>
              )}
            </div>
            {subventions.length === 0 ? (
              <p className="text-sm text-base-content/60">
                Aucun document généré pour l&apos;instant.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-base-200">
                {subventions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <span>{s.document.label}</span>
                      <div className="text-xs text-base-content/50">
                        {s.campagne} · {formatDay(s.date)}
                      </div>
                    </div>
                    <a href="#" className="link flex items-center gap-1">
                      <Download size={12} />
                      Télécharger
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ApercuTab({
  isClub,
  solde,
  subventions,
  initialized,
}: {
  isClub: boolean;
  solde: { status: "ready"; balanceCents: number } | { status: "not_initialized" };
  subventions: { montantCents: number }[];
  initialized: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="stats border border-base-300 bg-base-100 shadow-sm">
        <div className="stat">
          <div className="stat-title">{isClub ? "Solde actuel" : "Subventions"}</div>
          {isClub ? (
            solde.status === "not_initialized" ? (
              <div className="stat-desc text-warning">Pas encore initialisé</div>
            ) : (
              <div className="stat-value text-2xl">
                {formatCents(solde.balanceCents)}
              </div>
            )
          ) : !initialized ? (
            <div className="stat-desc text-warning">Aucune pour l&apos;instant</div>
          ) : (
            <div className="stat-value text-2xl">
              {formatCents(
                subventions.reduce((sum, s) => sum + s.montantCents, 0),
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-base-content/70">
          Membres
        </h3>
        <p className="mb-2 text-sm text-base-content/60">
          Pour savoir qui contacter dans cette Asso. Une connexion ancienne
          signale que le rôle affiché n&apos;a peut-être plus été rafraîchi
          depuis longtemps.
        </p>
        <ul className="flex flex-col divide-y divide-base-200">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 badge badge-ghost badge-sm">
                  {m.role}
                </span>
                <div className="mt-0.5 text-xs text-base-content/50">
                  Depuis le {formatMemberDate(m.since)}
                </div>
              </div>
              <MemberLoginBadge lastLoginAt={m.lastLoginAt} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const BATCH_SIZE = 10;

/**
 * Reprend ~à l'identique components/solde/solde-card.tsx (vue application) :
 * stat "Solde actuel", historique paginé par lots de 10 avec séparateurs de
 * mois, plutôt qu'une présentation admin ad hoc.
 */
function SoldeHistory({
  balanceCents,
  movements,
}: {
  balanceCents: number;
  movements: MockMovement[];
}) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const visible = movements.slice(0, visibleCount);

  function monthKey(iso: string) {
    return iso.slice(0, 7);
  }

  return (
    <div>
      <div className="stats bg-transparent">
        <div className="stat px-0">
          <div className="stat-title">Solde actuel</div>
          <div className="stat-value">{formatCents(balanceCents)}</div>
        </div>
      </div>

      <h3 className="mt-2 mb-1 text-sm font-medium text-base-content/70">
        Historique des mouvements
      </h3>

      {movements.length === 0 ? (
        <p className="text-base-content/70">Aucun mouvement.</p>
      ) : (
        <div className="flex flex-col">
          <ul className="flex flex-col">
            {visible.map((m, i) => {
              const isNewMonth =
                i === 0 || monthKey(m.date) !== monthKey(visible[i - 1].date);
              return (
                <li key={m.id}>
                  {isNewMonth && (
                    <div className="divider my-1 text-xs text-base-content/50 capitalize">
                      {monthDividerFormat.format(new Date(m.date))}
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1.5 text-sm">
                    <span>
                      <span className="mr-2 text-xs text-base-content/50">
                        {formatDay(m.date)}
                      </span>
                      {m.label}
                    </span>
                    <span
                      className={`font-medium tabular-nums ${m.type === "CREDIT" ? "text-success" : "text-error"}`}
                    >
                      {m.type === "CREDIT" ? "+" : "-"}
                      {formatCents(m.amountCents)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {visibleCount < movements.length && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
              >
                <ChevronDown size={16} />
                Charger 10 mouvements de plus (
                {movements.length - visibleCount} restants)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubventionCard({ s }: { s: MockSubvention }) {
  return (
    <li className="py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{s.campagne}</span>
        <span>
          {formatCents(s.montantUtiliseCents)} / {formatCents(s.montantCents)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-base-content/60">
        <span>{s.statut}</span>
        <a href="#" className="link flex items-center gap-1">
          <FileText size={12} />
          {s.document.label}
        </a>
      </div>
    </li>
  );
}

/**
 * Reprend le principe de
 * app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx (vue
 * application) : les Subventions récentes (≤ 1 an) sont dépliées par défaut,
 * les anciennes (1-2 ans) repliées avec un style d'avertissement, et
 * l'historique (> 2 ans) replié plus loin, en version compacte — pour ne
 * jamais donner l'impression que seules les vieilles Subventions comptent.
 */
function SubventionsLedger({ subventions }: { subventions: MockSubvention[] }) {
  const recent = subventions.filter(
    (s) => getSubventionAgeBand(s.date) === "recent",
  );
  const old = subventions.filter((s) => getSubventionAgeBand(s.date) === "old");
  const history = subventions.filter(
    (s) => getSubventionAgeBand(s.date) === "history",
  );

  return (
    <div className="space-y-3">
      {recent.length > 0 ? (
        <div>
          <h3 className="mb-1 text-sm font-medium text-base-content/70">
            Campagnes récentes
          </h3>
          <ul className="flex flex-col divide-y divide-base-200">
            {recent.map((s) => (
              <SubventionCard key={s.id} s={s} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-base-content/60">
          Aucune Subvention récente (moins d&apos;un an).
        </p>
      )}

      {old.length > 0 && (
        <div className="collapse-arrow collapse border border-warning/30 bg-warning/5">
          <input type="checkbox" />
          <div className="collapse-title flex items-center gap-2 text-sm font-medium text-warning">
            <TriangleAlert size={14} />
            Subventions anciennes ({old.length})
          </div>
          <div className="collapse-content">
            <ul className="flex flex-col divide-y divide-base-200">
              {old.map((s) => (
                <SubventionCard key={s.id} s={s} />
              ))}
            </ul>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="collapse-arrow collapse border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium text-base-content/70">
            Historique ({history.length})
          </div>
          <div className="collapse-content">
            <ul className="flex flex-col divide-y divide-base-200">
              {history.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-1.5 text-sm text-base-content/70"
                >
                  <span>{s.campagne}</span>
                  <span>
                    {formatCents(s.montantUtiliseCents)} /{" "}
                    {formatCents(s.montantCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
