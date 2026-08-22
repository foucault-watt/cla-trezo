"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  EXPENSE_REPORT_STEP_LABELS,
  EXPENSE_REPORT_STEPS,
  expenseReportStepHref,
  firstIncompleteExpenseReportStep,
  type ExpenseReportStepCompletion,
} from "@/lib/expense-reports/expense-report-steps";

export function ExpenseReportStepper({
  assoSlug,
  reportId,
  completion,
  editable,
}: {
  assoSlug: string;
  reportId: string;
  completion: ExpenseReportStepCompletion;
  editable: boolean;
}) {
  const pathname = usePathname();
  const firstIncomplete = firstIncompleteExpenseReportStep(completion);
  const maxIndex = editable
    ? EXPENSE_REPORT_STEPS.indexOf(firstIncomplete)
    : EXPENSE_REPORT_STEPS.length - 1;

  return (
    <div className="mt-6 overflow-x-auto pb-2">
      <ul className="steps min-w-[42rem] w-full">
        {EXPENSE_REPORT_STEPS.map((step, index) => {
          const href = expenseReportStepHref(assoSlug, reportId, step);
          const current = pathname === href;
          const available = !editable
            ? step === "recapitulatif"
            : index <= maxIndex;
          return (
            // `step` reste sur le <li> (comme le composant DaisyUI l'attend) :
            // c'est ce qui donne au trait de connexion ::before la largeur
            // pleine colonne nécessaire pour relier les étapes entre elles.
            // Pour rendre tout le rond + le trait cliquables (pas seulement
            // le libellé texte), un <Link> invisible est superposé en
            // `absolute inset-0` plutôt que de déplacer la classe `step`.
            <li
              key={step}
              className={`step group relative ${completion[step] || current ? "step-primary" : ""}`}
              data-content={completion[step] ? "✓" : index + 1}
            >
              {available && (
                <Link
                  href={href}
                  aria-current={current ? "step" : undefined}
                  aria-label={`Étape ${index + 1} : ${EXPENSE_REPORT_STEP_LABELS[step]}`}
                  className="absolute inset-0"
                />
              )}
              <span
                className={
                  !available
                    ? "text-base-content/40"
                    : current
                      ? "font-semibold text-primary"
                      : "group-hover:underline"
                }
              >
                {EXPENSE_REPORT_STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
