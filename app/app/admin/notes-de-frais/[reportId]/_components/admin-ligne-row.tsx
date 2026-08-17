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
      <td>{fundingSourceDetail(line)}</td>
    </tr>
  );
}
