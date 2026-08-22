# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Deux profils :

- **Structures** (Clubs, Commissions, Associations loi 1901) : responsables élus des structures membres de CLA, le plus souvent des étudiants bénévoles sans formation comptable, avec une forte rotation annuelle (mandat typique d'un an). Ils consultent le solde/les subventions de leur structure et soumettent des notes de frais avec justificatifs. L'app doit rester auto-explicative car les utilisateurs changent chaque année et n'ont pas de formation préalable.
- **Admin** : rôle unique côté CLA (2 à 4 personnes en pratique) qui a le dernier mot sur la validation des notes de frais, la gestion des subventions et des entrées/sorties de solde. Voir la définition complète dans [CONTEXT.md](CONTEXT.md).

## Product Purpose

Trézo centralise la gestion financière de Centrale Lille Associations (CLA) pour l'ensemble de ses structures membres : suivi des soldes de club, gestion des campagnes de subvention, et traitement des notes de frais (remboursements + justificatifs) jusqu'à la génération de PDF officiels (notes de frais validées, conventions de subvention).

Succès = les structures ont une visibilité en temps réel sur leur solde et leurs subventions sans solliciter l'Admin, et l'Admin traite les notes de frais et subventions de toutes les structures depuis un outil unique et auditable.

## Positioning

Avant Trézo, le suivi se faisait par échanges email et PDF manuels : les structures envoyaient leurs justificatifs par email à l'Admin CLA, qui traitait tout manuellement sans outil centralisé ni visibilité partagée. Trézo remplace ce circuit par un flux structuré et traçable (statuts de note de frais, immutabilité post-validation, historique des mouvements de solde) avec une visibilité temps réel pour les structures — elles n'ont plus besoin de « harceler le trésorier de CLA » pour connaître leur solde (cf. page d'accueil publique).

## Operating Context

- Usage à l'échelle d'une association étudiante fédérative : ~30 à 80 structures (Clubs/Commissions/Associations loi 1901) actives, gérées par 2 à 4 Admins CLA.
- Forte rotation des utilisateurs côté structure : les responsables sont réélus chaque année, donc l'app est régulièrement prise en main par des nouveaux utilisateurs sans historique du produit.
- Workflow central : Structure crée/soumet une Note de frais avec Justificatifs → Admin la prend en charge, la valide (génère le PDF, statut immuable) ou la rejette. Voir le cycle de statuts complet et les mouvements de solde/subvention dans [CONTEXT.md](CONTEXT.md).
- Contexte réglementaire : Trézo gère des documents financiers officiels (notes de frais validées, conventions de subvention) et des données bancaires (IBAN) — voir contraintes ci-dessous.
- Interface exclusivement en français (`lang="fr"`).

## Capabilities and Constraints

- Génération de PDF officiels : notes de frais validées et conventions de subvention (`@react-pdf/renderer`).
- Immutabilité : une Note de frais Validée est figée définitivement, cf. [ADR-0003](docs/adr/0003-immutabilite-post-pdf.md).
- IBAN non persistant : l'IBAN saisi pour une note de frais est supprimé après génération du PDF, cf. [ADR-0002](docs/adr/0002-iban-non-persistant.md).
- Verrouillage simple des notes de frais dès prise en charge par l'Admin (pas d'édition concurrente complexe), cf. [ADR-0001](docs/adr/0001-verrouillage-simple-note-de-frais.md).
- Type de subvention : enum fixe en dur dans le code (`CA Budget`, `CA Event`, `CA Exceptionnel`), non personnalisable ; Type de dépense : liste extensible en base, cf. [ADR-0004](docs/adr/0004-type-subvention-en-dur-type-depense-en-base.md).
- Terminologie métier stricte (Asso, Club, Commission, Solde, Subvention, Remboursement, etc.) définie dans [CONTEXT.md](CONTEXT.md) — à respecter dans le code et l'UI.
- Authentification par session (`iron-session`), pas de SSO externe identifié dans le code actuel.

## Brand Commitments

- Nom du produit : **Trézo** (parfois affiché « CLA - Trézo » / « CLA Trézo »), pour Centrale Lille Associations.
- Ton informel et direct côté structures (« Bonjour {prénom} », « sans devoir harceler le trésorier de CLA ») — cohérent avec un public étudiant.

## Evidence on Hand

- Terminologie métier complète et statuts documentés dans [CONTEXT.md](CONTEXT.md).
- Décisions d'architecture documentées dans `docs/adr/` (verrouillage, immutabilité, IBAN, types de subvention/dépense).
- Aucune donnée d'usage réelle (metrics, retours utilisateurs) présente dans le repo — à ne pas inventer.

## Product Principles

1. **Visibilité temps réel sans intermédiaire** : une structure doit pouvoir connaître son solde et ses subventions sans solliciter l'Admin.
2. **Auto-explicatif pour des utilisateurs de passage** : forte rotation annuelle des responsables de structure ⇒ pas de dépendance à une formation ou à une mémoire d'usage d'une année sur l'autre.
3. **Traçabilité et irréversibilité assumée** : les statuts et l'immutabilité post-validation priment sur la flexibilité d'édition, pour garantir l'auditabilité des documents financiers officiels.
4. **L'Admin garde toujours la décision finale** : les avertissements (dépassement, solde négatif, subvention ancienne) informent mais ne bloquent jamais un traitement.
5. **Terminologie métier comme contrat** : les mots définis dans CONTEXT.md (Asso, Solde, Subvention, Remboursement...) sont la source de vérité du code et de l'UI, pas des synonymes génériques.

## Accessibility & Inclusion

Aucune exigence d'accessibilité spécifique confirmée à ce jour au-delà des standards web usuels ; à préciser si un besoin apparaît.
