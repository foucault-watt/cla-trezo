import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold">Trésorerie des associations</h1>
      <p className="max-w-md text-base-content/70">
        Suivi des soldes, subventions et factures des associations de
        l&apos;école.
      </p>
      <Link href="/login" className="btn btn-primary">
        Se connecter
      </Link>
    </div>
  );
}
