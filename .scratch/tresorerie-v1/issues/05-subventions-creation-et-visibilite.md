# 05 — Subventions : création (Admin) et visibilité (Structure)

**What to build:** L'Admin crée une Subvention pour une Structure (Club, Commission ou Association) avec un Type de subvention, une ou plusieurs Affectations, et une date de publication. La Structure bénéficiaire ne voit que ses Subventions au statut Publiée ; l'Admin voit toutes les Subventions de toutes les Structures, y compris celles au statut Programmée.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] L'Admin crée une Subvention avec Type de subvention, une ou plusieurs Affectations (description + montant), et une date de publication
- [ ] Le montant total de la Subvention est calculé comme la somme des Affectations
- [ ] Une Subvention dont la date de publication est future est au statut Programmée ; à la date atteinte, elle est au statut Publiée
- [ ] Une Structure ne voit que ses propres Subventions Publiées, avec montant total, montant utilisé (0 pour l'instant) et montant restant
- [ ] Une Structure ne voit pas ses Subventions encore Programmées
- [ ] L'Admin voit toutes les Subventions, Programmées et Publiées, toutes Structures confondues
- [ ] Tests au niveau Server Action couvrant : création, transition Programmée→Publiée, visibilité par Structure vs Admin
