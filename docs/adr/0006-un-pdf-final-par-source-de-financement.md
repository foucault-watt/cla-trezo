# Une Note de frais génère un PDF final par source de financement, pas un PDF unique

Une Note de frais peut mélanger Solde et une ou plusieurs Subventions entre ses Remboursements. Plutôt que produire un unique PDF combinant toutes les sources, la validation génère un PDF final distinct par source : un par Subvention concernée (regroupant les Remboursements qu'elle finance), plus un pour le Solde si des Remboursements en dépendent. Ce choix réutilise les templates PDF existants — un par source — plutôt que de construire un template combiné inédit.

Les chemins des PDF générés sont stockés dans une nouvelle table `ExpenseReportPdf` (un enregistrement par PDF, lié à la Note et, le cas échéant, à la Subvention concernée — absence de lien signifiant le PDF du Solde). Le champ `ExpenseReport.finalPdfPath`, singulier, devient obsolète.
