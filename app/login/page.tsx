import { redirect } from "next/navigation";

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
    <div className="flex flex-1 items-center justify-center">
      <div className="card w-full max-w-sm bg-base-100 shadow">
        <div className="card-body">
          <h1 className="card-title">Connexion</h1>
          <p className="alert alert-error text-sm">{error}</p>
          <a href="/api/auth/login" className="btn btn-primary mt-2">
            Réessayer avec CLA
          </a>
        </div>
      </div>
    </div>
  );
}
