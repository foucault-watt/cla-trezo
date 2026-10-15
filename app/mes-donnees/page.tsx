import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BackLink } from "@/components/nav/back-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getOwnTrackingData } from "@/lib/analytics/stats";
import { auditActionLabel } from "@/lib/audit/labels";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Mes données de suivi",
};

export const dynamic = "force-dynamic";

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/**
 * Droit d'accès (RGPD) au suivi d'usage : volontairement absente de toute
 * navigation, liée seulement depuis les mentions légales.
 */
export default async function MesDonneesPage() {
  const user = await requireUser();
  const data = await getOwnTrackingData(user.id);

  return (
    <div className="relative flex flex-1 flex-col bg-base-200">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/web-app-manifest-512x512.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-sm font-semibold">CLA Trézo</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-10">
          <BackLink href="/mentions-legales#donnees-personnelles" label="Mentions légales" />
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Mes données de suivi
          </h1>
          <p className="mt-2 text-sm text-base-content/70">
            {user.firstname} {user.lastname}, voici ce que Trézo enregistre de
            votre utilisation. Seuls les Admins de CLA y ont accès.
          </p>

          <div className="mt-8 space-y-8 text-sm text-base-content/80">
            <section>
              <h2 className="text-base font-semibold text-base-content">
                Pages consultées
              </h2>
              <p className="mt-2">
                {data.pageViewCount} page(s) conservée(s) : l&apos;adresse de
                la page, la date et le type d&apos;appareil (mobile, tablette
                ou ordinateur). Conservées 13 mois, puis remplacées par des
                totaux anonymes.
              </p>
              {data.pageViews.length > 0 && (
                <ul className="mt-3 divide-y divide-base-200">
                  {data.pageViews.map((view, index) => (
                    <li key={index} className="flex flex-wrap gap-x-3 py-1">
                      <span className="w-40 shrink-0 text-xs tabular-nums text-base-content/60">
                        {dateTime.format(view.createdAt)}
                      </span>
                      <span className="font-mono text-xs break-all">{view.path}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-base-content">
                Connexions
              </h2>
              <p className="mt-2">
                La date de chaque connexion via le SSO CLA, conservée 13 mois
                (la plus récente est gardée pour indiquer aux trésoriers votre
                dernière connexion).
              </p>
              {data.logins.length > 0 && (
                <ul className="mt-3 divide-y divide-base-200">
                  {data.logins.map((login, index) => (
                    <li key={index} className="py-1 text-xs tabular-nums">
                      {dateTime.format(login.connectedAt)}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-base font-semibold text-base-content">
                Actions enregistrées
              </h2>
              <p className="mt-2">
                {data.auditCount} action(s) : chaque création, modification ou
                suppression dans Trézo (Notes de frais, Subventions…), avec la
                date et les champs concernés, jamais leur contenu. Conservées
                10 ans, comme les pièces comptables qu&apos;elles concernent.
              </p>
              {data.actions.length > 0 && (
                <ul className="mt-3 divide-y divide-base-200">
                  {data.actions.map((action, index) => (
                    <li key={index} className="flex flex-wrap gap-x-3 py-1">
                      <span className="w-40 shrink-0 text-xs tabular-nums text-base-content/60">
                        {dateTime.format(action.createdAt)}
                      </span>
                      <span>{auditActionLabel(action.action)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p>
              Pour toute question ou pour exercer vos droits :{" "}
              <a
                href="mailto:cla@centralelille.fr"
                className="text-base-content underline underline-offset-2"
              >
                cla@centralelille.fr
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
