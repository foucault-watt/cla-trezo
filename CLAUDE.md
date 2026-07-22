@AGENTS.md

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

### Testing

Vitest, unit tests colocated as `*.test.ts`. Write a test whenever a change touches a business rule from `CONTEXT.md` or an ADR. See `docs/agents/testing.md`.
