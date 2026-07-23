-- AlterTable
ALTER TABLE "expense_report" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "ref_asso_user" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ended_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "subvention_campaign" ADD COLUMN     "publication_date" TIMESTAMP(3);
