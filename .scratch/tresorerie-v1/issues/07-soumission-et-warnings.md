# 07 — Soumission + Warnings

**What to build:** Une Structure soumet sa Note de frais (Brouillon → Soumise). À la création des Lignes et à la soumission, les trois Warnings métier sont calculés et affichés (jamais bloquants) : Solde négatif, dépassement de Subvention, Subvention ancienne (plus d'un an après sa date de fin). La note reste modifiable en statut Soumise tant que l'Admin n'a pas commencé à la traiter.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Une Structure soumet une Note de frais Brouillon, qui passe au statut Soumise
- [ ] Un Warning "Solde négatif" apparaît quand une Ligne financée par le Solde crée ou aggrave un solde négatif, sans bloquer la soumission
- [ ] Un Warning "dépassement de Subvention" apparaît quand une Ligne financée par une Subvention dépasse son montant restant, sans bloquer la soumission
- [ ] Un Warning "Subvention ancienne" apparaît quand une Ligne utilise une Subvention dont la date de fin dépasse un an, sans bloquer la soumission
- [ ] Une Structure peut encore modifier sa note en statut Soumise tant que l'Admin n'a pas commencé à la traiter
- [ ] Tests au niveau Server Action couvrant chacun des trois Warnings (déclenché et non déclenché) et la non-blocage de la soumission
