-- CreateEnum
CREATE TYPE "AssoType" AS ENUM ('CLUB', 'COMMISSION', 'ASSOCIATION_1901');

-- CreateEnum
CREATE TYPE "AssoStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExpenseReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'TAKEN_OVER', 'FINALIZED');

-- CreateEnum
CREATE TYPE "FundingSourceType" AS ENUM ('CLUB_BALANCE', 'SUBVENTION');

-- CreateEnum
CREATE TYPE "SupportingDocumentType" AS ENUM ('RECEIPT', 'HONOR_STATEMENT');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asso" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AssoStatus" NOT NULL,
    "type" "AssoType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ref_asso_user" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "asso_id" UUID NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "ref_asso_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "connected_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subvention" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "subvention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subvention_asso" (
    "id" UUID NOT NULL,
    "subvention_id" UUID NOT NULL,
    "asso_id" UUID NOT NULL,
    "commentary" TEXT,

    CONSTRAINT "subvention_asso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subvention_asso_line" (
    "id" UUID NOT NULL,
    "subvention_asso_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "subvention_asso_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_report" (
    "id" UUID NOT NULL,
    "asso_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExpenseReportStatus" NOT NULL,
    "taken_by_admin_id" UUID,
    "taken_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),
    "final_pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_report_line" (
    "id" UUID NOT NULL,
    "expense_report_id" UUID NOT NULL,
    "beneficiary_firstname" TEXT NOT NULL,
    "beneficiary_lastname" TEXT NOT NULL,
    "iban" TEXT,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "funding_source" "FundingSourceType" NOT NULL,
    "subvention_asso_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_report_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporting_document" (
    "id" UUID NOT NULL,
    "expense_report_id" UUID NOT NULL,
    "type" "SupportingDocumentType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supporting_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asso_slug_key" ON "asso"("slug");

-- AddForeignKey
ALTER TABLE "ref_asso_user" ADD CONSTRAINT "ref_asso_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ref_asso_user" ADD CONSTRAINT "ref_asso_user_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_log" ADD CONSTRAINT "user_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subvention_asso" ADD CONSTRAINT "subvention_asso_subvention_id_fkey" FOREIGN KEY ("subvention_id") REFERENCES "subvention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subvention_asso" ADD CONSTRAINT "subvention_asso_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subvention_asso_line" ADD CONSTRAINT "subvention_asso_line_subvention_asso_id_fkey" FOREIGN KEY ("subvention_asso_id") REFERENCES "subvention_asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report" ADD CONSTRAINT "expense_report_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report" ADD CONSTRAINT "expense_report_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report" ADD CONSTRAINT "expense_report_taken_by_admin_id_fkey" FOREIGN KEY ("taken_by_admin_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report_line" ADD CONSTRAINT "expense_report_line_expense_report_id_fkey" FOREIGN KEY ("expense_report_id") REFERENCES "expense_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_report_line" ADD CONSTRAINT "expense_report_line_subvention_asso_id_fkey" FOREIGN KEY ("subvention_asso_id") REFERENCES "subvention_asso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supporting_document" ADD CONSTRAINT "supporting_document_expense_report_id_fkey" FOREIGN KEY ("expense_report_id") REFERENCES "expense_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
