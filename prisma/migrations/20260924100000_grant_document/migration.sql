-- CreateEnum
CREATE TYPE "GrantDocumentKind" AS ENUM ('CONVENTION', 'ORDRE_DE_FINANCEMENT');

-- AlterTable
ALTER TABLE "subvention" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;


-- CreateTable
CREATE TABLE "grant_document" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "asso_id" UUID NOT NULL,
    "kind" "GrantDocumentKind" NOT NULL,
    "file_path" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "subvention_count" INTEGER NOT NULL,

    CONSTRAINT "grant_document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grant_document_campaign_id_asso_id_key" ON "grant_document"("campaign_id", "asso_id");

-- AddForeignKey
ALTER TABLE "grant_document" ADD CONSTRAINT "grant_document_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "subvention_campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_document" ADD CONSTRAINT "grant_document_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
