-- Une Note de frais possède désormais un bénéficiaire unique. Les anciennes
-- colonnes des lignes sont conservées pour relire l'historique multi-personnes.
ALTER TABLE "expense_report"
ADD COLUMN "beneficiary_user_id" UUID,
ADD COLUMN "beneficiary_firstname" TEXT,
ADD COLUMN "beneficiary_lastname" TEXT,
ADD COLUMN "beneficiary_iban" TEXT;

ALTER TABLE "expense_report_line"
ADD COLUMN "expense_date" DATE;

ALTER TABLE "expense_report"
ADD CONSTRAINT "expense_report_beneficiary_user_id_fkey"
FOREIGN KEY ("beneficiary_user_id") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill seulement quand l'ancien modèle désigne sans ambiguïté une seule
-- personne et un seul IBAN. Les anciennes notes multi-bénéficiaires restent
-- volontairement sans bénéficiaire canonique et seront affichées en legacy.
WITH homogeneous AS (
  SELECT
    "expense_report_id",
    MIN("beneficiary_firstname") AS "firstname",
    MIN("beneficiary_lastname") AS "lastname",
    MIN("iban") AS "iban"
  FROM "expense_report_line"
  GROUP BY "expense_report_id"
  HAVING COUNT(DISTINCT (LOWER(TRIM("beneficiary_firstname")), LOWER(TRIM("beneficiary_lastname")))) = 1
     AND COUNT(DISTINCT "iban") <= 1
)
UPDATE "expense_report" AS report
SET
  "beneficiary_firstname" = homogeneous."firstname",
  "beneficiary_lastname" = homogeneous."lastname",
  "beneficiary_iban" = homogeneous."iban"
FROM homogeneous
WHERE report."id" = homogeneous."expense_report_id";
