# Issue tracker: GitHub (via `gh` CLI)

Issues and specs (you may know a spec as a PRD) for this repo live as GitHub Issues on `foucault-watt/cla-trezo`, managed through the `gh` CLI — not as local markdown files.

## Conventions

- One GitHub issue per ticket. Title: `<feature-slug>: <short summary>`.
- The spec (or PRD) for a multi-issue feature is either the body of a tracking/parent issue, or a `spec.md` committed to the repo and linked from each ticket's body — pick whichever the current flow (`/to-spec`) produces and stay consistent within a feature.
- Triage state is recorded as a GitHub **label**, not a `Status:` line — see `triage-labels.md` for the label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`).
- Comments and conversation history are GitHub issue comments (`gh issue comment`), not an in-file `## Comments` section.
- Blocking relationships: note them in the issue body (e.g. `Blocked by: #12, #14`) since GitHub has no native blocking field usable from `gh` alone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue:

```
gh issue create --title "<feature-slug>: <summary>" --body "<ticket body>" --label needs-triage
```

Apply labels per `triage-labels.md`. Reference the created issue number in any follow-up (spec, other tickets, commits).

## When a skill says "fetch the relevant ticket"

```
gh issue view <number>
```

The user will normally pass the issue number directly. Read comments with `gh issue view <number> --comments` if history matters.

## Wayfinding operations

Used by `/wayfinder`. Map the skill's local-file vocabulary onto GitHub issues:

- **Map**: a parent/tracking GitHub issue for the effort, with the Notes / Decisions-so-far / Fog body kept in its description (`gh issue edit <number> --body-file -` to update it).
- **Child ticket**: one GitHub issue per question, title `<effort>: <question>`. A `Type:` line in the body records the ticket type (`research`/`prototype`/`grilling`/`task`). Status is the issue's open/closed state plus a label (`claimed` via assignee, or a comment) — there's no native `Status:` line, so use assignment: assign yourself to claim.
- **Blocking**: a `Blocked by: #NN, #NN` line near the top of the body. A ticket is unblocked when every referenced issue is closed.
- **Frontier**: `gh issue list --search "is:open no:assignee"` filtered to the effort's issues (by label or title prefix), then check each candidate's `Blocked by:` line manually.
- **Claim**: `gh issue edit <number> --add-assignee @me` before any work.
- **Resolve**: `gh issue comment <number> --body "## Answer\n\n<answer>"`, then `gh issue close <number>`, then append a context pointer (gist + link to the issue) to the map issue's Decisions-so-far.
