import { ChevronDown, ChevronRight, Info, Lock } from "lucide-react";
import { Fragment } from "react";
import { AdminOutcomesPopover } from "./admin-outcomes-popover";

type Step =
  | { kind: "text"; label: string; detail: string; highlight?: boolean }
  | { kind: "admin" };

const STEPS: Step[] = [
  { kind: "text", label: "Créer", detail: "La note démarre en Brouillon." },
  {
    kind: "text",
    label: "Compléter",
    detail: "Dépenses et justificatifs.",
  },
  {
    kind: "text",
    label: "Soumettre",
    detail: "Vous ne pouvez plus la modifier : elle part chez l'Admin CLA.",
    highlight: true,
  },
  { kind: "admin" },
];

function StepBadge({
  tone,
  children,
}: {
  tone: "default" | "highlight" | "pending";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        tone === "highlight"
          ? "bg-primary text-primary-content"
          : tone === "pending"
            ? "bg-warning/20 text-warning"
            : "bg-base-300 text-base-content/70"
      }`}
    >
      {children}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center py-1 text-base-content/30 lg:px-1 lg:py-0">
      <ChevronDown size={16} className="lg:hidden" />
      <ChevronRight size={16} className="hidden lg:block" />
    </div>
  );
}

export function ExpenseReportGuide() {
  return (
    <div className="collapse-arrow collapse mb-6 border border-base-300 bg-base-100 shadow-md">
      <input type="checkbox" />
      <div className="collapse-title flex items-center gap-2 font-medium">
        <Info size={16} className="text-base-content/60" />
        Comment fonctionne une Note de frais ?
      </div>
      <div className="collapse-content">
        <div className="mx-auto flex max-w-4xl flex-col lg:flex-row lg:items-stretch">
          {STEPS.map((step, i) => (
            <Fragment key={i}>
              {i > 0 && <Connector />}
              <div
                className={`min-w-0 flex-1 rounded-box border p-3 ${
                  step.kind === "text" && step.highlight
                    ? "border-primary/50 bg-primary/5"
                    : "border-base-300"
                }`}
              >
                {step.kind === "text" ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <StepBadge
                        tone={step.highlight ? "highlight" : "default"}
                      >
                        {i + 1}
                      </StepBadge>
                      {step.label}
                      {step.highlight && (
                        <Lock size={12} className="text-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-base-content/60">
                      {step.detail}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <StepBadge tone="pending">{i + 1}</StepBadge>
                      Décision de l&apos;Admin CLA
                      <AdminOutcomesPopover />
                    </div>
                    <p className="mt-1 text-xs text-base-content/60">
                      Valide, modifie ou rejette la note.
                    </p>
                  </>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
