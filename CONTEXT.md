# CLA Trézo

Application de gestion financière pour Centrale Lille Associations (CLA) : notes de frais, remboursements, soldes de clubs, subventions et conventions.

## Language

**Structure**:
Terme générique désignant toute entité gérée par l'application : un Club, une Commission ou une Association loi 1901.
_Avoid_: entité, organisation, asso (générique)

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

**Subvention**:
Enveloppe financière accordée à une Structure (Club, Commission ou Association), toujours séparée du Solde — elle ne l'augmente jamais, même pour un Club. Composée d'une ou plusieurs Affectations, chacune avec son propre montant.
_Avoid_: budget, aide, financement (trop génériques)

**Affectation**:
Ligne interne d'une Subvention associant une description (ex: matériel, transport) à un montant. La somme des Affectations d'une Subvention égale son montant total.
_Avoid_: raison (terme du document source, trop ambigu — sonne comme une justification plutôt qu'une ligne budgétaire)

**Type de subvention**:
Classification fixe d'une Subvention : `CA Budget`, `CA Event`, `CA Exceptionnel`. Enum fixe dans le code, non personnalisable.
_Avoid_: catégorie (terme ambigu, utilisé aussi pour le Type de dépense)

**Type de dépense**:
Classification d'une Ligne de note de frais (ex: nourriture, transport, matériel). Liste pré-remplie en base de données mais extensible/personnalisable, contrairement au Type de subvention.
_Avoid_: catégorie (terme ambigu, utilisé aussi pour le Type de subvention)

## Statuts d'une Note de frais

**Brouillon**:
Note créée, librement modifiable par la Structure.

**Soumise**:
Note envoyée à l'Admin. Encore modifiable par la Structure tant que l'Admin n'a pas commencé à la traiter.

**Prise en charge**:
L'Admin a commencé à traiter la note. La Structure perd définitivement la main (cf. ADR-0001).

**Validée**:
Le PDF final a été généré. La note est immuable (cf. ADR-0003), le Solde et les Subventions concernées sont mis à jour, l'IBAN est supprimé (cf. ADR-0002).

## Statuts d'une Subvention

**Programmée**:
Date de publication future. Visible uniquement par l'Admin, pas encore utilisable par la Structure bénéficiaire.

**Publiée**:
Visible et utilisable par la Structure bénéficiaire. Le montant restant (montant total moins montant utilisé) est une valeur calculée, pas un statut distinct — il n'y a pas de statut "Épuisée" séparé.

## Mouvements de solde

**Entrée manuelle**:
Mouvement ajouté par l'Admin qui augmente le Solde d'un Club. Concerne uniquement les Clubs.

**Sortie manuelle**:
Mouvement ajouté par l'Admin qui diminue le Solde d'un Club. Ne peut jamais être liée à une Subvention — les Subventions ne se consomment que via les Notes de frais.

**Ligne de note de frais**:
Unité d'une Note de frais correspondant à un bénéficiaire, un montant, et une source de financement *unique* — soit le Solde, soit une Subvention. Jamais de ventilation interne à une ligne : un remboursement partagé entre plusieurs sources devient plusieurs lignes.

**Convention**:
Document PDF officiel généré à partir d'une Subvention. Correspond toujours à une seule Subvention.
_Avoid_: courrier

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
