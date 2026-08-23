-- Le multi-bénéficiaire (un bénéficiaire différent par Ligne) est abandonné :
-- toute Note de frais a désormais un bénéficiaire unique porté par
-- expense_report (cf. migration 20260821123000). Les colonnes ci-dessous
-- n'étaient qu'une duplication de cette information au niveau de la Ligne et
-- ne sont plus lues nulle part dans l'application.
ALTER TABLE "expense_report_line"
DROP COLUMN "beneficiary_firstname",
DROP COLUMN "beneficiary_lastname",
DROP COLUMN "iban";
