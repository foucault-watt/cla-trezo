/*
  Warnings:

  - You are about to drop the column `final_pdf_path` on the `expense_report` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "convention_pdf_settings" ADD COLUMN     "cla_treasurer_name" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "expense_report" DROP COLUMN "final_pdf_path";

-- CreateTable
CREATE TABLE "expense_report_pdf" (
    "id" UUID NOT NULL,
    "expense_report_id" UUID NOT NULL,
    "funding_source" "FundingSourceType" NOT NULL,
    "subvention_id" UUID,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_report_pdf_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expense_report_pdf" ADD CONSTRAINT "expense_report_pdf_expense_report_id_fkey" FOREIGN KEY ("expense_report_id") REFERENCES "expense_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report_pdf" ADD CONSTRAINT "expense_report_pdf_subvention_id_fkey" FOREIGN KEY ("subvention_id") REFERENCES "subvention"("id") ON DELETE SET NULL ON UPDATE CASCADE;
