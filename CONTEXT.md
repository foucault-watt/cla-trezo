# CLA Trézo

Application de gestion financière pour Centrale Lille Associations (CLA) : notes de frais, remboursements, soldes de clubs, subventions et conventions.

## Language

**Asso**:
Terme générique désignant toute entité gérée par l'application : un Club, une Commission ou une Association loi 1901.

**Club**:
Structure interne à CLA, sans compte bancaire propre ni personnalité juridique séparée. Son argent est géré par CLA et suivi via un solde interne dans l'application.
_Avoid_: asso (abus de langage courant, à éviter dans le code et les échanges métier)

**Commission**:
Structure interne à CLA disposant de son propre compte bancaire ou fonctionnement financier séparé. N'a pas de solde interne CLA ; suit uniquement des subventions.

**Association loi 1901**:
Structure juridiquement indépendante de CLA, avec son propre compte bancaire. Fonctionne comme une Commission dans l'application : pas de solde interne, suivi uniquement par subventions.
_Avoid_: association (seule, sans qualificatif — pour éviter la confusion avec le sens générique du mot)

**Solde**:
Argent d'un Club géré par CLA, suivi dans l'application. Alimenté par des entrées manuelles et diminué par des sorties manuelles ou des Notes de frais financées dessus. Concerne uniquement les Clubs.
_Avoid_: budget, trésorerie (trop génériques, mélangent Solde et Subvention)

**Campagne de subvention**:
Regroupement administratif de Subventions portant un même Type de subvention et une même période (ex: "CA Budget 2026"). Porte le Type de subvention et la date de publication communs à toutes ses Subventions. Créée par l'Admin, qui y ajoute ensuite une ou plusieurs Subventions, éventuellement plusieurs pour la même Structure.
_Avoid_: financement (terme utilisé dans les PDF générés — ndf-fn-sb, Ordre de financement — pour désigner ce concept côté bénéficiaire ; à éviter en interne)

**Subvention**:
Enveloppe financière accordée à une Structure (Club, Commission ou Association) au sein d'une Campagne de subvention, toujours séparée du Solde — elle ne l'augmente jamais, même pour un Club. Portée par une raison et un montant unique (pas de ventilation interne).
_Avoid_: budget, aide, financement (trop génériques)

**Type de subvention**:
Classification fixe d'une Campagne de subvention (et donc, par transitivité, de toutes ses Subventions) : `CA Budget`, `CA Event`, `CA Exceptionnel`. Enum fixe dans le code, non personnalisable. Porté par la Campagne, pas par la Subvention elle-même.
_Avoid_: catégorie (terme ambigu, utilisé aussi pour le Type de dépense)

**Type de dépense**:
Classification d'un Remboursement (ex: nourriture, transport, matériel). Liste pré-remplie en base de données mais extensible/personnalisable, contrairement au Type de subvention.
_Avoid_: catégorie (terme ambigu, utilisé aussi pour le Type de subvention)

**Note de frais**:
Demande portée par une Structure et dédiée à un bénéficiaire unique. Elle regroupe un ou plusieurs Remboursements et leurs Justificatifs.

**Bénéficiaire**:
Personne unique à laquelle tous les Remboursements d'une Note de frais sont destinés. Il peut s'agir d'un membre actif de la Structure ou d'une personne personnalisée.

**Remboursement**:
Unité d'une Note de frais correspondant à une dépense datée, un montant et une source de financement unique — soit le Solde, soit une Subvention. Un remboursement partagé entre plusieurs sources devient plusieurs Remboursements.
_Avoid_: ligne (terme technique, à ne pas employer dans l'interface)

## Statuts d'une Note de frais

**Brouillon**:
Note créée, librement modifiable par la Structure.

**Soumise**:
Note envoyée à l'Admin. Encore modifiable par la Structure tant que l'Admin n'a pas commencé à la traiter.

**Prise en charge**:
L'Admin a commencé à traiter la note. La Structure perd définitivement la main (cf. ADR-0001).

**Validée**:
Le ou les PDF finaux ont été générés (cf. PDF final). La note est immuable (cf. ADR-0003), le Solde et les Subventions concernées sont mis à jour, l'IBAN est supprimé (cf. ADR-0002).

**Rejetée**:
L'Admin refuse la note après Prise en charge. Statut terminal : accessible uniquement depuis Prise en charge, jamais depuis Brouillon ou Soumise directement, et non modifiable ensuite (pas de retour en Brouillon).

## Statuts d'une Campagne de subvention

Statut dérivé de la date de publication de la Campagne (pas une colonne dédiée), partagé par toutes les Subventions qu'elle contient.

**Programmée**:
Date de publication absente ou future. Visible uniquement par l'Admin, pas encore utilisable par les Structures bénéficiaires de ses Subventions.

**Publiée**:
Date de publication atteinte. Les Subventions de la Campagne sont visibles et utilisables par leurs Structures bénéficiaires respectives. Le montant restant d'une Subvention (montant total moins montant utilisé) est une valeur calculée, pas un statut distinct — il n'y a pas de statut "Épuisée" séparé.

## Mouvements de solde

**Entrée manuelle**:
Mouvement ajouté par l'Admin qui augmente le Solde d'un Club. Concerne uniquement les Clubs.

**Sortie manuelle**:
Mouvement ajouté par l'Admin qui diminue le Solde d'un Club. Ne peut jamais être liée à une Subvention — les Subventions ne se consomment que via les Notes de frais.

**Warning**:
Signal non-bloquant affiché à l'utilisateur ou à l'admin (dépassement de Subvention, Subvention ancienne, Solde négatif). Ne bloque jamais la soumission ni la validation — l'admin garde toujours la décision finale.
_Avoid_: erreur, blocage (impliqueraient à tort un blocage dur)

**Justificatif**:
Terme générique pour tout document accompagnant une Note de frais (PDF, image, facture scannée). Recouvre la Facture et l'Attestation sur l'honneur.

**Facture**:
Document fourni par un tiers (fournisseur, prestataire) prouvant une dépense.

**Attestation sur l'honneur**:
Justificatif alternatif utilisé en l'absence de Facture. Une Note de frais contient soit des Factures/Justificatifs classiques, soit une Attestation sur l'honneur, jamais les deux — la règle s'applique à la Note de frais entière, pas ligne par ligne.

**Admin**:
Rôle unique ayant le dernier mot sur la validation des Notes de frais, la gestion des Subventions et des entrées/sorties de Solde. Un seul rôle en V1, quel que soit l'usage du terme "trésorier" dans les échanges courants.
_Avoid_: trésorier (dans le code — c'est un synonyme d'usage, pas un rôle distinct)

## Documents PDF

**PDF final**:
Document PDF officiel généré à la validation d'une Note de frais, remis comme justificatif de remboursement. Une Note de frais peut mélanger plusieurs sources de financement entre ses Remboursements ; la validation génère un PDF final par source distincte — un par Subvention concernée, plus un regroupant tous les Remboursements financés par le Solde s'il y en a. Une Note produit donc un ou plusieurs PDF finaux, jamais un PDF unique combinant toutes les sources.
_Avoid_: le PDF, la note en PDF

**Convention de subvention**:
Document PDF officiel généré lors de l'octroi d'une Subvention à une Association loi 1901. Correspond toujours à une seule Subvention.
_Avoid_: courrier, convention (seul)

**Ordre de financement**:
Équivalent de la Convention de subvention pour un Club ou une Commission bénéficiaire d'une Subvention. Document PDF officiel généré lors de l'octroi d'une Subvention, toujours lié à une seule Subvention.
_Avoid_: convention (réservé à l'Association loi 1901)
