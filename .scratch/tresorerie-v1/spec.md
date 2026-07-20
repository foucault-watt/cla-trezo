Status: ready-for-agent

# Application de trésorerie CLA — V1

## Problem Statement

Centrale Lille Associations (CLA) gère trois types de Structures aux fonctionnements financiers différents (Club, Commission, Association loi 1901), et doit suivre à la main les notes de frais, les justificatifs, les soldes de club et les subventions accordées. Aujourd'hui ce suivi n'est pas centralisé : pas d'outil unique pour créer une demande de remboursement, savoir combien de subvention il reste à consommer, ou savoir combien un club a en solde. L'Admin (trésorier) doit tout recouper manuellement, et les Structures n'ont pas de visibilité en temps réel sur leur situation financière.

## Solution

Une application web où chaque Structure peut créer des Notes de frais avec leurs Justificatifs, en choisissant pour chaque Ligne de note de frais si elle est financée par le Solde (Club uniquement) ou par une Subvention. L'Admin consulte, corrige si besoin, puis valide définitivement — ce qui génère un PDF officiel, met à jour le Solde et les Subventions concernées, et supprime les IBAN de l'application. Chaque Structure peut à tout moment consulter son Solde (si Club) et ses Subventions restantes.

La V1 couvre le cœur du processus (notes de frais → validation → PDF → mise à jour des soldes/subventions). L'import Excel des subventions, la génération automatique des Conventions, le dashboard admin complet et les notifications sont hors scope (V2, voir Out of Scope).

## User Stories

### Authentification et rôles

1. En tant que membre d'une Structure, je veux me connecter à l'application, afin d'accéder à l'espace de ma Structure.
2. En tant qu'Admin, je veux me connecter à l'application, afin d'accéder à l'espace d'administration.
3. En tant que membre d'une Structure, je veux ne voir que les données de ma propre Structure, afin de ne pas accéder aux informations d'autres Structures.
4. En tant qu'Admin, je veux accéder aux données de toutes les Structures, afin de pouvoir les gérer.

### Consultation du Solde (Club)

5. En tant que membre d'un Club, je veux voir mon Solde actuel, afin de savoir combien d'argent le club a chez CLA.
6. En tant que membre d'un Club, je veux voir l'historique des Entrées manuelles et Sorties manuelles de mon Solde, afin de comprendre son évolution.
7. En tant que membre d'une Commission ou d'une Association loi 1901, je ne dois pas voir de Solde, puisque ce concept ne s'applique pas à ma Structure.

### Consultation des Subventions

8. En tant que membre d'une Structure (Club, Commission ou Association), je veux voir les Subventions qui me sont accordées et Publiées, afin de savoir ce qui m'est disponible.
9. En tant que membre d'une Structure, je veux voir pour chaque Subvention le montant total, le montant utilisé et le montant restant, afin de savoir combien je peux encore consommer.
10. En tant que membre d'une Structure, je veux voir le détail des Affectations d'une Subvention, afin de comprendre à quoi l'enveloppe est destinée.
11. En tant que membre d'une Structure, je ne dois pas voir les Subventions encore au statut Programmée qui me sont destinées, afin de respecter la date de publication prévue.
12. En tant qu'Admin, je veux voir toutes les Subventions (Programmées et Publiées, toutes Structures confondues), afin d'avoir une vue d'ensemble.

### Gestion des Subventions (Admin)

13. En tant qu'Admin, je veux créer une Subvention pour une Structure, afin de lui accorder une enveloppe financière.
14. En tant qu'Admin, je veux choisir le Type de subvention (CA Budget, CA Event, CA Exceptionnel) lors de la création, afin de la classifier.
15. En tant qu'Admin, je veux ajouter une ou plusieurs Affectations (description + montant) à une Subvention, afin de préciser à quoi l'enveloppe est destinée. Le montant total de la Subvention est la somme des Affectations.
16. En tant qu'Admin, je veux définir une date de publication pour une Subvention, afin de contrôler quand la Structure bénéficiaire y aura accès.
17. En tant qu'Admin, je veux que la Subvention passe automatiquement du statut Programmée au statut Publiée à la date prévue, afin de ne pas avoir à intervenir manuellement.
18. En tant qu'Admin, je veux définir une date de début et une date de fin pour une Subvention, afin de pouvoir signaler son ancienneté plus tard.

### Entrées et sorties manuelles (Club uniquement)

19. En tant qu'Admin, je veux ajouter une Entrée manuelle sur le Solde d'un Club, afin d'enregistrer une rentrée d'argent (bénéfice d'événement, vente, correction, etc.).
20. En tant qu'Admin, je veux ajouter une Sortie manuelle sur le Solde d'un Club, afin d'enregistrer une dépense qui diminue le Solde.
21. En tant qu'Admin, je ne dois pas pouvoir lier une Sortie manuelle à une Subvention, puisque les Subventions se consomment uniquement via les Notes de frais.
22. En tant qu'Admin, je ne dois pas pouvoir créer d'Entrée manuelle ou de Sortie manuelle pour une Commission ou une Association loi 1901, puisqu'elles n'ont pas de Solde.

### Création d'une Note de frais (Structure)

23. En tant que membre d'une Structure, je veux créer une Note de frais en statut Brouillon, afin de commencer à préparer une demande de remboursement.
24. En tant que membre d'une Structure, je veux ajouter un titre ou une description à ma Note de frais, afin de l'identifier facilement.
25. En tant que membre d'une Structure, je veux ajouter un ou plusieurs Justificatifs (PDF ou image) à ma Note de frais, afin de documenter la dépense.
26. En tant que membre d'une Structure, je veux alternativement ajouter une Attestation sur l'honneur si je n'ai pas de Facture, afin de justifier une dépense sans document classique.
27. En tant que membre d'une Structure, je ne dois pas pouvoir mélanger Facture/Justificatif classique et Attestation sur l'honneur dans la même Note de frais, puisque la règle d'exclusivité s'applique à la note entière.
28. En tant que membre d'une Structure, je veux ajouter une ou plusieurs Lignes de note de frais, chacune avec un bénéficiaire (prénom, nom, IBAN, montant) et un Type de dépense, afin de détailler les remboursements demandés.
29. En tant que membre d'une Structure, je veux choisir pour chaque Ligne une source de financement unique (Solde ou Subvention), afin de préciser comment elle doit être payée.
30. En tant que membre d'un Club, je veux pouvoir choisir le Solde comme source de financement d'une ligne, afin d'utiliser l'argent géré par CLA.
31. En tant que membre d'une Commission ou d'une Association loi 1901, je ne dois pouvoir choisir qu'une Subvention comme source de financement, puisque je n'ai pas de Solde.
32. En tant que membre d'une Structure, je veux qu'une même personne puisse apparaître sur plusieurs Lignes si son remboursement est financé par plusieurs sources, afin de respecter la règle "une ligne = une source".
33. En tant que membre d'une Structure, je veux modifier ma Note de frais tant qu'elle est en statut Brouillon ou Soumise (et que l'Admin n'a pas commencé à la traiter), afin de corriger une erreur avant validation.

### Warnings à la création/soumission

34. En tant que membre d'un Club, je veux voir un Warning si une Ligne financée par le Solde crée ou aggrave un Solde négatif, afin d'être alerté sans être bloqué.
35. En tant que membre d'une Structure, je veux voir un Warning si une Ligne financée par une Subvention dépasse le montant restant de cette Subvention, afin d'être alerté sans être bloqué.
36. En tant que membre d'une Structure, je veux voir un Warning si une Ligne utilise une Subvention dont la date de fin est dépassée depuis plus d'un an, afin d'être alerté sans être bloqué.
37. En tant que membre d'une Structure, je veux pouvoir soumettre ma Note de frais malgré la présence de Warnings, puisque les Warnings ne bloquent jamais la soumission.

### Soumission et prise en charge

38. En tant que membre d'une Structure, je veux soumettre ma Note de frais à l'Admin, afin de passer son statut à Soumise et déclencher son traitement.
39. En tant que membre d'une Structure, je veux pouvoir encore modifier ma Note de frais après soumission tant que l'Admin n'a pas commencé à la traiter, afin de corriger une erreur.
40. En tant qu'Admin, je veux que dès que je commence à modifier une Note de frais Soumise, son statut passe à Prise en charge et la Structure perde définitivement la main dessus (cf. ADR-0001), afin d'éviter les modifications concurrentes.
41. En tant que membre d'une Structure, je ne dois plus pouvoir modifier une Note de frais en statut Prise en charge, même si l'Admin ne l'a pas encore validée.

### Validation Admin et génération du PDF

42. En tant qu'Admin, je veux consulter l'intégralité d'une Note de frais (Justificatifs, Lignes, bénéficiaires, IBAN, sources de financement, Warnings), afin de décider si je la valide.
43. En tant qu'Admin, je veux modifier les Lignes, montants ou sources de financement d'une Note de frais avant validation, afin de corriger une erreur.
44. En tant qu'Admin, je veux valider une Note de frais malgré un Warning actif (dépassement de subvention, subvention ancienne, solde négatif), afin de garder la décision finale.
45. En tant qu'Admin, je veux qu'à la validation, un PDF final soit généré à partir du template existant, incluant les IBAN des bénéficiaires, afin de disposer d'une archive officielle pour effectuer les virements.
46. En tant qu'Admin, je veux qu'à la génération du PDF, le Solde du Club concerné soit mis à jour pour chaque Ligne financée par le Solde, afin que le Solde reflète la dépense validée.
47. En tant qu'Admin, je veux qu'à la génération du PDF, le montant utilisé de chaque Subvention concernée soit mis à jour pour chaque Ligne financée par une Subvention, afin que le montant restant reflète la dépense validée.
48. En tant qu'Admin, je veux que les IBAN soient supprimés de la base de données applicative immédiatement après la génération du PDF (cf. ADR-0002), afin de limiter l'exposition de cette donnée sensible.
49. En tant qu'Admin, je veux que la Note de frais passe au statut Validée et devienne totalement immuable après génération du PDF (cf. ADR-0003), afin que l'archive officielle ne puisse plus être altérée.
50. En tant que membre d'une Structure, je veux consulter mes Notes de frais Validées et télécharger leur PDF, afin de garder une trace des remboursements obtenus.

### Conventions

51. En tant qu'Admin, je veux voir qu'une Subvention a une Convention associée (une Convention = une Subvention), afin de suivre le lien entre les deux — la génération automatique du document Convention est hors scope V1 (voir Out of Scope).

### Dashboards

52. En tant que membre d'un Club, je veux un tableau de bord affichant mon Solde, mes Entrées/Sorties récentes, mes Notes de frais (par statut) et mes Subventions restantes, afin d'avoir une vue d'ensemble rapide.
53. En tant que membre d'une Commission ou d'une Association loi 1901, je veux un tableau de bord affichant mes Subventions (montants accordés/utilisés/restants) et mes Notes de frais liées, afin d'avoir une vue d'ensemble rapide sans référence à un Solde.
54. En tant qu'Admin, je veux une liste des Notes de frais en attente de traitement (Soumises ou Prises en charge), afin de savoir sur quoi agir en priorité.

## Implementation Decisions

- **Vocabulaire** : tout le code (modèles Prisma, Server Actions, composants) utilise les termes canoniques de `CONTEXT.md` — Structure, Club, Commission, Association loi 1901, Solde, Subvention, Affectation, Ligne de note de frais, Type de subvention, Type de dépense, Convention, Warning. Ne pas utiliser "asso" générique, "raison", "catégorie" (ambigu), "trésorier" dans le code.
- **Modèles de données (Prisma)** attendus : `Structure` (avec un discriminant de type Club/Commission/Association), `Solde` ou champ solde sur `Structure` (Club uniquement — à trancher au moment du schema si c'est un champ dénormalisé ou une table de mouvements), `MouvementSolde` (Entrée manuelle / Sortie manuelle), `Subvention`, `Affectation`, `NoteDeFrais`, `LigneNoteDeFrais`, `Justificatif`, `User`/rôle (Structure ou Admin).
- **Type de subvention** : enum Prisma fixe (`CA_BUDGET`, `CA_EVENT`, `CA_EXCEPTIONNEL`) — cf. ADR-0004. Ne pas modéliser en table.
- **Type de dépense** : table Prisma avec des valeurs pré-remplies (seed), extensible — cf. ADR-0004. Ne pas modéliser en enum.
- **Statuts** : `NoteDeFrais.statut` = enum `BROUILLON | SOUMISE | PRISE_EN_CHARGE | VALIDEE`. `Subvention.statut` = enum `PROGRAMMEE | PUBLIEE` (pas de statut "épuisée" — le montant restant est calculé).
- **Verrouillage** (ADR-0001) : le passage à `PRISE_EN_CHARGE` doit être une transition explicite et unidirectionnelle déclenchée par la première action de modification de l'Admin sur une note `SOUMISE`. Les Server Actions de modification côté Structure doivent vérifier le statut avant d'autoriser l'écriture.
- **IBAN** (ADR-0002) : le champ IBAN sur `LigneNoteDeFrais` (ou table bénéficiaire liée) doit être effacé (ou la ligne/relation supprimée) dans la même opération que la génération du PDF et la mise à jour Solde/Subvention — dans une transaction Prisma unique pour garantir la cohérence.
- **Immutabilité post-validation** (ADR-0003) : les Server Actions de modification doivent rejeter toute écriture sur une `NoteDeFrais` au statut `VALIDEE`, y compris côté Admin.
- **Génération PDF** : via `@react-pdf/renderer` (déjà en dépendance), à partir d'un template existant (non fourni dans ce spec — à récupérer auprès de l'utilisateur au moment de l'implémentation du ticket concerné).
- **Warnings** : calculés à la volée (pas stockés en base) au moment de la création/soumission d'une Ligne, et réévalués à la validation Admin. Purement informatifs, ne bloquent aucune Server Action.
- **Authentification** : aucune librairie d'auth n'est encore en dépendance ; le choix technique (NextAuth/Auth.js, solution custom, etc.) est délégué au ticket d'implémentation correspondant plutôt que figé ici.
- **Structure du projet** : App Router Next.js déjà en place (`app/(member)/`, `app/admin/`, `app/(auth)/login/`) — les nouvelles fonctionnalités s'intègrent dans cette arborescence existante plutôt que d'en créer une nouvelle.

## Testing Decisions

- **Seam unique retenu** : les **Server Actions**, appelées directement depuis les tests (sans navigateur, sans HTTP), contre une **vraie base Postgres de test** via Prisma — pas de mock de l'ORM ni de la base.
- Un bon test vérifie un **comportement métier observable** (ex: "après validation d'une note financée par le Solde, le Solde diminue du bon montant") et non un détail d'implémentation (ex: pas d'assertion sur le nombre d'appels internes à Prisma).
- Chaque règle métier de ce spec correspondant à un Warning, une transition de statut, ou une mise à jour Solde/Subvention doit avoir au moins un test au niveau Server Action couvrant le cas nominal et le cas limite (ex: dépassement, statut verrouillé, tentative de modification post-validation).
- Pas de tests de composants React pour la logique métier ; les tests de rendu (si existants) se limitent à la présentation.
- Aucun test existant dans le repo à ce jour servant de précédent — ce spec établit le premier pattern de test du projet.

## Out of Scope

- Import Excel des Subventions (prévisualisation, correction, publication programmée avancée) — V2.
- Génération automatique du document Convention — V2 (le lien Subvention↔Convention existe en V1, pas sa génération).
- Dashboard Admin complet (vue consolidée multi-structures, statistiques) — V2.
- Notifications email, rappels — V2 ou plus tard.
- Historique détaillé / audit trail avancé — V2 ou plus tard.
- Rôles fins au-delà de Structure/Admin — non prévu à ce stade.
- Personnalisation des Types de subvention (restent un enum fixe) — non prévu.
- Fusion avancée des Justificatifs en un seul PDF — repoussé, la V1 se limite à l'upload et l'archivage.
- Tutoriel/UX d'aide à la saisie — V2 ou plus tard.
- Mécanisme de correction d'une Note de frais après validation (statut Validée) — volontairement non tranché (cf. ADR-0003), à traiter dans un spec dédié le moment venu.

## Further Notes

- Le document source (`Application de trésorerie CLA — Synthèse fonctionnelle.md`) et la session de grilling ayant produit ce spec ont établi `CONTEXT.md` (glossaire) et 4 ADR dans `docs/adr/` : verrouillage simple (0001), non-persistance de l'IBAN (0002), immutabilité post-PDF (0003), Type de subvention en dur vs Type de dépense en base (0004). Toute implémentation doit s'y référer.
- Le détail exact des Types de dépense pré-remplis en V1 (au-delà des exemples nourriture/transport/matériel) reste à préciser au moment du seed — non bloquant pour démarrer l'implémentation.
- Le template PDF existant mentionné dans le document source n'a pas été fourni dans cette conversation ; le ticket touchant la génération PDF devra le récupérer auprès de l'utilisateur.
