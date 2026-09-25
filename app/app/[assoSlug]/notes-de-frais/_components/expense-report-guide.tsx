import { CheckCircle2, Info, Lock, Pencil, XCircle } from "lucide-react";

type Step = {
  label: string;
  detail: React.ReactNode;
  highlight?: boolean;
};

const ADMIN_OUTCOMES = [
  { icon: CheckCircle2, color: "text-success", label: "Validée" },
  { icon: Pencil, color: "text-info", label: "Modifiée puis validée" },
  { icon: XCircle, color: "text-error", label: "Rejetée : à refaire de zéro" },
];

const STEPS: Step[] = [
  { label: "Créer", detail: "La note démarre en Brouillon." },
  { label: "Compléter", detail: "Ajoutez dépenses et justificatifs." },
  {
    label: "Soumettre",
    highlight: true,
    detail: (
      <>
        Elle part chez l&apos;Admin CLA.
        <span className="mt-1 flex items-center gap-1 font-medium text-base-content/80">
          <Lock size={12} className="shrink-0" />
          Verrouillée dès sa prise en charge
        </span>
      </>
    ),
  },
  {
    label: "Décision de l'Admin CLA",
    detail: (
      <ul className="flex flex-col gap-0.5">
        {ADMIN_OUTCOMES.map(({ icon: Icon, color, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <Icon size={13} className={`shrink-0 ${color}`} />
            {label}
          </li>
        ))}
      </ul>
    ),
  },
];

export function ExpenseReportGuide() {
  return (
    <div className="collapse-arrow collapse mb-6 border border-base-300 bg-base-100 shadow-md">
      <input type="checkbox" />
      <div className="collapse-title flex items-center gap-2 font-medium">
        <Info size={16} className="shrink-0 text-base-content/60" />
        Comment fonctionne une Note de frais ?
      </div>
      <div className="collapse-content">
        <ol className="grid lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, i) => (
            <li
              key={step.label}
              className="relative flex gap-3 pb-5 last:pb-0 lg:flex-col lg:gap-2 lg:pb-0"
            >
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-8 bottom-1 left-3.5 w-px bg-base-300 lg:top-3.5 lg:right-[-1rem] lg:bottom-auto lg:left-10 lg:h-px lg:w-auto"
                />
              )}
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  step.highlight
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content/70"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5 lg:pt-0">
                <p className="text-sm font-medium">{step.label}</p>
                <div className="mt-0.5 text-xs text-base-content/60">
                  {step.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
