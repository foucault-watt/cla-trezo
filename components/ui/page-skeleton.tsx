export function PageSkeleton() {
  return (
    <div role="status" aria-label="Chargement de la page">
      <div className="skeleton h-7 w-56" />
      <div className="skeleton mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
        <div className="skeleton h-12" />
      </div>
    </div>
  );
}

export function StepSkeleton() {
  return (
    <div role="status" aria-label="Chargement de l'étape" className="space-y-5">
      <div className="skeleton h-6 w-64" />
      <div className="skeleton h-48" />
      <div className="skeleton h-32" />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className="flex flex-1 items-center justify-center bg-base-200"
    >
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
