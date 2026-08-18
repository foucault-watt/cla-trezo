import { TriangleAlert } from "lucide-react";
import { fundingSourceDetail } from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import type { ExpenseReportLineDetail } from "@/lib/expense-reports/expense-report-detail-mapping";

export function AdminLigneRow({
  line,
  showBeneficiaryColumn = true,
}: {
  line: ExpenseReportLineDetail;
  showBeneficiaryColumn?: boolean;
}) {
  return (
    <tr>
      {showBeneficiaryColumn && (
        <td>
          {line.beneficiaryFirstname} {line.beneficiaryLastname}
        </td>
      )}
      <td>{line.iban ?? "—"}</td>
      <td>{line.expenseName}</td>
      <td>{line.typeDepenseLabel ?? line.customLabel}</td>
      <td>{formatCents(line.amountCents)}</td>
      <td>
        <div className="flex items-center gap-1.5">
          <span>{fundingSourceDetail(line)}</span>
          {line.warnings.length > 0 && (
            <div
              className="tooltip tooltip-warning"
              data-tip={line.warnings.join(" ")}
            >
              <TriangleAlert
                className="size-4 shrink-0 text-warning"
                aria-label={line.warnings.join(" ")}
              />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
