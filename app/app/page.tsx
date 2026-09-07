import Image from "next/image";
import Link from "next/link";
import { ShieldUser } from "lucide-react";
import { getSession } from "@/lib/session";
import { listAssociations } from "@/lib/admin/associations";
import { MemberAssoCard } from "./_components/member-asso-card";
import { OtherAssoCard } from "./_components/other-asso-card";
import type { MemberAssoCard as MemberAssoCardData } from "./_components/home-types";

export default async function AppHomePage() {
  const session = await getSession();
  const user = session.user!;

  const memberSlugs = new Set(user.structures.map((s) => s.slug));

  // Une seule requête pour tout le monde : club-demo n'apparaît jamais ici
  // (EXCLUDE_DEMO_ASSO), et un appel par Structure en Promise.all a déjà fait
  // dépasser le pool de connexions Neon en dev ("Unable to start a
  // transaction").
  const allAssos = await listAssociations();
  const overviewBySlug = new Map(allAssos.map((asso) => [asso.slug, asso]));

  const memberCards: MemberAssoCardData[] = user.structures.map((structure) => ({
    ...structure,
    overview: overviewBySlug.get(structure.slug) ?? null,
  }));

  const otherAssos = user.isAdmin
    ? allAssos.filter((asso) => !memberSlugs.has(asso.slug))
    : [];

  return (
    <div className="flex flex-1 flex-col bg-base-200">
      <div className="flex items-center gap-2 border-b border-base-300 bg-base-100 p-3">
        <Image src="/logo.png" alt="" width={24} height={24} className="rounded-sm" />
        <span className="font-semibold">CLA Trézo</span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">
                Bonjour {user.firstname}
              </h1>
              <p className="mt-1 text-sm text-base-content/70">
                Choisissez une Asso pour continuer.
              </p>
            </div>
            {user.isAdmin && (
              <Link href="/app/admin" className="btn btn-outline btn-sm">
                <ShieldUser size={16} />
                Administration
              </Link>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-base-content/70">
              Mes Assos
            </h2>
            {memberCards.length === 0 ? (
              <p className="text-base-content/70">
                Vous n&apos;êtes membre d&apos;aucune Asso pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {memberCards.map((card) => (
                  <MemberAssoCard key={card.assoId} card={card} />
                ))}
              </div>
            )}
          </div>

          {user.isAdmin && otherAssos.length > 0 && (
            <div className="collapse-arrow collapse border border-base-300 bg-base-100 shadow-md">
              <input type="checkbox" />
              <div className="collapse-title flex items-center gap-2 text-base-content/70">
                <ShieldUser size={18} />
                <span className="text-sm font-medium">
                  Autres Assos, accessibles en vue Admin ({otherAssos.length})
                </span>
              </div>
              <div className="collapse-content">
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 md:grid-cols-3">
                  {otherAssos.map((asso) => (
                    <OtherAssoCard key={asso.id} asso={asso} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
