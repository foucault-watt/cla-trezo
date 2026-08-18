# Template `ndf-fn-sb`

Première implémentation du workflow décrit dans [`pdf-lab/README.md`](../../README.md).

## Référence

- PDF : `pdf-lab/inbox/ndf-fn-sb/reference.pdf`
- Captures : `page-1.png` et `page-2.png`

Le dossier `inbox` est une source de comparaison. Le code ne doit jamais modifier ces fichiers.

## Contenu

- `document.tsx` : présentation React PDF et pagination dynamique
- `types.ts` : contrat de données TypeScript
- `schema.ts` : validation Zod de l’export serveur
- `fixture.ts` : données de démonstration
- `schema.test.ts` : tests du contrat et des tableaux variables
- `assets/` : logo et polices nécessaires au rendu

## Commandes

```powershell
npm run pdf:render -- ndf-fn-sb
npm run pdf:preview -- ndf-fn-sb
```

La première commande écrit `output/pdf/ndf-fn-sb.pdf`. La seconde régénère le PDF puis place les aperçus temporaires dans `tmp/pdfs/ndf-fn-sb/`.

## Intégration de développement

L’éditeur est disponible dans l’administration à `/app/admin/developpement/pdf-lab`. Il permet de modifier toutes les valeurs, d’ajouter ou supprimer des lignes et de télécharger le PDF sans enregistrer les données.
