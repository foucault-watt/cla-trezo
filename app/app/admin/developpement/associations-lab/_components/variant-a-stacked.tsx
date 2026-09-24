"use client";

import { Building2, Scale, FileText } from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  getAsso1901Fixtures,
  getClubFixtures,
  members,
  type MockAssoType,
} from "./fixtures";
import { MemberLoginBadge, formatMemberDate } from "./member-login-badge";

/**
 * Variante A — évolution directe de la page actuelle : tout reste empilé
 * verticalement dans l'ordre où un admin lit la page aujourd'hui, mais
 * chaque bloc devient explicite pour les 3 types au lieu de disparaître en
 * silence. Change le moins la mise en page existante.
 */
export function VariantAStacked({
  assoType,
  initialized,
}: {
  assoType: MockAssoType;
  initialized: boolean;
}) {
  const isClub = assoType === "CLUB";
  const club = getClubFixtures(initialized);
  const asso1901 = getAsso1901Fixtures(initialized);
  const name = isClub ? club.name : asso1901.name;
  const Icon = isClub ? Building2 : Scale;
  const notesDeFraisEnAttente = (
    isClub ? club.notesDeFrais : asso1901.notesDeFrais
  ).filter((n) => n.statut === "En attente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon size={24} className="text-primary" />
        <div>
          <h2 className="text-xl font-semibold">{name}</h2>
          <span className="badge badge-sm badge-outline mt-1">
            {isClub ? "Club" : "Association loi 1901"}
          </span>
        </div>
      </div>

      <div className="stats border border-base-300 bg-base-100 shadow-md">
        <div className="stat">
          <div className="stat-title">Notes de frais en attente</div>
          <div className="stat-value text-lg">{notesDeFraisEnAttente}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Membres</div>
          <div className="stat-value text-lg">{members.length}</div>
        </div>
      </div>

      {isClub ? (
        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Solde</h3>
            {club.solde.status === "not_initialized" ? (
              <div className="alert alert-info">
                <span>
                  Le solde de ce Club n&apos;a pas encore été initialisé par
                  un administrateur. Ajoutez une première entrée manuelle
                  ci-dessous pour le démarrer.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="stat px-0">
                  <div className="stat-title">Solde actuel</div>
                  <div className="stat-value">
                    {formatCents(club.solde.balanceCents)}
                  </div>
                  <div className="stat-desc">
                    {club.solde.movements.length} mouvement
                    {club.solde.movements.length > 1 ? "s" : ""} au total
                  </div>
                </div>
                <a href="#" className="btn btn-outline btn-sm">
                  Voir l&apos;historique
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title">Subventions</h3>
            <p className="text-sm text-base-content/60">
              Pas de Solde interne pour une Association loi 1901 — suivi
              uniquement par Subventions, chacune accompagnée d&apos;une
              Convention de subvention.
            </p>
            {asso1901.subventions.length === 0 ? (
              <div className="alert alert-info mt-2">
                <span>
                  Aucune Subvention publiée pour cette structure pour
                  l&apos;instant.
                </span>
              </div>
            ) : (
              <ul className="mt-2 flex flex-col divide-y divide-base-200">
                {asso1901.subventions.map((s) => (
                  <li key={s.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.campagne}</span>
                      <span className="text-sm">
                        {formatCents(s.montantUtiliseCents)} /{" "}
                        {formatCents(s.montantCents)}
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
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="card border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title">Membres</h3>
          <p className="text-sm text-base-content/60">
            Pour savoir qui contacter dans cette Asso. Une connexion ancienne
            signale que le rôle affiché n&apos;a peut-être plus été
            rafraîchi depuis longtemps.
          </p>
          <ul className="mt-2 flex flex-col divide-y divide-base-200">
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
    </div>
  );
}
