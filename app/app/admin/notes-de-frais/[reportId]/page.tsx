import { redirect } from "next/navigation";

export default async function AdminExpenseReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  redirect(`/app/admin/notes-de-frais/${reportId}/remboursements`);
}
