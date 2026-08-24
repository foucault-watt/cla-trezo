# Template `ndf-solde`

Implémentation du workflow décrit dans [`pdf-lab/README.md`](../../README.md).

## Référence

- PDF : `pdf-lab/inbox/ndf-solde/Template Note de Frais.pdf`
- Capture : `Image-1.png`

Le dossier `inbox` est une source de comparaison. Le code ne doit jamais modifier ces fichiers.

C'est la note de frais « solde » : une seule liste de frais à rembourser, sans
tableau de subvention accordée ni de frais déjà remboursés. Elle réutilise le
même en-tête, pied de page, logo et polices que [`ndf-fn-sb`](../ndf-fn-sb/README.md),
qui partagent la même lettre à en-tête de Centrale Lille Associations.

## Contenu

- `document.tsx` : présentation React PDF et pagination dynamique
- `types.ts` : contrat de données TypeScript
- `schema.ts` : validation Zod de l’export serveur
- `fixture.ts` : données de démonstration
- `schema.test.ts` : tests du contrat et du tableau de dépenses variable
- `assets/` : logo et polices nécessaires au rendu

## Commandes

```powershell
npm run pdf:render -- ndf-solde
npm run pdf:preview -- ndf-solde
```

La première commande écrit `output/pdf/ndf-solde.pdf`. La seconde régénère le PDF puis place les aperçus temporaires dans `tmp/pdfs/ndf-solde/`.

## Intégration de développement

L’éditeur est disponible dans l’administration à `/app/admin/developpement/pdf-lab`. Il permet de modifier toutes les valeurs, d’ajouter ou supprimer des lignes et de télécharger le PDF sans enregistrer les données.
