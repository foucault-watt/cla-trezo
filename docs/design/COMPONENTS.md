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

## Card contrast

A `card` sitting directly on the page background with only `card-border`
reads as flat. Give the grid a tinted backing (`bg-base-200/60` wrapper) and
put a real `shadow-md` + `border-base-300` on each card so cards read as
distinct surfaces, not just outlined boxes.

## Page structure (list-style admin pages)

```
header row: title + description (left) — actions: view toggle, primary CTA (right)
stats bar (always)
content: list view OR grid view, switched via ?view=list|grid
```

This shape is meant to be reused for the other admin sections (factures,
subventions, rapports) rather than reinvented per page.
