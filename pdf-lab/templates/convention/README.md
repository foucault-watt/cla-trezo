# Template `convention`

Reproduction réutilisable de la convention de subvention fournie dans PDF Lab.

## Référence

- PDF : `pdf-lab/inbox/convention/reference.pdf`
- Captures : `page-1.png` à `page-4.png`

Le dossier `inbox` reste immuable. Seul le logo institutionnel a été extrait de la
référence et placé dans `assets/`; les signatures manuscrites ne sont pas reprises.

## Données dynamiques

Le composant reçoit par props la période, l'association bénéficiaire, ses
représentants et leurs fonctions, la liste variable des dépenses, le montant total
et les informations textuelles de signature. Les clauses
juridiques et l'identité institutionnelle de CLA appartiennent au modèle.
Le nom, la fonction et la ville du signataire peuvent rester vides afin de
conserver une zone de signature bénéficiaire à compléter sur papier.

## Commandes

```powershell
npm run pdf:render -- convention
npm run pdf:preview -- convention
```

Le PDF final est écrit dans `output/pdf/convention.pdf`; les PNG de contrôle sont
conservés uniquement dans `tmp/pdfs/convention/`.

## Intégration de développement

L'onglet « Convention de subvention » de
`/app/admin/developpement/pdf-lab` permet de modifier la fixture, d'ajouter ou
supprimer des représentants et des dépenses, puis de télécharger le PDF. Les
données saisies ne sont pas enregistrées.
