# Trézo

Application de gestion financière de Centrale Lille Associations (CLA) :
soldes de clubs, campagnes de subvention et notes de frais. Voir
[PRODUCT.md](PRODUCT.md) pour le contexte produit et [CONTEXT.md](CONTEXT.md)
pour le vocabulaire métier.

## Démarrage local

```bash
npm install
cp .env.example .env
# puis compléter .env : DATABASE_URL (Neon), CLA_AUTH_*, SESSION_SECRET —
# voir les commentaires dans .env.example pour le détail de chaque variable.
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Autres commandes utiles :

```bash
npm test           # tests unitaires (Vitest)
npm run lint        # ESLint
npm run format       # Prettier
```

## Hébergement & exploitation

Application hébergée par Rézoléo (association de l'École Centrale de Lille).
Voir [docs/handover.md](docs/handover.md) pour les accès, comptes et
contacts.

## Documentation

- [PRODUCT.md](PRODUCT.md) — pourquoi le produit existe, qui l'utilise
- [CONTEXT.md](CONTEXT.md) — vocabulaire métier et statuts
- [docs/adr/](docs/adr/) — décisions d'architecture (le *pourquoi* des choix techniques)
- [docs/handover.md](docs/handover.md) — hébergement, comptes, contacts
- [DESIGN.md](DESIGN.md) et [docs/design/COMPONENTS.md](docs/design/COMPONENTS.md) — design system
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) et [docs/agents/](docs/agents/) — conventions pour les agents IA qui travaillent sur ce repo (ce projet est en grande partie développé avec leur aide — voir ces fichiers avant de coder, humain ou agent)

Pour obtenir un instantané de toute cette documentation en un seul fichier
(à remettre à quelqu'un qui ne clonera pas le repo) :

```bash
npx tsx scripts/export-docs.ts
# écrit docs/export/dossier-trezo.md
```
