# Scripts de seed manuels

## Deux catégories bien distinctes

- **`prisma/seed.ts`** — le seed Prisma "officiel", déclaré dans
  `prisma.config.ts` (`migrations.seed`). Contenu minimal et permanent :
  uniquement des données de référence sûres à recréer partout, y compris en
  prod (ex: `TypeDepense` par défaut). Ne jamais y mettre de données
  fictives (clubs, mouvements, users de test).
- **`scripts/seed-*.ts`** — scripts de seed manuels, jetables, pour peupler
  des données de démo/test à volume réaliste (ex: `seed-mots-dits.ts` pour
  tester l'UI de l'historique du Solde avec ~50 mouvements). Jamais
  branchés à `prisma db seed`, jamais exécutés automatiquement par
  `npm run dev`/`build`/`postinstall`.

## Règle pour tout nouveau `scripts/seed-*.ts`

Ces scripts font des écritures destructrices (suppression + recréation) sur
de vraies données. Ils doivent systématiquement :

1. **Être gardés par `ALLOW_DEV_SEED=true`** — vérifier cette variable
   d'environnement en tout début de script et `process.exit(1)` avec un
   message clair si elle n'est pas définie à `"true"`. Voir
   `scripts/seed-mots-dits.ts` pour le pattern exact à copier.
2. **Ne toucher qu'à leurs propres données** — filtrer les suppressions sur
   un identifiant sans ambiguïté (ex: `slug` d'un club de test dédié), jamais
   un `deleteMany` non filtré.
3. **Être ré-exécutables sans accumulation** — supprimer leurs propres
   données avant de les recréer, pour pouvoir relancer le script plusieurs
   fois sans polluer la base de doublons.
4. **Documenter l'usage en tête de fichier** (commande `npx tsx
   scripts/...`, ce que le script crée, pourquoi).

`ALLOW_DEV_SEED` doit être définie à `"true"` dans `.env` (dev local), et ne
doit **jamais** l'être dans un environnement de production — c'est le seul
mécanisme d'activation/désactivation, il n'y en a pas d'autre (pas de flag
CLI, pas de config séparée).
