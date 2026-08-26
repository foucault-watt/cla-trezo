@AGENTS.md

## Agent skills

### Issue tracker

Issues live as GitHub Issues on `foucault-watt/cla-trezo`, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### Testing

Vitest, unit tests colocated as `*.test.ts`. Write a test whenever a change touches a business rule from `CONTEXT.md` or an ADR. See `docs/agents/testing.md`.

### Seeds

`prisma/seed.ts` = données de référence permanentes. `scripts/seed-*.ts` = seeds manuels jetables pour du volume de test, toujours gardés par `ALLOW_DEV_SEED=true`. See `docs/agents/seeds.md`.

### Toasts

Système d'alerte toast global (`ToastProvider`/`useToast`, monté dans `app/layout.tsx`), avec un mécanisme `?toast=...&toastType=...` pour survivre à un `redirect()` côté serveur. See `docs/agents/toasts.md`.
