import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Connexion",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!error) {
    redirect("/api/auth/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <h1 className="card-title">Connexion impossible</h1>
          <div
            role="alert"
            className="alert alert-error alert-soft items-start text-sm"
          >
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              La connexion avec votre compte CLA n&apos;a pas abouti. Réessayez
              dans un instant ; si le problème persiste, contactez l&apos;équipe
              CLA.
            </span>
          </div>
          <p className="text-xs text-base-content/50">Détail : {error}</p>
          <a href="/api/auth/login" className="btn btn-primary mt-2">
            <RotateCcw size={16} />
            Réessayer avec CLA
          </a>
          <Link href="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
