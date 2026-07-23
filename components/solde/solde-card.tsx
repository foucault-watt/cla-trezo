import type { SoldeView } from "@/lib/solde/solde";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export function SoldeCard({
  solde,
}: {
  solde: Extract<SoldeView, { status: "not_initialized" | "ready" }>;
}) {
  if (solde.status === "not_initialized") {
    return (
      <div className="card mt-2 border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Solde</h2>
          <div role="alert" className="alert alert-info alert-soft">
            <span>
              Le solde de ce Club n&apos;a pas encore été initialisé par un
              administrateur.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Solde</h2>

        <div className="stats bg-transparent">
          <div className="stat px-0">
            <div className="stat-title">Solde actuel</div>
            <div className="stat-value">
              {currency.format(solde.balanceCents / 100)}
            </div>
          </div>
        </div>

        <h3 className="mt-2 text-sm font-medium text-base-content/70">
          Historique des mouvements
        </h3>
        {solde.movements.length === 0 ? (
          <p className="text-base-content/70">Aucun mouvement.</p>
        ) : (
          <ul className="list">
            {solde.movements.map((m) => (
              <li key={m.id} className="list-row items-center">
                <div>
                  <div>{m.description ?? m.category ?? "Mouvement"}</div>
                  <div className="text-sm text-base-content/60">
                    {dateFormat.format(m.createdAt)}
                  </div>
                </div>
                <span
                  className={`badge ${m.movementType === "CREDIT" ? "badge-success" : "badge-error"} badge-soft`}
                >
                  {m.movementType === "CREDIT" ? "+" : "-"}
                  {currency.format(m.amountCents / 100)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
