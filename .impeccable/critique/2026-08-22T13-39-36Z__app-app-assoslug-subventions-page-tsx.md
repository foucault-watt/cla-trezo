---
target: "http://localhost:3000/app/mots-dits/subventions"
total_score: 19
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 2
timestamp: 2026-08-22T13-39-36Z
slug: app-app-assoslug-subventions-page-tsx
---

**Method note:** Source-only review — no dev server was started and the live site was not accessed (standing project rule). Target resolved to `app/app/[assoSlug]/subventions/page.tsx` and its two child components, since a source path identifies the same surface as `localhost:3000/app/mots-dits/subventions` without depending on a running server.

### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                                                                                                                   |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 2         | Historique has no visible affordance that it holds data until scrolled to and opened.                                                                                                       |
| 2         | Match System / Real World       | 2         | "reste" (current cards) vs "restants" (Historique) are inconsistent phrasing for the same concept; raw admin taxonomy ("CA Budget"/"CA Event"/"CA Exceptionnel") shown with no explanation. |
| 3         | User Control and Freedom        | 3         | Collapse/expand works; no filter/search once a Structure accumulates many campaigns.                                                                                                        |
| 4         | Consistency and Standards       | 2         | Card-level stale indicator pairs icon+text (`subventions-by-campaign.tsx`); Historique row's stale indicator is icon-only with no label — same signal, inconsistent treatment.              |
| 5         | Error Prevention                | 3         | No user input to guard, but the `<progress>` element is unguarded for a zero-total or negative-remaining edge case.                                                                         |
| 6         | Recognition Rather Than Recall  | 2         | Nothing states that a Subvention past the 2-year window is no longer usable for new Notes de frais — user must infer this from nowhere.                                                     |
| 7         | Flexibility and Efficiency      | n/a       | Consult-only balance list; no power-user path applies.                                                                                                                                      |
| 8         | Aesthetic and Minimalist Design | 3         | Card is lean; type badge + name + date header reads as one clean block.                                                                                                                     |
| 9         | Error Recovery                  | 2         | Historique fetch failure shows static text with no retry action.                                                                                                                            |
| 10        | Help and Documentation          | n/a       | Consult-only page; no help content expected at this altitude.                                                                                                                               |
| **Total** |                                 | **19/32** | **Acceptable (59%)**                                                                                                                                                                        |

### Design Specificity Verdict

**Generic, with one domain-authored touch.** The layout — h1 + subtitle, flat card grid, `<progress>` bars, a collapsed accordion for history — is an interchangeable SaaS pattern; swap the labels and it could be a budget tracker or usage-quota page for any product. The one real domain decision is the two-tier staleness model (>1yr "ancienne" warning, >2yr moved into a collapsed Historique where the Subvention becomes unusable for new Notes de frais) — good domain thinking that CONTEXT.md itself takes a full paragraph to define. But that thinking isn't reflected in the visual design; it's a text string bolted onto an otherwise generic card, and in one place (Historique) it isn't reflected in the copy at all.

**Deterministic scan**: `detect.mjs --json` against the three files returned exit code 0, zero findings. Clean scan, but see below — a clean mechanical scan didn't catch the structural issues a manual read did, because they're semantic (right color, wrong condition) rather than pattern violations.

**Manual structural pass** (in place of live browser evidence, which was skipped per standing project instruction not to start the dev server or connect to the site): confirmed several issues independently of the design read — missing accessible name/value on the `<progress>` element, a stale-icon-without-label in `HistoriqueRow` with no `aria-label`/`title`, and a copy string ("il y a plus de 2 ans") that duplicates the `fundingWindowCutoff` business constant instead of deriving from it. These corroborate rather than contradict the design review below.

### Overall Impression

The page does its core job — a club officer sees "reste 450,00 €" in reassuring green within one screen, with correct French currency formatting and clean server-rendering for the primary content. The biggest opportunity is that the one place this page tries to say something domain-specific (a Subvention is "ancienne" and at risk) currently borrows the same red/error visual language CONTEXT.md explicitly says a Warning must not use, and that same signal goes fully silent (icon, no words) the moment a Subvention crosses into Historique — the exact place where it stops being spendable and the user would most need to be told.

### What's Working

1. **Correct, consistent money formatting.** `formatCents` / `Intl.NumberFormat("fr-FR", …)` is used everywhere via a shared module — no ad hoc string concatenation of currency.
2. **Bordered-Lift Rule and Status Color Contract followed on the primary card.** `SubventionCard` pairs `border border-base-300` with `shadow-md` as DESIGN.md requires, and the success/error pairing on amount + progress bar is applied consistently (never decorative) — until the stale-warning case below.
3. **Perceived-performance choice is right for the page's job.** Current Subventions render server-side with zero network wait (the reassurance the user opened the page for); only the deferred Historique needs client state.

### Priority Issues

- **[P0] Historique's stale icon is uninformative by construction, and unlabeled.** Every row shown in Historique is, by the section's own definition, >2 years old — so `HistoriqueRow`'s `stale` flag is always `true` there, and the `TriangleAlert` (`historique-section.tsx:82`) fires on literally every row, forever, carrying zero information. It also has no adjacent text, `aria-label`, or `title` — unlike the two other stale indicators on this page ("Campagne ancienne", "Subvention ancienne — risque de refus par l'Admin."), which both pair the icon with visible text. A screen-reader user gets nothing from it at all.
  **Why it matters**: A permanently-firing warning icon trains users to ignore warnings generally, and the accessibility gap means some users never get even that (false) signal.
  **Fix**: Drop the icon from Historique rows (redundant given the section already means "old"), or repurpose it to signal something that actually varies — e.g. a nonzero remaining balance that's now stranded.
  **Suggested command**: `/impeccable clarify`

- **[P1] Non-blocking "Warning" rendered in error/red, contradicting product semantics.** CONTEXT.md defines a Warning as something that "informs but never blocks — the Admin always has final say." Both the campaign-level "Campagne ancienne" and card-level "Subvention ancienne — risque de refus par l'Admin." (`subventions-by-campaign.tsx:59-64, 100-105`) use `text-error` exclusively — the same red DESIGN.md's Status Color Contract Rule reserves for genuine blocking/error states.
  **Why it matters**: For a first-year club officer with no financial training, red text + a triangle-alert icon + a red progress bar reads as "you broke something," not "this is just old" — an unearned anxiety spike on money the Structure did nothing wrong to receive.
  **Fix**: Switch this specific warning to the `warning` (orange) token family, reserving red for actionable overage/rejection states.
  **Suggested command**: `/impeccable colorize`

- **[P1] No indication that Historique Subventions are no longer usable.** Per `line-warnings.ts`, a Subvention past the 2-year window "disparaît complètement du panneau de sélection" for new Notes de frais — but Historique still shows "X € restants" with the same visual weight as an active, spendable balance.
  **Why it matters**: A club officer could reasonably plan a purchase around a number that's actually inert, and only discover the mismatch when submitting a Note de frais fails to offer that Subvention.
  **Fix**: Add a short explicit line near the figure, e.g. "Non utilisable pour une nouvelle Note de frais."
  **Suggested command**: `/impeccable clarify`

- **[P2] Progress-bar color is driven by date, not by the value it displays.** `subvention.stale` (a date-based flag) — not whether `remainingAmountCents` is negative — drives `text-success`/`progress-success` vs `text-error` on the card (`subventions-by-campaign.tsx:87-96`). An over-spent-but-not-yet-stale Subvention would render "reste -50,00 €" in green/success styling — the color would say "fine" on a number that says the opposite. Not confirmed to occur today (may be prevented upstream), but nothing in these three files guards it.
  **Why it matters**: If it can occur, this is a trust-breaking mismatch on a page whose whole job is giving an accurate balance signal.
  **Fix**: Derive the color from `remainingAmountCents < 0` in addition to (or instead of) `stale`, and confirm upstream whether overspend is actually preventable.
  **Suggested command**: `/impeccable audit`

- **[P2] Historique fetch failure is a dead end.** `handleToggle` only fetches `if (next && state === "idle")` (`historique-section.tsx:17-29`); once `state` becomes `"error"`, closing and reopening the panel never retries — the user is stranded on "Impossible de charger l'historique." with no retry control and no reason given (`.catch(() => setState("error"))` swallows the actual error).
  **Why it matters**: A first-time user has no recovery path and no way to tell if this is temporary or permanent.
  **Fix**: Add a retry button, and reset `state` to `"idle"` on collapse so reopening re-attempts the fetch.
  **Suggested command**: `/impeccable harden`

### Persona Red Flags

**Jordan (First-Timer, matches this page's actual audience — high-turnover student officers with no financial training)**: The `badge-primary` type tags ("CA Budget", "CA Event", "CA Exceptionnel") are internal admin taxonomy dumped verbatim into the UI with zero tooltip or glossary — CONTEXT.md itself needs a full paragraph to define these for staff. Combined with "reste 450,00 €" sitting directly under a red "risque de refus" warning with no explanation of _why_ age matters or _what to do about it_, Jordan is left anxious with no next action to take.

**Sam (Accessibility-Dependent)**: The only `aria-label` anywhere in this surface is on the Historique toggle checkbox. The native `<progress>` elements carry no `aria-label`/`aria-valuetext`, so with multiple cards on a page a screen-reader user gets a bare percentage with no indication of which Subvention it belongs to. The Historique stale icon (P0 above) is invisible to screen readers entirely — icon, no text, no accessible name.

**Riley (Stress Tester)**: An Asso with zero _current_ campaigns but nonempty Historique gets the top-level "Aucune Subvention publiée pour l'instant." message (`page.tsx:22-25`) sitting directly above a Historique section that actually has data — a contradictory empty-state claim the user must scroll past and disprove themselves.

### Minor Observations

- The magic string "Subventions publiées il y a plus de 2 ans." (`historique-section.tsx:42`) is hand-written rather than derived from the `fundingWindowCutoff` constant in `visible-subventions.ts` — a future change to the cutoff window would silently desync the displayed copy from actual behavior.
- Vertical spacing in `page.tsx` (`mt-2`, `mt-6`, `mt-10`) is ad hoc rather than drawn from DESIGN.md's stated spacing scale.
- `campaign.stale` in `subventions-by-campaign.tsx` is derived from only the first grouped item — correct today (staleness is uniform per campaign) but not structurally guaranteed at that call site.
- DESIGN.md names the `stats` DaisyUI component as the system's answer to at-a-glance rollups; this page — whose entire emotional job is "reassure me about grant money remaining" — has no single total-across-campaigns figure, despite that component existing for exactly this purpose.

### Questions to Consider

1. If a "Subvention ancienne" Warning "never blocks" per CONTEXT.md, why does its only visual language on this page (red text, red progress bar, error icon) look exactly like something the Structure broke?
2. The Historique section hides Subventions the Structure can no longer act on — but still shows a "restants" figure. Is that number doing anything useful for the user, or would it be more honest to omit or relabel it?
