import { CheckCircle2, Info, Lock, Pencil, XCircle } from "lucide-react";

const TIMELINE_STEPS = [
  {
    label: "Créer",
    detail: "La note démarre en Brouillon.",
  },
  {
    label: "Compléter",
    detail: "Justificatifs et lignes de dépense.",
  },
  {
    label: "Soumettre",
    detail: "Vous ne pouvez plus la modifier : elle part chez l'Admin CLA.",
    highlight: true,
  },
  {
    label: "Prise en charge",
    detail: "Par l'Admin CLA.",
    pending: true,
  },
];

export function ExpenseReportGuide() {
  return (
    <div className="collapse-arrow collapse mb-6 border border-base-300 bg-base-100 shadow-md">
      <input type="checkbox" />
      <div className="collapse-title flex items-center gap-2 font-medium">
        <Info size={16} className="text-base-content/60" />
        Comment fonctionne une Note de frais ?
      </div>
      <div className="collapse-content">
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <ul className="timeline timeline-vertical timeline-compact">
            {TIMELINE_STEPS.map(({ label, detail, highlight, pending }, i) => (
              <li key={label}>
                {i > 0 && <hr className="bg-base-300" />}
                <div className="timeline-middle">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      highlight
                        ? "bg-primary text-primary-content"
                        : pending
                          ? "bg-warning/20 text-warning"
                          : "bg-base-300 text-base-content/70"
                    }`}
                  >
                    {i + 1}
                  </div>
                </div>
                <div
                  className={`timeline-end timeline-box ${
                    highlight ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {label}
                    {highlight && <Lock size={12} className="text-primary" />}
                  </p>
                  <p className="text-xs text-base-content/60">{detail}</p>
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <hr className="bg-base-300" />
                )}
              </li>
            ))}
          </ul>

          <div className="divider divider-horizontal m-0 hidden lg:flex" />

          <div className="mx-auto w-full max-w-xs rounded-box border border-base-300 p-3">
            <p className="mb-2 text-sm font-medium">L&apos;Admin CLA peut :</p>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={14}
                  className="mt-0.5 shrink-0 text-success"
                />
                <span>Valider la note de frais telle quelle.</span>
              </li>
              <li className="flex items-start gap-2">
                <Pencil size={14} className="mt-0.5 shrink-0 text-info" />
                <span>La modifier, puis la valider.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle size={14} className="mt-0.5 shrink-0 text-error" />
                <span>
                  La rejeter — il faudra alors recommencer une nouvelle note
                  de zéro.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
