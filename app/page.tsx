import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HandCoins, LogIn, Receipt, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { DemoLoginButton } from "@/components/demo/demo-login-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SITE_URL } from "@/lib/site";

// Seule page du site destinée au référencement : le reste (derrière SSO)
// reste en noindex, hérité du layout racine.
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
  },
};

const features = [
  {
    icon: Wallet,
    title: "Solde en temps réel",
    desc: "Suivez le solde de votre club sans devoir harceler le trésorier de CLA",
  },
  {
    icon: HandCoins,
    title: "Demandes de subvention",
    desc: "Consultez vos demandes de subvention et suivez leur montant restant",
  },
  {
    icon: Receipt,
    title: "Notes de frais",
    desc: "Soumettez vos justificatifs et suivez vos remboursements",
  },
];

export default function Home() {
  // GIT_SHA/BUILD_DATE viennent du build-arg Docker (voir Dockerfile) ;
  // VERCEL_GIT_COMMIT_SHA est injecté automatiquement par Vercel côté
  // build/serveur, sans configuration, mais sans date de build associée.
  const gitSha = process.env.GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA;
  const buildDate = process.env.BUILD_DATE;
  const buildLabel = gitSha && gitSha !== "unknown" ? gitSha.slice(0, 7) : null;

  return (
    <div className="relative flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <Image
            src="/web-app-manifest-512x512.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-sm font-semibold">CLA Trézo</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-16 px-4 py-10 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5 text-center lg:text-left">
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Trézo - Centrale Lille Associations
            </h1>
            <p className="mx-auto max-w-md text-base text-base-content/70 lg:mx-0">
              L&apos;application de CLA pour les Clubs, Commissions et Associations
              loi 1901 : soldes, subventions et notes de frais au même endroit.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:items-stretch lg:justify-start">
              <Link href="/login" className="btn btn-primary w-full max-w-xs h-10">
                <LogIn size={18} />
                Se connecter
              </Link>
              <DemoLoginButton icon={<Sparkles size={18} />} />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto w-full max-w-sm rounded-2xl border border-base-300 bg-base-100 p-5 shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-base-content/50">
                Solde du Club
              </span>
              <TrendingUp className="text-success" size={16} />
            </div>
            <p className="text-3xl font-semibold">1 248,50 €</p>
            <div className="divider my-4" />
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between text-base-content/70">
                <span>Recette de la soirée dansante</span>
                <span className="font-medium text-base-content">+350 €</span>
              </li>
              <li className="flex items-center justify-between text-base-content/70">
                <span>Achats de boissons</span>
                <span className="font-medium text-warning">- 42 €</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card border border-base-300 bg-base-100 text-left shadow-sm"
            >
              <div className="card-body gap-2 p-5">
                <Icon className="text-primary" size={22} />
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="text-xs text-base-content/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-base-300 px-4 py-6 text-center text-xs text-base-content/50">
        <Link href="/mentions-legales" className="hover:text-base-content hover:underline">
          Mentions légales
        </Link>
        <span className="mx-2">·</span>
        Créé par Foucault Wattinne · © 2026
        {buildLabel && (
          <>
            <span className="mx-2">·</span>
            <span
              className="opacity-40"
              title={buildDate ? `Déployé le ${buildDate}` : undefined}
            >
              build {buildLabel}
            </span>
          </>
        )}
      </footer>
    </div>
  );
}
