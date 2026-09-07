# Exploitation & passation

Ce que le code ne peut pas dire : où tourne Trézo, qui détient les accès, et
qui contacter. À tenir à jour à chaque changement d'hébergeur, de compte ou
de responsable — c'est le document qui permet à quelqu'un de reprendre le
projet sans dépendre d'une personne en particulier.

Les champs `TODO` sont à compléter (ou à retirer si non pertinents).

## Hébergement

- **Hébergeur** : Rézoléo (association de l'École Centrale de Lille)
- **Accès** : TODO (qui a la main sur le déploiement — compte, dashboard, procédure de déploiement)
- **Nom de domaine** : TODO
- **Coût récurrent** : TODO

## Base de données

- **Dev** : Neon (Postgres serverless), projet personnel — voir `.env.example` (`DATABASE_URL`).
- **Prod** : en cours de discussion avec Rézoléo. Le schéma Prisma est écrit pour Postgres (tous les modèles utilisent `@db.Uuid`) — un hébergement MySQL demanderait une vraie migration (type d'ID sur les 22 modèles, régénération de l'historique de migrations), pas juste un changement de variable d'environnement. À trancher avant la mise en prod ; compléter cette section une fois la décision prise (fournisseur, accès, sauvegardes, coût).

## Authentification

- **Mécanisme** : SSO CLA (`CLA_AUTH_HOST` / `CLA_AUTH_IDENTIFIER`, cf. `.env.example`) + session chiffrée (`iron-session`)
- **Propriétaire du SSO** : CLA (système externe à ce projet) — TODO contact côté CLA pour toute modification/renouvellement de l'intégration

## Stockage des fichiers

- Justificatifs et PDF générés stockés sur disque (`STORAGE_ROOT_DIR`, cf. `.env.example`), pas de service cloud tiers.
- **Emplacement en production** : TODO (chemin exact / point de montage sur le serveur Rézoléo)
- **Sauvegardes** : TODO

## Variables d'environnement

Liste et description : voir [.env.example](../.env.example). Les valeurs réelles de production vivent uniquement sur le serveur — jamais dans le repo Git.

## Contacts

- **Côté CLA** : TODO (nom/rôle de la ou les personnes référentes)
- **Côté Rézoléo** : TODO
- **Mainteneur(s) technique(s) actuel(s)** : TODO

## À la passation

Checklist pour transmettre le projet à quelqu'un d'autre :

- [ ] Accès au repo Git (droits d'écriture/admin)
- [ ] Accès à la base de données de prod (fournisseur à confirmer)
- [ ] Accès au déploiement Rézoléo
- [ ] Contact SSO côté CLA transmis
- [ ] `.env` de production transmis par un canal sécurisé (jamais par email en clair)
