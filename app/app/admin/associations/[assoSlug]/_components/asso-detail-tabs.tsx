"use client";

import { useState } from "react";
import { formatCents } from "@/lib/money";
import { SoldeCard } from "@/components/solde/solde-card";
import { Stat, StatsBar } from "@/components/ui/stats";
import type { AssoDetail } from "@/lib/admin/associations";
import { ManualMovementForm } from "./manual-movement-form";
import { MembersList } from "./members-list";
import { SubventionsTab } from "./subventions-tab";
import { NotesDeFraisList } from "./notes-de-frais-list";
import { DocumentsList } from "./documents-list";

type InnerTab = "apercu" | "solde" | "subventions" | "notes-de-frais" | "documents";

/**
 * Onglets de la page Admin détail d'Asso — Aperçu
 * (un seul chiffre + Membres), Solde (Club uniquement, réutilise le vrai
 * SoldeCard de la vue Structure), Subventions, Notes de frais (lecture
 * seule) et Documents. Le nom/type/statut de l'Asso sont déjà affichés par
 * la page parente (page.tsx), pas répétés ici. Cf. le prototype validé
 * app/app/admin/developpement/associations-lab/_components/variant-c-tabs.tsx
 * pour la référence de design — celui-ci en est la version câblée aux
 * vraies données.
 */
export function AssoDetailTabs({ asso }: { asso: AssoDetail }) {
  const [tab, setTab] = useState<InnerTab>("apercu");
  const assoType = asso.type;
  const isClub = assoType === "CLUB";

  const tabs: { key: InnerTab; label: string }[] = [
    { key: "apercu", label: "Aperçu" },
    ...(isClub ? [{ key: "solde" as const, label: "Solde" }] : []),
    { key: "subventions", label: `Subventions (${asso.subventions.length})` },
    {
      key: "notes-de-frais",
      label: `Notes de frais (${asso.notesDeFrais.length})`,
    },
    { key: "documents", label: "Documents" },
  ];

  return (
    <div className="mt-6">
      <div role="tablist" className="tabs tabs-box w-fit">
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
        {tab === "apercu" && <ApercuTab asso={asso} isClub={isClub} />}

        {tab === "solde" &&
          isClub &&
          (asso.solde.status === "not_initialized" ||
            asso.solde.status === "ready") && (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
              <SoldeCard solde={asso.solde} />
              <ManualMovementForm assoId={asso.id} assoSlug={asso.slug} />
            </div>
          )}

        {tab === "subventions" && (
          <SubventionsTab subventions={asso.subventions} />
        )}

        {tab === "notes-de-frais" && (
          <div>
            <p className="mb-3 text-sm text-base-content/60">
              Notes de frais de cette Asso, lecture seule — on ne peut pas en
              créer depuis l&apos;admin.
            </p>
            <NotesDeFraisList reports={asso.notesDeFrais} />
          </div>
        )}

        {tab === "documents" &&
          (assoType ? (
            <DocumentsList
              assoId={asso.id}
              assoType={assoType}
              subventions={asso.subventions}
            />
          ) : (
            // Le Document d'octroi découle du Type (cf. ADR-0007).
            <p className="text-sm text-base-content/60">
              Pas de Document d&apos;octroi pour une Asso non classée.
            </p>
          ))}
      </div>
    </div>
  );
}

function ApercuTab({
  asso,
  isClub,
}: {
  asso: AssoDetail;
  isClub: boolean;
}) {
  const subventionsTotalCents = asso.subventions.reduce(
    (sum, s) => sum + s.totalAmountCents,
    0,
  );

  return (
    <div className="space-y-4">
      <StatsBar>
        {isClub ? (
          asso.solde.status === "not_initialized" ? (
            <Stat
              title="Solde actuel"
              desc="Pas encore initialisé"
              descClassName="text-warning"
            />
          ) : asso.solde.status === "ready" ? (
            <Stat
              title="Solde actuel"
              value={formatCents(asso.solde.balanceCents)}
            />
          ) : (
            <Stat title="Solde actuel" />
          )
        ) : asso.subventions.length === 0 ? (
          <Stat
            title="Subventions"
            desc="Aucune pour l'instant"
            descClassName="text-warning"
          />
        ) : (
          <Stat title="Subventions" value={formatCents(subventionsTotalCents)} />
        )}
      </StatsBar>

      <div>
        <h3 className="mb-2 text-sm font-medium text-base-content/70">
          Membres
        </h3>
        <p className="mb-2 text-sm text-base-content/60">
          Pour savoir qui contacter dans cette Asso. Une connexion ancienne
          signale que le rôle affiché n&apos;a peut-être plus été rafraîchi
          depuis longtemps.
        </p>
        <MembersList members={asso.members} />
      </div>
    </div>
  );
}
