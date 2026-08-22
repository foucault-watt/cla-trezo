"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  EXPENSE_REPORT_STEP_LABELS,
  EXPENSE_REPORT_STEPS,
  expenseReportStepHref,
  firstIncompleteExpenseReportStep,
  type ExpenseReportStep,
  type ExpenseReportStepCompletion,
} from "@/lib/expense-reports/expense-report-steps";

const stepDescriptions: Record<ExpenseReportStep, string> = {
  remboursements: "Dépenses puis justificatifs",
  beneficiaire: "Destinataire puis actions",
};

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
    <nav aria-label="Étapes de la Note de frais" className="mt-6">
      <ol className="grid grid-cols-2 gap-3">
        {EXPENSE_REPORT_STEPS.map((step, index) => {
          const href = expenseReportStepHref(assoSlug, reportId, step);
          const current = pathname === href;
          const available = editable && index <= maxIndex;
          const content = (
            <>
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  current
                    ? "bg-primary text-primary-content"
                    : completion[step]
                      ? "bg-success/15 text-success"
                      : "bg-base-200 text-base-content/50"
                }`}
              >
                {completion[step] && !current ? <Check size={16} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    !available
                      ? "text-base-content/40"
                      : current
                        ? "text-primary"
                        : ""
                  }`}
                >
                  {EXPENSE_REPORT_STEP_LABELS[step]}
                </span>
                <span className="hidden text-xs text-base-content/60 sm:block">
                  {stepDescriptions[step]}
                </span>
              </span>
            </>
          );

          return (
            <li key={step}>
              {available ? (
                <Link
                  href={href}
                  aria-current={current ? "step" : undefined}
                  className={`flex h-full items-center gap-3 rounded-box border p-3 text-left shadow-sm transition-colors sm:p-4 ${
                    current
                      ? "border-primary bg-primary/5"
                      : "border-base-300 bg-base-100 hover:border-primary/50"
                  }`}
                >
                  {content}
                </Link>
              ) : (
                <div className="flex h-full items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 opacity-60 shadow-sm sm:p-4">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
