# PDF Lab

Ce dossier définit le workflow utilisé pour reproduire des PDF avec `@react-pdf/renderer`. Le principe est simple : les références entrent dans `inbox`, le code généré vit dans `templates`, les PDF finaux vont dans `output/pdf` et les images de contrôle restent temporaires.

## Structure

```text
pdf-lab/
├── inbox/
│   └── <slug>/
│       ├── reference.pdf
│       ├── page-1.png
│       └── page-2.png
├── templates/
│   └── <slug>/
│       ├── assets/
│       ├── document.tsx
│       ├── fixture.ts
│       ├── schema.ts
│       ├── schema.test.ts
│       ├── types.ts
│       └── README.md
├── registry.tsx
├── render.tsx
└── preview.ts

output/pdf/<slug>.pdf
tmp/pdfs/<slug>/page-1.png
```

Un `slug` est un identifiant court en minuscules, sans espaces ni accents, par exemple `ndf-fn-sb` ou `attestation-subvention`.

## Ajouter une référence

1. Créer `pdf-lab/inbox/<slug>/`.
2. Y déposer le PDF original sous le nom `reference.pdf`.
3. Ajouter les captures disponibles : `page-1.png`, `page-2.png`, etc.
4. Ne jamais modifier ces fichiers pendant l’implémentation. Ils constituent la source de vérité visuelle.

Le PDF est prioritaire pour les dimensions, les polices, le texte, les images embarquées et les coordonnées. Les captures servent à comprendre l’aspect attendu et les éventuelles annotations visibles dans le fichier source.

## Demander la création à l'ia

Exemple de demande :

> Analyse `pdf-lab/inbox/attestation-subvention`. Crée un template React PDF réutilisable dans `pdf-lab/templates/attestation-subvention`, ajoute-le au registre, rends tous les champs et tableaux dynamiques, puis itère jusqu’à obtenir un rendu fidèle. Ne branche rien en production sans me le demander.

L'ia doit alors :

1. inspecter toutes les pages du PDF et toutes les captures ;
2. relever le format, les marges, les polices, les couleurs et les assets ;
3. séparer strictement les données (`types.ts`, `schema.ts`, `fixture.ts`) de la présentation (`document.tsx`) ;
4. permettre aux tableaux de contenir zéro, une ou plusieurs lignes sans chevauchement ;
5. gérer les retours à la ligne, les sauts de page et les textes longs ;
6. enregistrer le template dans `registry.tsx` ;
7. générer le PDF final et effectuer une comparaison visuelle page par page ;
8. laisser les PNG de contrôle dans `tmp/pdfs`, jamais dans les livrables.

## Contrat d’un template

Chaque dossier dans `templates` contient au minimum :

- `document.tsx` : composant React PDF sans accès direct à la base de données ;
- `types.ts` : type complet des données attendues ;
- `schema.ts` : validation Zod utilisée par les routes serveur ;
- `fixture.ts` : exemple représentatif et directement générable ;
- `schema.test.ts` : cas nominal, données invalides et collections dynamiques ;
- `assets/` : polices, logos et images nécessaires ;
- `README.md` : particularités du modèle et emplacement de sa référence.

Le composant reçoit toutes ses données par props. Il ne lit ni Prisma, ni une session, ni des variables de formulaire. Cette séparation permet de l’utiliser depuis un script, une route Next.js, un job ou une interface admin.

## Commandes

Générer un PDF à partir de la fixture :

```powershell
npm run pdf:render -- ndf-fn-sb
```

Résultat : `output/pdf/ndf-fn-sb.pdf`.

Générer le PDF et ses PNG temporaires de comparaison :

```powershell
npm run pdf:preview -- ndf-fn-sb
```

Résultat des contrôles : `tmp/pdfs/ndf-fn-sb/page-1.png`, etc. `pdftoppm` doit être disponible ; son chemin peut être fourni avec `PDFTOPPM_PATH`.

## Définition de « terminé »

Un template est prêt lorsque :

- le PDF s’ouvre sans erreur et possède le bon format de page ;
- toutes les pages ont été inspectées visuellement ;
- aucun texte n’est coupé, aucun élément ne se chevauche et aucun glyphe ne manque ;
- les en-têtes, pieds de page et numéros de page sont cohérents ;
- les listes et tableaux ont été testés avec 0, 1 et beaucoup de lignes ;
- les textes longs et les caractères français ont été testés ;
- le schéma, le typage, le lint, les tests et le build passent ;
- le PDF final est le seul livrable conservé dans `output/pdf`.

## Intégration dans l’application

La création d’un template et son branchement au produit sont deux étapes distinctes. Par défaut, le travail reste dans PDF Lab. Une route ou une interface admin ne doit être ajoutée que lorsqu’elle est explicitement demandée.

Les templates `ndf-fn-sb`, `ndf-solde`, `financement` et `convention`
possèdent un atelier admin de développement à
`/app/admin/developpement/pdf-lab`. Un onglet par template permet de tester
leurs champs et collections dynamiques, puis de télécharger le rendu côté
serveur sans enregistrer les données.
