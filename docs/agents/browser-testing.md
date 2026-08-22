# Navigation et captures en développement

Utiliser ce parcours pour inspecter l'interface locale, tester une navigation
ou produire des captures sans passer par le SSO CLA.

## Préparer et lancer

1. Vérifier que les variables habituelles (`DATABASE_URL`, `SESSION_SECRET`,
   stockage) sont configurées dans `.env`.
2. Définir `DEV_AUTH_BYPASS="true"`. Ce bypass est actif avec `next dev` et
   reste inactif lorsque `NODE_ENV=production`.
3. Pour un parcours qui écrit en base, définir aussi `DEV_AUTH_USERNAME` avec
   le username CLA d'un utilisateur existant. Cette session reste Admin et
   expose toutes les assos. Pour une inspection en lecture, l'identité Admin
   synthétique par défaut suffit et possède la même portée.
4. Lancer `npm run dev` et relever l'URL exacte annoncée par Next.js : si le
   port 3000 est occupé, utiliser le port choisi automatiquement.

## Naviguer

Ouvrir directement l'URL protégée à vérifier, par exemple
`http://localhost:3000/app/admin`. Sans cookie de session, le proxy passe par
`/api/auth/dev-login` puis revient automatiquement à l'URL initiale, query
string comprise.

Pour forcer une nouvelle session ou choisir explicitement la destination,
ouvrir :

```text
http://localhost:3000/api/auth/dev-login?redirect=/app/admin
```

Une réponse 404 sur cette route signifie que le bypass n'est pas activé ou que
le serveur tourne en mode production. Une réponse 500 avec
`DEV_AUTH_USERNAME` signifie généralement que cet utilisateur n'existe pas
dans la base ciblée.

## Capturer

1. Attendre la fin du chargement et vérifier visuellement que la page cible,
   et non une erreur ou une redirection, est affichée.
2. Pour une vérification responsive, capturer au minimum une vue bureau
   (1440 × 1000) et une vue mobile (390 × 844).
3. Enregistrer les captures temporaires dans `tmp/screenshots/` et les nommer
   avec la route et le viewport, par exemple `admin-dashboard-desktop.png` et
   `admin-dashboard-mobile.png`.
4. Après une interaction, attendre que le nouvel état visible soit stabilisé
   avant la capture.

Le bypass remplace uniquement l'identité SSO. Les pages qui lisent la base ont
toujours besoin d'une `DATABASE_URL` joignable et de données compatibles avec
le scénario testé.
