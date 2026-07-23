/*
  Warnings:

  - You are about to drop the column `category` on the `expense_report_line` table. All the data in the column will be lost.
  - Added the required column `type` to the `subvention_campaign` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubventionType" AS ENUM ('CA_BUDGET', 'CA_EVENT', 'CA_EXCEPTIONNEL');

-- AlterTable
ALTER TABLE "expense_report_line" DROP COLUMN "category",
ADD COLUMN     "custom_label" TEXT,
ADD COLUMN     "type_depense_id" UUID;

-- AlterTable
ALTER TABLE "subvention_campaign" ADD COLUMN     "type" "SubventionType" NOT NULL;

-- CreateTable
CREATE TABLE "type_depense" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "type_depense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "type_depense_label_key" ON "type_depense"("label");

-- AddForeignKey
ALTER TABLE "expense_report_line" ADD CONSTRAINT "expense_report_line_type_depense_id_fkey" FOREIGN KEY ("type_depense_id") REFERENCES "type_depense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
