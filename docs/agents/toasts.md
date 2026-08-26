# Toasts

## Où

- `components/ui/toast.tsx` — `ToastProvider`, `useToast()`, rendu des
  toasts. Monté une seule fois dans `app/layout.tsx`, donc disponible sur
  toute l'app (vue membre et vue admin), même si tous les flux ne l'utilisent
  pas encore (cf. Portée actuelle).
- `components/ui/toast-query-flag.tsx` — `<ToastQueryFlag />`, monté aussi
  une seule fois dans `app/layout.tsx` (dans un `<Suspense>`, requis par
  `useSearchParams`). Lit `?toast=...` sur n'importe quelle page.

## Déclencher un toast depuis un Client Component

```tsx
"use client";
import { useToast } from "@/components/ui/toast";

const { push } = useToast();
push({ type: "success", message: "Note de frais créée." });
```

Types : `success | error | info | warning` — mêmes noms que les classes
`alert-*` de daisyUI déjà utilisées partout sur le site (`alert-soft`).
Disparition automatique après 4 à 6s selon le type (`durationMs` pour
personnaliser, `0` = ne disparaît jamais tout seul). Fermeture manuelle
toujours possible via le bouton croix.

## Depuis un flux qui redirige côté serveur (`redirect()` dans une Server Action)

Un composant client ne peut pas exécuter de code après un `redirect()`
serveur — ça court-circuite le rendu, `useActionState` ne reçoit jamais
l'état de succès pour ce cas. Impossible donc d'appeler `useToast().push`
à ce moment-là, et impossible d'écrire dans `sessionStorage` depuis le
serveur.

La solution : ajouter `?toast=<message>&toastType=<type>` à l'URL cible du
`redirect()`. `toastType` est optionnel (défaut `success`). `<ToastQueryFlag />`
lit ces paramètres au chargement de la page de destination, affiche le
toast, puis nettoie l'URL via `router.replace` — sans toucher aux autres
paramètres déjà présents (ex: `?view=grid`).

```ts
const toastParams = new URLSearchParams({
  toast: "Note de frais supprimée.",
  toastType: "success",
});
redirect(`/app/${assoSlug}/notes-de-frais?${toastParams.toString()}`);
```

Voir `deleteExpenseReportAction` dans
`lib/expense-reports/expense-report-actions.ts` pour un exemple réel.

Si l'action redirige côté client (`router.push` après un `useActionState`
qui retourne `{ ok: true }` normalement, sans `redirect()` serveur), pas
besoin de ce détour : `ToastProvider` est monté au-dessus du routeur, donc
un `push()` appelé juste avant la navigation client survit à celle-ci. Voir
`NewExpenseReportForm`.

## Ce qu'il ne faut pas faire

- Ne pas cumuler un `alert alert-error alert-soft` inline **et** un toast
  pour la même erreur de formulaire — un seul canal de feedback par action.
- Ne pas mettre un message long ou dynamique-sans-limite dans `?toast=` —
  préférer un texte court et fixe (l'URL a des limites pratiques, et un
  message trop long déborde mal même si `.toast` gère le wrap).

## Portée actuelle

Implémenté pour la création et la suppression de Notes de frais côté vue
app (`/app/[assoSlug]/notes-de-frais`) — `new-expense-report-form.tsx` et
`delete-expense-report-button.tsx`. Le reste du site garde encore ses
`alert` inline classiques ; le système est générique et prêt à être
réutilisé ailleurs au fur et à mesure, pas besoin d'un big-bang de
migration.
