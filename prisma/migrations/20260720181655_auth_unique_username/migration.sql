-- AlterTable
ALTER TABLE "ref_asso_user" DROP CONSTRAINT "ref_asso_user_user_id_fkey";
ALTER TABLE "ref_asso_user" DROP CONSTRAINT "ref_asso_user_asso_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ref_asso_user_user_id_asso_id_key" ON "ref_asso_user"("user_id", "asso_id");

-- AddForeignKey
ALTER TABLE "ref_asso_user" ADD CONSTRAINT "ref_asso_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ref_asso_user" ADD CONSTRAINT "ref_asso_user_asso_id_fkey" FOREIGN KEY ("asso_id") REFERENCES "asso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
