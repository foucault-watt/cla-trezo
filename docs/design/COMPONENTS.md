# Design reference

Living notes on UI decisions, captured from `/prototype` sessions so we don't
re-litigate them each time. Update this file whenever a prototype session
lands on a direction; don't restate things daisyUI's own docs already cover.

## Expense report creation workflow

- Two guided tabs: **Dépenses & justificatifs**, then **Bénéficiaire & envoi**.
- Justificatifs stay directly below the reimbursement grid; there is no recap
  step during creation. Submission, draft deletion and back navigation live on
  the beneficiary tab.
- Editable reimbursement rows are direct-entry spreadsheet rows. Never require
  a preliminary “Modifier” action: inputs and selects are always visible. A
  complete row autosaves after a short idle delay or when focus leaves it;
  Enter saves immediately.
- Keep save feedback icon-only beside the row actions, after delete: DaisyUI
  Info loader while saving, Success check when saved, Warning when incomplete,
  and Error on failure. The Alerts column is only for business warnings.
- In the creation flow, call reimbursement rows “Dépenses”. When the grid is
  empty, replace its irrelevant columns and zero total with a contrasted add
  prompt. The upload drop zone sits directly in the Justificatifs section;
  never wrap it in a second bordered card.
- The former recap page is retained only as a read-only detail for historical
  or no-longer-editable reports.
- Beneficiary and IBAN also autosave as one unit. Changing the beneficiary
  never reuses the previous person's IBAN, and submission persists the visible
  beneficiary together with the status transition in one transaction.

## Navigation — sidebar + drawer

Decided over two other options (top navbar + dropdown, sidebar + bottom dock).

- Sidebar fixed at `lg+` (`lg:drawer-open`), collapses behind a hamburger
  below that, using daisyUI's `drawer` component.
- Shared by every top-level section (`admin`, member `[assoSlug]`) via
  `components/nav/sidebar-drawer.tsx` — don't reimplement per layout.
- User info + logout live at the bottom of the sidebar/drawer panel, not in
  a separate top bar.
- The mobile top bar (hamburger + section name) only exists at `<lg`; at
  `lg+` there's no equivalent bar, the sidebar is just always there.

## List/grid toggle (associations page, and any similar list of entities)

- Give the user an explicit toggle between a dense list and a card grid,
  visible immediately on the page (button pair using daisyUI `join`, icons
  from lucide: `List` / `LayoutGrid`), not a settings-menu option.
- List is the default — denser, faster to scan for someone checking many
  rows at once. Grid is opt-in, for when visual scanning per-item matters
  more than density.
- A stats bar (daisyUI `stats`) sits above **both** modes, unconditionally.
  It's the answer to "what's the state of the world" before diving into
  individual rows/cards — always show it, don't gate it behind a mode.

## Notes de frais list (member `[assoSlug]/notes-de-frais`) — grouped by year, no list/grid toggle

Deliberate exception to the list/grid toggle above, once the list started
spanning several years of archives. Iterated directly in the app (not via
`/prototype`) across three live variants — a flat list with a toolbar, this
grouped-by-year layout, and a chip-based year/status switcher — **the
grouped-by-year layout won**, implemented in `expense-reports-list.tsx`.

- No `ViewToggle` on this page — same reasoning as the Subventions page:
  grouping by year is the one piece of context that matters once there's
  more than a year of history, and a flat grid would lose it.
- A `sticky top-0` toolbar (search input + status `select` + conditional
  "Réinitialiser") sits above the grouped content, so filters stay visible
  while scrolling a long multi-year list. The status filter is a plain
  daisyUI `select`, not the `filter` chip component — tried once, rejected
  as visually noisy for a single-select field with five options.
- Content is grouped into year sections (`YearSection`: year, count,
  subtotal — same header shape as `FundingSourcesPanel`'s Solde/Subvention
  cards), current year + previous year open by default
  (`splitRecentAndHistorique`, `report-grouping.ts`). Older years stay
  behind a single "Historique — avant {année} (N)" button that reveals all
  of them at once — no per-year `collapse-arrow`, one click covers the
  whole archive rather than folding/unfolding year by year.
- Search and status filters apply to both the open sections and the hidden
  historique in the same pass, so the "Historique" button's count already
  reflects the active filters instead of always showing the raw total.
- Reused as-is for the Admin `notes-de-frais` list (`AdminExpenseReportsList`,
  `app/app/admin/notes-de-frais/_components/`) — same layout, same
  interactions, only the row swaps the description subtitle for the Asso
  name (Admin sees every Structure) and drops `DRAFT` from the status
  `select` (a Note never reaches the Admin list before being submitted).
- Reused a third time for the Admin `subventions` list (Campagnes,
  `CampaignsList` in `app/app/admin/subventions/_components/`) — same
  layout again, status `select` swapped for `CampaignStatus`
  (`Programmée`/`Publiée`, `lib/subventions/status.ts`), row shows
  `{type} {name}` with no subtitle (a Campagne has no equivalent of the
  Asso-name/description line). The member-facing `[assoSlug]/subventions`
  page is a deliberate exception to this pattern (see below) — this
  grouped-by-year treatment is Admin-only.
- The grouping helpers (`splitRecentAndHistorique`, `groupByYear`) live in
  `lib/year-grouping.ts`, generic over any item via a `getDate`/
  `getAmountCents` accessor (not a fixed `createdAt`/`totalAmountCents`
  field name) — needed once a third shape (`SubventionCampaignOverview`,
  dated by `date` not `createdAt`) joined the two Note de frais overviews.
  All three list pages share one implementation instead of copies
  drifting apart. The short-date formatter used by every dense row
  (`formatShortDate`) lives in `lib/dates.ts`, generic for the same reason.

## Status/badge placement rule

**Never put a variable-width status badge as the first element of a row.**
Text length varies (`À jour` vs `Attention` vs `Bloqué`), so if it leads a
row-based layout, every column after it shifts per-row and nothing lines up.

Two ways to respect this:

- Put a **fixed-width indicator** first instead — a small colored dot
  (`size-2.5 rounded-full bg-{success,warning,error}`), never text.
- Put the **full text badge last** in the row — trailing width changes
  don't affect anything else's alignment.

The list view on the associations page does both: a dot at the start, the
descriptive badge at the end.

## Elevation: base-100 / base-200 / base-300

Neither daisyUI's `card` nor `stats` sets its own background — both are
transparent by default. Without an explicit `bg-*`, they just show whatever
is behind them, which is why a page can look flat even with borders and
shadows on everything: border + shadow with no background contrast reads as
barely-there.

The fix is a three-step ladder, applied consistently:

- **Canvas** (`bg-base-200`) — set once, at the layout level
  (`components/nav/sidebar-drawer.tsx`'s `<main>`), not per-page. This is the
  "floor" everything else sits on.
- **Surface** (`bg-base-100` + `border border-base-300` + `shadow-md`) — every
  card, stats bar, and list container gets all three. The background makes it
  visually solid, the border gives it a crisp edge, the shadow lifts it off
  the canvas. Missing any one of the three and it looks flat again.
- **Divider / zebra** (`base-300` for borders and dividers, `base-200` for
  zebra-striping _inside_ an already-elevated surface) — reserve `base-300`
  for lines that need to be visible against either base-100 or base-200.

Don't stack tinted wrappers (e.g. a `bg-base-200/60` div around a grid of
`bg-base-100` cards) once the canvas itself is already `base-200` — that was
the earlier approach in the grid view and became redundant/muddy once the
canvas got its own tone. One layer of "floor" is enough; let the cards' own
`shadow-md` do the lifting.

The sidebar/nav chrome is the one exception: it stays `bg-base-100` (not
canvas-toned) with a `border-base-300` edge, so it always reads as distinct
chrome rather than another content surface.

This ladder is applied everywhere there's a canvas + surface relationship,
not just the associations pages: the admin section (via `SidebarDrawer`),
the member `[assoSlug]` section (same shared component), the structure
picker at `/app`, and the `/login` card.

**Don't rely on daisyUI's `card-border` modifier** — it hardcodes
`border-color: var(--color-base-200)`, which is invisible once the page
canvas is `base-200` (the border and the background it sits on become the
same color). Use `border border-base-300` instead, same as everywhere else
in this ladder. This bit us once already (`grid-view.tsx`, `solde-card.tsx`,
`manual-movement-form.tsx` all used bare
`card-border` and went invisible) — grep for `card-border` before adding a
new card and swap it for the explicit border.

## Funding source preview (notes de frais detail page)

Decided over two other options (a full-page dashboard with sources behind a
drawer, a "+" FAB opening a modal with sources chosen via a chip row) —
prototyped as `/prototype` variants A/B/C on the expense report detail page.

- The Club's Solde and available Subventions are shown in a dedicated
  `FundingSourcesPanel`, sticky at `lg+` (`lg:sticky lg:top-4`) alongside the
  Lignes table, and folded into a `collapse-arrow` accordion below `lg`
  (labelled "Mes sources de financement"). Same component, same data, just
  repositioned — no separate mobile-only variant.
- Each Subvention is its own `card` with a `progress` bar (remaining /
  total) and a `collapse` for its free-text `commentary`, so the detail is
  there without competing with the scan-at-a-glance total.
- The Solde card shows the balance up top and folds its last movements into
  a `collapse` ("Historique (N)") — same reasoning: totals visible, detail
  one click away.
- Rejected: a `drawer`-based sources panel (variant C) — behind an extra
  click just to see the balance, and reusing the nav drawer primitive for
  unrelated content read as clutter, not clarity.

## Justificatif exclusivity (Facture(s) vs Attestation sur l'honneur) — for T10

Not yet built (no upload backend exists — `SupportingDocument` is a bare
Prisma model with no actions wired up), but the layout direction was
validated during the same prototype session, to reuse once T10 lands:

- Two big selectable `card`s side by side (radio input + label + a line of
  description text under each), not a `tabs` bar. Rejected the tabs version
  (variant A) — no room for the "when to use this instead" explanation text,
  and the exclusivity read as a display grouping rather than a real choice.
- Each card gets its own short description (e.g. "Un ou plusieurs
  reçus/factures." / "Uniquement sans facture disponible.") directly under
  the label — that description is the main reason this style won over tabs.

## Subventions page (member `[assoSlug]/subventions`) — grouped by Campagne, no list/grid toggle

Deliberate exception to the list/grid toggle convention above. Prototyped as
`/design` variants A/B/C (A: sectioned card grid per Campagne; B: "enveloppe"
Campagne cards with Subventions as nested rows; C: circular gauges with
Type-based accent colors) — **A won** and is implemented in
`subventions-by-campaign.tsx`.

- No `ViewToggle` on this page — a flat list/grid of Subventions loses the
  Campagne grouping, which is the one piece of context (who granted this, as
  part of what) that actually matters when scanning. Group by `campaignId`
  first (not `campaignName` — names aren't guaranteed unique), one `section`
  per Campagne in encounter order.
- Each Campagne section: `badge-primary` (Type) + name + date, a
  `border-b border-base-300` rule, then a `grid sm:grid-cols-2` of Subvention
  cards — same shape as the single-Campagne case in `FundingSourcesPanel`
  (`progress` bar, `value={remainingAmountCents} max={totalAmountCents}`,
  `progress-success`/`progress-error` on `stale`), reused here instead of
  reinvented. `commentary`, when present, renders as a plain
  `text-xs italic` line directly under the card content — no
  `collapse`/"Détail" accordion: a one-click reveal for a single short line
  of text was more interaction than the content justified.
- The `progress` bar fills with **remaining**, not used — it drains as the
  Subvention is spent rather than filling up. Matches the existing
  `FundingSourcesPanel` convention; keep it consistent if this pattern shows
  up elsewhere rather than picking the opposite convention per page.
- Campagnes are split into three age bands by **publication date** (never
  the Campagne's own date), cf. `lib/subventions/subvention-age.ts` — the
  same rule the Note de frais funding-source panel and the "Subvention
  ancienne" Warning use, so the three can never disagree. "Récentes" (≤ 1
  year) stay open; "Subventions de plus d'un an" (≤ 2 years) is collapsed with a
  `text-error` flag, and every Subvention card in it gets the same warning
  line as `FundingSourcesPanel` — staleness is a Campagne-level fact, so all
  cards in a stale section render red together, never mixed; "Historique"
  (> 2 years, outside the funding window) is collapsed and compact.

## Page structure (list-style admin pages)

```
header row: title + description (left) — actions: view toggle, primary CTA (right)
stats bar (always)
content: list view OR grid view, switched via ?view=list|grid
```

This shape is meant to be reused for the other admin sections (notes de
frais, subventions, rapports) rather than reinvented per page.

## Page header

One header style for every page inside the app (admin, member, dev labs):

- `h1` is `text-2xl font-semibold`, description underneath is
  `mt-1 text-sm text-base-content/70`. No bigger/bolder `text-3xl font-bold`
  variant, and no small sur-titre ("Administration", "Développement") above
  the title — the section breadcrumb already says where you are.
- Detail pages get a `BackLink` (`components/nav/back-link.tsx`) above the
  title, pointing at the parent list ("Toutes les Notes de frais", "Toutes
  les Associations"…), then the header at `mt-3`. Never a bare "← " text
  arrow, never a `btn`.

## Stats bar

Every row of key figures goes through `StatsBar` + `Stat`
(`components/ui/stats.tsx`): daisyUI `stats` on a surface, `stat-value
text-2xl`, optional `stat-desc`. Below `sm` the figures sit in a 2-column
grid (`stat-value` down to `text-xl` so amounts fit a half column, an odd
last figure spans both columns); horizontal from `sm` up. No `stat-figure` icons, and no hand-rolled
grid of mini-cards — a page's key figures should look the same whether it's
a dashboard or a list page.

## Home page (`/app`) — enriched cards, admin section as a collapsible grid

Iterated directly in the app across three live variants switched via
`?variant=a|b|c` (A: enriched card grid + `collapse-arrow` Admin section; B:
personal `stats` bar + native tabs between "Mes Assos"/"Toutes les Assos"; C:
`hero` banner with avatar/date + horizontally-scrollable member cards +
compact Admin "gateway" panel) — the final page is a deliberate mix, not a
single variant:

- Header row from **B**: `Bonjour {prénom}` + subtitle on the left, the
  Admin button (`ShieldUser`, "Administration") on the right, stacking on
  mobile (`flex-col sm:flex-row sm:items-center sm:justify-between`). B's
  `stats` bar and tabs were dropped — decided as unneeded chrome for this
  page once the header alone did the job.
- "Mes Assos" cards from **C**: `Building2` + type badge top-right, name,
  role, Solde, and an explicit `btn btn-primary btn-block` "Ouvrir" pseudo-
  button (a `pointer-events-none` span, not nested inside the card's own
  `Link`). Laid out as a horizontally snap-scrolling row on mobile
  (`snap-x snap-mandatory`, cards `min-w-64 shrink-0 snap-start`) and a
  regular `grid sm:grid-cols-2 md:grid-cols-3` from `sm`. C's `hero` avatar
  (initials) and today's date were cut — reviewed as decorative, not useful
  information for this page.
- Admin "Autres Assos" section from **A**, not C: a `collapse-arrow`
  accordion (closed by default) titled "Autres Assos, accessibles en vue
  Admin (N)", opening onto the *same enriched card grid* as the member cards
  above it — type + status badges (status only shown when not `ACTIVE`,
  trailing per the badge-placement rule), Solde, and the
  subventions/notes-de-frais counts — dashed border to distinguish
  no-role Assos from the member's own. C's compact "gateway" summary (a few
  numbers + a link out to `/app/admin/associations`) was rejected here:
  once the grid Assos are shown anyway, a smaller summary duplicating the
  same data with less detail added a step rather than saving one.
- `MemberAssoCard` / `OtherAssoCard` (`app/app/_components/`) and the tiny
  `AssoSoldeInline` amount formatter are deliberately separate from the
  admin `associations` page's `AssoSoldeCell` — same ~10-line formatting
  logic, kept local rather than importing across an unrelated route's
  `_components` folder.
- Data: **one** `listAssociations()` call for both the member's own cards
  and the Admin's "other Assos" (a `Map` keyed by slug), not a per-Structure
  `getAssociationOverview` in `Promise.all` — that fired one query per
  Structure concurrently and exhausted the Neon dev connection pool
  ("Unable to start a transaction in the given time"). The one downside:
  `club-demo` (excluded from `listAssociations` via `EXCLUDE_DEMO_ASSO`)
  never resolves to an overview, so the demo user's own card falls back to
  the bare name/role display with no Solde/type — acceptable since it only
  affects the demo login.
