# Template `financement`

Implémentation du workflow décrit dans [`pdf-lab/README.md`](../../README.md).

## Référence

- PDF : `pdf-lab/inbox/financement/CA_EVENT_CLIC_SIGNE.pdf`
- Capture : `Page-1.png`

Le dossier `inbox` est une source de comparaison. Le code ne doit jamais
modifier ces fichiers. La référence est un exemplaire signé (association
CLIC) ; les signatures manuscrites ne sont pas reproduites, seuls les noms
des signataires sont rendus en texte, comme sur les autres templates de
notes de frais.

C'est l'« ordre de financement » envoyé à une association suite à
l'attribution d'une subvention par le Conseil d'Administration. Il réutilise
le même en-tête, pied de page, logo et polices que
[`ndf-fn-sb`](../ndf-fn-sb/README.md) et [`ndf-solde`](../ndf-solde/README.md).

## Contenu

- `document.tsx` : présentation React PDF et pagination dynamique
- `types.ts` : contrat de données TypeScript
- `schema.ts` : validation Zod de l’export serveur
- `fixture.ts` : données de démonstration (reprend l’exemple CLIC de la
  référence)
- `schema.test.ts` : tests du contrat et du tableau de dépenses variable
- `assets/` : logo et polices nécessaires au rendu

## Commandes

```powershell
npm run pdf:render -- financement
npm run pdf:preview -- financement
```

La première commande écrit `output/pdf/financement.pdf`. La seconde régénère
le PDF puis place les aperçus temporaires dans `tmp/pdfs/financement/`.

## Intégration de développement

L’éditeur est disponible dans l’administration à
`/app/admin/developpement/pdf-lab`. Il permet de modifier toutes les
valeurs, d’ajouter ou supprimer des lignes et de télécharger le PDF sans
enregistrer les données.
