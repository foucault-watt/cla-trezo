export function SoldeNotInitializedAlert({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`alert alert-info alert-soft${className ? ` ${className}` : ""}`}
    >
      <span>
        Le Solde de ce Club n&apos;a pas encore été initialisé par l&apos;Admin
        CLA.
      </span>
    </div>
  );
}
