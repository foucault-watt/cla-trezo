/*
  Warnings:

  - You are about to drop the column `amount` on the `expense_report_line` table. All the data in the column will be lost.
  - You are about to drop the column `subvention_asso_id` on the `expense_report_line` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `subvention` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `subvention` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `subvention` table. All the data in the column will be lost.
  - You are about to drop the `subvention_asso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subvention_asso_line` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount_cents` to the `expense_report_line` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount_cents` to the `subvention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `asso_id` to the `subvention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaign_id` to the `subvention` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `subvention` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FinancialMovementType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('CLUB_BALANCE', 'SUBVENTION');

-- CreateEnum
CREATE TYPE "FinancialMovementOrigin" AS ENUM ('MANUAL', 'EXPENSE_REPORT');

-- AlterEnum
ALTER TYPE "ExpenseReportStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "expense_report_line" DROP CONSTRAINT "expense_report_line_subvention_asso_id_fkey";

-- DropForeignKey
ALTER TABLE "subvention_asso" DROP CONSTRAINT "subvention_asso_asso_id_fkey";

-- DropForeignKey
ALTER TABLE "subvention_asso" DROP CONSTRAINT "subvention_asso_subvention_id_fkey";

-- DropForeignKey
ALTER TABLE "subvention_asso_line" DROP CONSTRAINT "subvention_asso_line_subvention_asso_id_fkey";

-- DropIndex
DROP INDEX "ref_asso_user_user_id_asso_id_key";

-- AlterTable
ALTER TABLE "asso" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "expense_report" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "expense_report_line" DROP COLUMN "amount",
DROP COLUMN "subvention_asso_id",
ADD COLUMN     "amount_cents" INTEGER NOT NULL,
ADD COLUMN     "subvention_id" UUID,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "subvention" DROP COLUMN "date",
DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "amount_cents" INTEGER NOT NULL,
ADD COLUMN     "asso_id" UUID NOT NULL,
ADD COLUMN     "campaign_id" UUID NOT NULL,
ADD COLUMN     "commentary" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "supporting_document" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_log" ALTER COLUMN "connected_at" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "subvention_asso";

-- DropTable
DROP TABLE "subvention_asso_line";

-- CreateTable
CREATE TABLE "subvention_campaign" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subvention_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_movement" (
    "id" UUID NOT NULL,
    "asso_id" UUID NOT NULL,
    "movement_type" "FinancialMovementType" NOT NULL,
    "account_type" "FinancialAccountType" NOT NULL,
    "origin" "FinancialMovementOrigin" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "subvention_id" UUID,
    "expense_report_line_id" UUID,
    "created_by" UUID NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_movement_expense_report_line_id_key" ON "financial_movement"("expense_report_line_id");

-- AddForeignKey
ALTER TABLE "subvention" ADD CONSTRAINT "subvention_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "subvention_campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subvention" ADD CONSTRAINT "subvention_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report_line" ADD CONSTRAINT "expense_report_line_subvention_id_fkey" FOREIGN KEY ("subvention_id") REFERENCES "subvention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_movement" ADD CONSTRAINT "financial_movement_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_movement" ADD CONSTRAINT "financial_movement_subvention_id_fkey" FOREIGN KEY ("subvention_id") REFERENCES "subvention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_movement" ADD CONSTRAINT "financial_movement_expense_report_line_id_fkey" FOREIGN KEY ("expense_report_line_id") REFERENCES "expense_report_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_movement" ADD CONSTRAINT "financial_movement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
