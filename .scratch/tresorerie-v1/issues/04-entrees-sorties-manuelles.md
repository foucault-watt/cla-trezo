# 04 — Entrées/Sorties manuelles (Admin)

**What to build:** L'Admin crée une Entrée manuelle ou une Sortie manuelle sur le Solde d'un Club. Le Solde et son historique (ticket 03) reflètent immédiatement le mouvement.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] L'Admin peut créer une Entrée manuelle pour un Club, augmentant son Solde du montant saisi
- [ ] L'Admin peut créer une Sortie manuelle pour un Club, diminuant son Solde du montant saisi
- [ ] Une Sortie manuelle ne peut jamais être liée à une Subvention (le champ/l'option n'existe pas ou est rejeté)
- [ ] Toute tentative de créer un mouvement manuel pour une Commission ou une Association loi 1901 est rejetée
- [ ] Tests au niveau Server Action couvrant : entrée, sortie, rejet sortie+subvention, rejet pour Commission/Association
