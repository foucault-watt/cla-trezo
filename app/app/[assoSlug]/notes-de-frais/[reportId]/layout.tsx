import type { Metadata } from "next";
import Link from "next/link";
import { Ban } from "lucide-react";
import { BackLink } from "@/components/nav/back-link";
import { getExpenseReportDetail } from "@/lib/expense-reports/expense-reports";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { loadExpenseReportWizard } from "@/lib/expense-reports/expense-report-wizard";
import { updateExpenseReportAction } from "@/lib/expense-reports/expense-report-actions";
import { ExpenseReportStepper } from "./_components/expense-report-stepper";
import { GeneralInformationModal } from "@/components/expense-reports/general-information-modal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}): Promise<Metadata> {
  const { assoSlug, reportId } = await params;
  const { report } = await getExpenseReportDetail(assoSlug, reportId);
  return { title: report.title };
}

export default async function ExpenseReportWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  const { report } = context;

  return (
    <div>
      <BackLink
        href={`/app/${assoSlug}/notes-de-frais`}
        label="Toutes les Notes de frais"
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          {report.description && (
            <p className="mt-1 text-sm text-base-content/70">
              {report.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {context.editable && (
            <GeneralInformationModal
              assoSlug={assoSlug}
              reportId={reportId}
              title={report.title}
              description={report.description}
              action={updateExpenseReportAction}
            />
          )}
          <span
            className={`badge ${expenseReportStatusBadgeClass[report.status]}`}
          >
            {expenseReportStatusLabel[report.status]}
          </span>
        </div>
      </div>
      {context.readOnlyAsAdmin &&
        (report.status === "DRAFT" ||
          report.status === "SUBMITTED" ||
          report.status === "TAKEN_OVER") && (
          <div role="status" className="alert alert-info alert-soft mt-5">
            <div>
              <p>
                Vous consultez cette Note de frais en tant qu&apos;Admin, en
                lecture seule.{" "}
                {report.status === "DRAFT"
                  ? "Elle est encore en Brouillon : l'Asso doit la soumettre avant que vous puissiez la prendre en charge."
                  : report.status === "SUBMITTED"
                    ? "Pour la modifier, prenez-la en charge depuis l'espace Admin."
                    : "Elle se modifie depuis l'espace Admin."}
              </p>
              {report.status !== "DRAFT" && (
                <Link
                  href={`/app/admin/notes-de-frais/${reportId}`}
                  className="link link-primary mt-1 inline-block text-sm font-medium"
                >
                  Ouvrir dans l&apos;espace Admin
                </Link>
              )}
            </div>
          </div>
        )}
      {!context.readOnlyAsAdmin && report.status === "TAKEN_OVER" && (
        <div role="status" className="alert alert-info alert-soft mt-5">
          L&apos;Admin CLA traite désormais cette Note de frais. Elle est
          disponible en lecture seule.
        </div>
      )}
      {report.status === "REJECTED" && (
        <div
          role="status"
          className="alert alert-error alert-soft mt-5 items-start"
        >
          <Ban size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              Cette Note de frais a été rejetée par l&apos;Admin CLA.
            </p>
            {report.rejectionReason && (
              <p className="mt-1 whitespace-pre-line text-sm">
                Motif : {report.rejectionReason}
              </p>
            )}
          </div>
        </div>
      )}
      {context.editable && (
        <ExpenseReportStepper
          assoSlug={assoSlug}
          reportId={reportId}
          completion={context.completion}
          editable={context.editable}
        />
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}
