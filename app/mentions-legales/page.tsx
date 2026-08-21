import Image from "next/image";
import Link from "next/link";
import { Building2, Code2, Cookie, Server, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const sections = [
  { id: "editeur", title: "Éditeur", icon: Building2 },
  { id: "developpement", title: "Développement", icon: Code2 },
  { id: "hebergement", title: "Hébergement", icon: Server },
  { id: "donnees-personnelles", title: "Données personnelles", icon: ShieldCheck },
  { id: "cookies", title: "Cookies", icon: Cookie },
];

export default function MentionsLegalesPage() {
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
          <h1 className="text-2xl font-semibold sm:text-3xl">Mentions légales</h1>
          <p className="mt-2 text-sm text-base-content/60">
            Dernière mise à jour : 19 août 2026
          </p>

          <nav aria-label="Sections" className="mt-6 flex flex-wrap gap-2">
            {sections.map(({ id, title, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="badge badge-outline gap-1.5 border-base-300 px-3 py-3 font-normal text-base-content/70 hover:border-primary hover:text-base-content"
              >
                <Icon size={13} />
                {title}
              </a>
            ))}
          </nav>

          <div className="mt-8 divide-y divide-base-300 text-sm leading-relaxed text-base-content/70 [&>section]:py-4 [&>section:first-child]:pt-0">
            <section id="editeur">
              <h2 className="flex items-center gap-2 text-base font-semibold text-base-content">
                <Building2 className="text-primary" size={17} />
                Éditeur
              </h2>
              <p className="mt-3">
                La présente application est éditée par{" "}
                <strong className="font-medium text-base-content">
                  Centrale Lille Associations (CLA)
                </strong>
                , association loi 1901 dont le siège est situé à :
              </p>
              <address className="mt-2 not-italic">
                École Centrale de Lille
                <br />
                Cité Scientifique – BP 48
                <br />
                59651 Villeneuve-d&apos;Ascq Cedex
              </address>
              <p className="mt-2">
                Contact :{" "}
                <a
                  href="mailto:cla@centralelille.fr"
                  className="text-base-content underline underline-offset-2"
                >
                  cla@centralelille.fr
                </a>
              </p>
              <p className="mt-2">
                <strong className="font-medium text-base-content">
                  Directeur de la publication :
                </strong>{" "}
                Mathéo Gueffier, Secrétaire général de Centrale Lille
                Associations.
              </p>
              <p className="mt-2">
                L&apos;application est destinée aux utilisateurs autorisés de
                Centrale Lille Associations et est accessible après
                authentification via le SSO de CLA.
              </p>
            </section>

            <section id="developpement">
              <h2 className="flex items-center gap-2 text-base font-semibold text-base-content">
                <Code2 className="text-primary" size={17} />
                Développement
              </h2>
              <p className="mt-3">Application conçue et développée par :</p>
              <address className="mt-2 not-italic">
                Foucault Wattinne
                <br />
                Entrepreneur individuel
                <br />
                SIREN : 106 263 254
              </address>
            </section>

            <section id="hebergement">
              <h2 className="flex items-center gap-2 text-base font-semibold text-base-content">
                <Server className="text-primary" size={17} />
                Hébergement
              </h2>
              <p className="mt-3">L&apos;application est hébergée par :</p>
              <address className="mt-2 not-italic">
                Rézoléo, association loi 1901
                <br />
                Résidence Léonard de Vinci
                <br />
                Avenue Paul Langevin
                <br />
                59650 Villeneuve-d&apos;Ascq
              </address>
              <p className="mt-2">
                Contact :{" "}
                <a
                  href="mailto:contact@rezoleo.fr"
                  className="text-base-content underline underline-offset-2"
                >
                  contact@rezoleo.fr
                </a>
              </p>
            </section>

            <section id="donnees-personnelles">
              <h2 className="flex items-center gap-2 text-base font-semibold text-base-content">
                <ShieldCheck className="text-primary" size={17} />
                Données personnelles
              </h2>
              <p className="mt-3">
                Centrale Lille Associations est responsable des traitements de
                données personnelles réalisés par l&apos;intermédiaire de
                l&apos;application.
              </p>
              <p className="mt-2">
                L&apos;application traite uniquement les données nécessaires à
                la gestion des Assos de CLA, des notes de frais, des
                remboursements, des soldes et des subventions. Ces données
                peuvent notamment comprendre l&apos;identité et l&apos;adresse
                électronique des utilisateurs, les informations relatives aux
                remboursements, les justificatifs transmis ainsi que les
                coordonnées bancaires nécessaires au remboursement.
              </p>
              <p className="mt-2">
                Ces traitements sont réalisés dans le cadre de la gestion
                administrative et financière de Centrale Lille Associations et
                de ses Assos.
              </p>
              <p className="mt-2">
                Les données sont accessibles uniquement aux personnes
                autorisées au sein de CLA ainsi qu&apos;aux prestataires
                techniques lorsque cela est nécessaire au fonctionnement ou à
                la maintenance de l&apos;application.
              </p>
              <p className="mt-2">
                Les données sont conservées pendant la durée nécessaire à la
                gestion et au suivi des opérations concernées, puis, lorsque
                cela est nécessaire, pendant les durées permettant à CLA de
                respecter ses obligations légales, administratives ou
                comptables.
              </p>
              <p className="mt-2">
                Les coordonnées bancaires saisies dans l&apos;application sont
                destinées uniquement à permettre le remboursement. Les IBAN
                sont supprimés de l&apos;application après la génération du
                document final de note de frais.
              </p>
              <p className="mt-2">
                Conformément à la réglementation applicable en matière de
                protection des données personnelles, les utilisateurs
                disposent notamment de droits d&apos;accès, de rectification,
                d&apos;effacement, de limitation et, lorsque les conditions
                sont réunies, d&apos;opposition concernant leurs données.
              </p>
              <p className="mt-2">
                Ces droits peuvent être exercés en contactant :{" "}
                <a
                  href="mailto:cla@centralelille.fr"
                  className="text-base-content underline underline-offset-2"
                >
                  cla@centralelille.fr
                </a>
                .
              </p>
              <p className="mt-2">
                Les utilisateurs peuvent également adresser une réclamation à
                la{" "}
                <strong className="font-medium text-base-content">
                  Commission nationale de l&apos;informatique et des libertés
                  (CNIL)
                </strong>
                .
              </p>
            </section>

            <section id="cookies">
              <h2 className="flex items-center gap-2 text-base font-semibold text-base-content">
                <Cookie className="text-primary" size={17} />
                Cookies
              </h2>
              <p className="mt-3">
                L&apos;application utilise uniquement des cookies et traceurs
                strictement nécessaires à son fonctionnement et à
                l&apos;authentification des utilisateurs, notamment un cookie
                de session.
              </p>
              <p className="mt-2">
                Aucun cookie publicitaire ou dispositif de suivi à des fins
                commerciales n&apos;est utilisé.
              </p>
              <p className="mt-2">
                Ces cookies étant nécessaires au fonctionnement du service et à
                l&apos;authentification, ils ne nécessitent pas le recueil
                préalable du consentement de l&apos;utilisateur.
              </p>
            </section>
          </div>

          <div className="mt-4">
            <Link href="/" className="btn btn-primary btn-sm">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-base-300 px-4 py-6 text-center text-xs text-base-content/50">
        Créé par Foucault Wattinne · © 2026
      </footer>
    </div>
  );
}
