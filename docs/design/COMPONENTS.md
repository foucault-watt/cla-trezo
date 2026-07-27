# Design reference

Living notes on UI decisions, captured from `/prototype` sessions so we don't
re-litigate them each time. Update this file whenever a prototype session
lands on a direction; don't restate things daisyUI's own docs already cover.

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
  zebra-striping *inside* an already-elevated surface) — reserve `base-300`
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
`manual-movement-form.tsx`, `asso-type-picker.tsx` all used bare
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

## Page structure (list-style admin pages)

```
header row: title + description (left) — actions: view toggle, primary CTA (right)
stats bar (always)
content: list view OR grid view, switched via ?view=list|grid
```

This shape is meant to be reused for the other admin sections (notes de
frais, subventions, rapports) rather than reinvented per page.
