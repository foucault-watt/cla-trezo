# 09 — Validation → PDF → mise à jour Solde/Subvention → suppression IBAN

**What to build:** L'Admin valide définitivement une Note de frais Prise en charge, malgré d'éventuels Warnings actifs. Cette validation déclenche, dans une seule transaction : la génération du PDF final (template existant, à récupérer auprès de l'utilisateur pendant ce ticket), la mise à jour du Solde du Club pour les Lignes financées par le Solde, la mise à jour du montant utilisé de chaque Subvention concernée, la suppression des IBAN de la base applicative (ADR-0002), et le passage au statut Validée avec immutabilité totale (ADR-0003).

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] L'Admin peut valider une note malgré un Warning actif
- [ ] La validation génère un PDF final incluant les IBAN des bénéficiaires
- [ ] Le Solde du Club est mis à jour pour chaque Ligne financée par le Solde
- [ ] Le montant utilisé de chaque Subvention concernée est mis à jour pour chaque Ligne financée par elle
- [ ] Les IBAN sont supprimés de la base applicative immédiatement après génération du PDF
- [ ] La note passe au statut Validée et toute tentative de modification ultérieure (Admin compris) est rejetée
- [ ] Toutes ces opérations sont atomiques (une transaction unique) — en cas d'échec, aucune ne s'applique
- [ ] Tests au niveau Server Action couvrant : validation nominale, immutabilité post-validation, absence d'IBAN en base après validation, mise à jour correcte Solde/Subvention
