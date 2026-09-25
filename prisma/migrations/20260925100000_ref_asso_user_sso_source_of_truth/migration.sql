-- Le SSO CLA fait foi pour les rôles : plus d'historique (cf. lib/auth/cla-sync-plan.ts).
DELETE FROM "ref_asso_user" WHERE "is_active" = false;

-- Une seule ligne par couple User × Structure : on garde la plus récente.
DELETE FROM "ref_asso_user" AS older
USING "ref_asso_user" AS newer
WHERE older."user_id" = newer."user_id"
  AND older."asso_id" = newer."asso_id"
  AND (older."created_at", older."id") < (newer."created_at", newer."id");

-- AlterTable
ALTER TABLE "ref_asso_user" DROP COLUMN "ended_at",
DROP COLUMN "is_active";

-- CreateIndex
CREATE UNIQUE INDEX "ref_asso_user_user_id_asso_id_key" ON "ref_asso_user"("user_id", "asso_id");
