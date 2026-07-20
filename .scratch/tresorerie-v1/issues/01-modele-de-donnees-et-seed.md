# 01 — Modèle de données & seed

**What to build:** Le schema Prisma complet pour le domaine métier de la V1 : Structure (avec discriminant Club/Commission/Association loi 1901), Solde et MouvementSolde (Entrée/Sortie manuelle), Subvention et Affectation, NoteDeFrais et LigneNoteDeFrais, Justificatif, Type de dépense (table seedée, extensible), Type de subvention (enum fixe : CA_BUDGET, CA_EVENT, CA_EXCEPTIONNEL — cf. ADR-0004), et User avec un rôle (Structure ou Admin). Migration appliquée sur une base Postgres, script de seed pour les Types de dépense par défaut (nourriture, transport, matériel, événement, communication, autre).

**Blocked by:** Aucun — peut démarrer immédiatement

**Status:** ready-for-agent

- [ ] Le schema Prisma reflète le vocabulaire de `CONTEXT.md` (noms de modèles/champs alignés sur Structure, Solde, Subvention, Affectation, etc.)
- [ ] `Structure` distingue Club/Commission/Association loi 1901 (un Club a un Solde, les deux autres n'en ont pas)
- [ ] `Subvention` a un Type de subvention (enum fixe) et une ou plusieurs `Affectation` dont la somme égale le montant total
- [ ] `Type de dépense` est une table avec des valeurs seedées, pas un enum
- [ ] `MouvementSolde` distingue Entrée manuelle et Sortie manuelle, et une Sortie manuelle ne peut jamais référencer une Subvention
- [ ] Un test (appel direct à Prisma, base de test réelle) vérifie que le seed des Types de dépense est bien accessible en base après migration
