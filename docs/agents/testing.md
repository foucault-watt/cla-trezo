# Tests

## Outil

Vitest. Pas de Jest, pas de RTL/jsdom pour l'instant — l'environnement est `node`
(voir `vitest.config.ts`), on ne teste pas de composants React ici, seulement de
la logique.

```bash
npm test              # watch mode, relance à chaque sauvegarde
npm test -- --run     # une seule passe, tous les tests
npx vitest run path/to/file.test.ts   # un seul fichier
```

## Quand écrire un test

Dès qu'une fonctionnalité touche une règle métier décrite dans `CONTEXT.md` ou
une ADR (`docs/adr/`) — calcul de Solde, statuts d'une Note de frais,
ventilation Subvention/Affectation, verrouillage, immutabilité, etc. Ces
règles sont denses et pleines de cas limites ; un test qui les fixe évite
qu'une régression future les casse silencieusement.

Pas besoin de test pour du code qui ne fait que déplacer des données (props
qui descendent, wiring de composants, formatage d'affichage) sauf s'il y a une
vraie règle métier dedans.

## Où et comment

Fichier `*.test.ts` colocalisé à côté du fichier testé :

```
lib/auth/cla.ts
lib/auth/cla.test.ts
```

Cible la logique pure d'abord (fonctions, schémas Zod, transitions d'état) —
pas la couche Prisma/DB, qui demande un vrai test d'intégration (hors scope
pour l'instant). Si une fonction mélange logique pure et accès DB, envisager
de sortir la partie pure dans une fonction séparée testable — mais ne pas
forcer ce découpage si la fonction reste simple.

Voir `lib/auth/cla.test.ts` pour un exemple : mock de `fetch` via
`vi.stubGlobal`, cas valide + cas d'erreur (HTTP non-ok, payload invalide).

## Après avoir écrit ou modifié un test

Toujours lancer `npm test -- --run` pour vérifier que la suite passe avant de
considérer une fonctionnalité terminée.
