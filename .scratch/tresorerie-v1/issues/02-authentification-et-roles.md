# 02 — Authentification & accès par rôle

**What to build:** Connexion pour un membre de Structure et connexion pour un Admin. Chaque rôle est redirigé vers son espace (`app/(member)/...` ou `app/admin/...`). Une Structure connectée ne peut accéder qu'aux données qui la concernent ; un Admin connecté peut accéder aux données de toutes les Structures.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Un membre de Structure peut se connecter et est redirigé vers son espace membre
- [ ] Un Admin peut se connecter et est redirigé vers son espace admin
- [ ] Une tentative d'accès d'une Structure aux données d'une autre Structure est refusée
- [ ] Un Admin peut accéder aux données de n'importe quelle Structure
- [ ] Tests au niveau Server Action couvrant : connexion réussie par rôle, refus d'accès cross-structure
