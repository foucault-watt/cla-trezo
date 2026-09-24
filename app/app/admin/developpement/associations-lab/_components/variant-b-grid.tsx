"use client";

import {
  Building2,
  Scale,
  Users,
  Wallet,
  FileText,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  getAsso1901Fixtures,
  getClubFixtures,
  members,
  type MockAssoType,
} from "./fixtures";
import { formatMemberDate, isStaleLogin } from "./member-login-badge";

/**
 * Variante B — grille de cartes indépendantes, à la manière d'un dashboard :
 * chaque domaine (finance, membres, documents, notes de frais) a sa propre
 * carte de taille égale. Une carte "Finance" toujours présente mais dont le
 * contenu change radicalement selon le type, au lieu d'un bloc qui disparaît.
 */
export function VariantBGrid({
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-base">
              <Wallet size={18} className="text-primary" />
              {isClub ? "Solde" : "Subventions"}
            </h3>
            {isClub ? (
              club.solde.status === "not_initialized" ? (
                <p className="text-sm text-base-content/60">
                  Pas encore initialisé — aucune entrée manuelle enregistrée.
                </p>
              ) : (
                <div>
                  <div className="text-3xl font-bold">
                    {formatCents(club.solde.balanceCents)}
                  </div>
                  <p className="mt-1 text-xs text-base-content/60">
                    {club.solde.movements.length} mouvement
                    {club.solde.movements.length > 1 ? "s" : ""}
                  </p>
                </div>
              )
            ) : asso1901.subventions.length === 0 ? (
              <p className="text-sm text-base-content/60">
                Aucune Subvention publiée pour l&apos;instant.
              </p>
            ) : (
              <div>
                <div className="text-3xl font-bold">
                  {formatCents(
                    asso1901.subventions.reduce(
                      (s, x) => s + x.montantCents,
                      0,
                    ),
                  )}
                </div>
                <p className="mt-1 text-xs text-base-content/60">
                  {asso1901.subventions.length} Subvention
                  {asso1901.subventions.length > 1 ? "s" : ""} · pas de Solde
                  interne (Association 1901)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-base">
              <Users size={18} className="text-primary" />
              Membres
            </h3>
            <div className="text-3xl font-bold">{members.length}</div>
            <div className="mt-1 flex -space-x-2">
              {members.slice(0, 4).map((m) => {
                const stale = isStaleLogin(m.lastLoginAt);
                return (
                  <div
                    key={m.id}
                    className="avatar avatar-placeholder tooltip"
                    data-tip={`${m.name} (${m.role}) — vu·e le ${formatMemberDate(m.lastLoginAt)}`}
                  >
                    <div
                      className={`w-8 rounded-full text-neutral-content ${
                        stale ? "bg-warning text-warning-content" : "bg-neutral"
                      }`}
                    >
                      <span className="text-xs">
                        {m.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {members.some((m) => isStaleLogin(m.lastLoginAt)) && (
              <p className="mt-2 flex items-center gap-1 text-xs text-warning">
                <TriangleAlert size={12} />
                {members.filter((m) => isStaleLogin(m.lastLoginAt)).length} pas
                revu·e depuis longtemps — rôle peut-être obsolète.
              </p>
            )}
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body">
            <h3 className="card-title text-base">
              <Receipt size={18} className="text-primary" />
              Notes de frais
            </h3>
            <div className="text-3xl font-bold">{notesDeFraisEnAttente}</div>
            <p className="mt-1 text-xs text-base-content/60">en attente</p>
          </div>
        </div>

        {!isClub && (
          <div className="card border border-base-300 bg-base-100 shadow-md md:col-span-2 xl:col-span-3">
            <div className="card-body">
              <h3 className="card-title text-base">
                <FileText size={18} className="text-primary" />
                Documents
              </h3>
              {asso1901.subventions.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  Aucune Convention de subvention générée pour l&apos;instant
                  — elles apparaissent ici dès qu&apos;une Subvention est
                  publiée.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-base-200">
                  {asso1901.subventions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span>{s.campagne}</span>
                      <a href="#" className="link flex items-center gap-1">
                        <FileText size={12} />
                        {s.document.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
