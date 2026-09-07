<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Contrôles visuels en développement

Pour naviguer dans l'interface locale, tester un parcours visuel ou prendre
des captures d'écran sans SSO, lire `docs/agents/browser-testing.md` avant de
lancer le serveur ou le navigateur.

## Registre des icônes

Chaque icône `lucide-react` ajoutée, retirée ou dont le texte/label associé
change doit être répercutée dans
`app/app/admin/developpement/pdf-lab/_components/icon-usage-data.ts` (onglet
"Icônes" de la page admin/développement). C'est une liste tenue à la main,
pas un scan automatique — elle sert à repérer les incohérences icône ↔ texte
sur le site.
