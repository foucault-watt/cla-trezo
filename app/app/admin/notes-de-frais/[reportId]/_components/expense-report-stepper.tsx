"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  EXPENSE_REPORT_STEP_LABELS,
  EXPENSE_REPORT_STEPS,
  type ExpenseReportStep,
} from "@/lib/expense-reports/expense-report-steps";

// Côté Admin, pas d'« envoi » : l'étape Bénéficiaire mène à la validation.
const stepLabels: Record<ExpenseReportStep, string> = {
  ...EXPENSE_REPORT_STEP_LABELS,
  beneficiaire: "Bénéficiaire",
};

const stepDescriptions: Record<ExpenseReportStep, string> = {
  remboursements: "Dépenses puis justificatifs",
  beneficiaire: "Destinataire",
};

function adminExpenseReportStepHref(
  reportId: string,
  step: ExpenseReportStep,
) {
  return `/app/admin/notes-de-frais/${reportId}/${step}`;
}

/**
 * Équivalent Admin du stepper côté App (expense-report-stepper.tsx) : sans
 * verrouillage séquentiel puisque l'Admin n'a pas de brouillon à compléter
 * dans l'ordre — les 2 étapes sont toujours librement accessibles.
 */
export function AdminExpenseReportStepper({
  reportId,
}: {
  reportId: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Étapes de la Note de frais" className="mt-6">
      <ol className="grid grid-cols-2 gap-3">
        {EXPENSE_REPORT_STEPS.map((step, index) => {
          const href = adminExpenseReportStepHref(reportId, step);
          const current = pathname === href;

          return (
            <li key={step}>
              <Link
                href={href}
                aria-current={current ? "step" : undefined}
                className={`flex h-full items-center gap-3 rounded-box border p-3 text-left shadow-sm transition-colors sm:p-4 ${
                  current
                    ? "border-primary bg-primary/5"
                    : "border-base-300 bg-base-100 hover:border-primary/50"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    current
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content/50"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      current ? "text-primary" : ""
                    }`}
                  >
                    {stepLabels[step]}
                  </span>
                  <span className="hidden text-xs text-base-content/60 sm:block">
                    {stepDescriptions[step]}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
