import Link from "next/link";
import { Building2, ShieldUser } from "lucide-react";
import { getSession } from "@/lib/session";
import { listAssoDirectory } from "@/lib/admin/associations";

export default async function AppHomePage() {
  const session = await getSession();
  const user = session.user!;

  const memberSlugs = new Set(user.structures.map((s) => s.slug));
  const otherAssos = user.isAdmin
    ? (await listAssoDirectory()).filter((asso) => !memberSlugs.has(asso.slug))
    : [];

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-base-200 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Bonjour {user.firstname}</h1>
        <p className="mt-2 text-base-content/70">
          Choisissez une Asso pour continuer.
        </p>
      </div>

      {user.isAdmin && (
        <Link href="/app/admin" className="btn btn-outline">
          Accéder à l&apos;administration
        </Link>
      )}

      {user.structures.length === 0 ? (
        <p className="text-base-content/70">
          Vous n&apos;êtes membre d&apos;aucune Asso pour le moment.
        </p>
      ) : (
        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {user.structures.map((structure) => (
            <Link
              key={structure.assoId}
              href={`/app/${structure.slug}`}
              className="card min-h-40 items-center justify-center border border-base-300 bg-base-100 text-center shadow-md transition hover:shadow-lg"
            >
              <div className="card-body items-center justify-center">
                <Building2 className="text-base-content/60" size={28} />
                <h2 className="card-title">{structure.name}</h2>
                <p className="text-sm text-base-content/70">
                  {structure.role}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {user.isAdmin && otherAssos.length > 0 && (
        <div className="w-full max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-base-content/70">
            <ShieldUser size={18} />
            <p className="text-sm">
              Autres Assos, accessibles en vue Admin (vous n&apos;y avez pas
              de rôle)
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {otherAssos.map((asso) => (
              <Link
                key={asso.id}
                href={`/app/${asso.slug}`}
                className="card min-h-40 items-center justify-center border border-dashed border-base-300 bg-base-100 text-center shadow-sm transition hover:shadow-md"
              >
                <div className="card-body items-center justify-center">
                  <Building2 className="text-base-content/60" size={28} />
                  <h2 className="card-title">{asso.name}</h2>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
