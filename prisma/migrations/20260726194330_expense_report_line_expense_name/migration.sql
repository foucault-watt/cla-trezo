-- AlterTable
ALTER TABLE "expense_report_line" ADD COLUMN     "expense_name" TEXT;

-- Backfill des lignes existantes (pré-datant ce champ) avec le meilleur nom
-- disponible, avant de rendre la colonne obligatoire.
UPDATE "expense_report_line" AS line
SET "expense_name" = COALESCE(
  line."custom_label",
  (SELECT td."label" FROM "type_depense" td WHERE td."id" = line."type_depense_id"),
  'Dépense'
)
WHERE line."expense_name" IS NULL;

-- AlterTable
ALTER TABLE "expense_report_line" ALTER COLUMN "expense_name" SET NOT NULL;
