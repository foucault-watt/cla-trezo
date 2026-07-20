# 06 — Création/édition d'une Note de frais (Brouillon)

**What to build:** Une Structure crée une Note de frais au statut Brouillon : titre/description, Justificatifs (PDF/image) ou Attestation sur l'honneur (exclusifs l'un de l'autre au niveau de la note entière), et une ou plusieurs Lignes de note de frais (bénéficiaire : prénom/nom/IBAN/montant, Type de dépense, source de financement unique). Pas de soumission ni de Warnings dans ce ticket.

**Blocked by:** 02, 05

**Status:** ready-for-agent

- [ ] Une Structure crée une Note de frais en statut Brouillon avec titre/description
- [ ] Une Structure ajoute un ou plusieurs Justificatifs, ou une Attestation sur l'honneur — jamais les deux dans la même note
- [ ] Une Structure ajoute une Ligne avec bénéficiaire (prénom, nom, IBAN, montant) et Type de dépense
- [ ] Un membre de Club peut choisir le Solde ou une Subvention Publiée comme source d'une Ligne
- [ ] Un membre de Commission ou d'Association loi 1901 ne peut choisir qu'une Subvention Publiée comme source
- [ ] Une même personne peut apparaître sur plusieurs Lignes de la même note
- [ ] La note reste modifiable en statut Brouillon
- [ ] Tests au niveau Server Action couvrant : création, exclusivité Justificatif/Attestation, restriction de source par type de Structure
