# Part 04 — Widgets home and first run

**Depends on:** 03. **Changes code:** yes (Widgets screen; additive REST if AUDIT.md says data is missing).

## Goal

Rebuild the Widgets screen: totals, top reels and the widgets table once a store is set up; the three-step guide before that.

## Look at

- `design/screens/ScreenWidgets.png`, `ScreenFirstRun.png`
- `design/components/MetricBand.png`, `WidgetTable.png`, `Menu.png`, `ReelStack.png`, `ShortcodeChip.png`, `StepGuide.png`, `EmptyState.png`, `Dialog.png` (ConfirmDialog)
- `design/reference/screens.jsx` → `ScreenWidgets`, `ScreenFirstRun`
- `design/docs/flows.md` → "Widgets (home)"
- AUDIT.md section 13 (data)

## Do

1. **Data.** For anything AUDIT.md marked missing, make the smallest additive REST change: a query parameter, an extra response field, or a new read-only admin route with the same `permission_callback` as the existing admin routes. Use `$wpdb->prepare()`, keep queries indexed, and cache heavy aggregates in a prefixed transient cleared by the existing cache-clear paths.
2. **MetricBand**: Views, Clicks, Click rate, Reels in use ("7 of 8"; hint via `_n()`: "1 reel isn't in a widget" / "%d reels aren't in a widget", or "Every reel is in a widget").
3. **Top reels**: the six most-viewed reels, each a `ReelTile` (no title, product, play or views overlay) with a rank badge, the title, views and click rate under it. Clicking opens that reel in the reel editor. Link "See all reels" goes to Reels. Hide the section if fewer than three reels have views.
4. **WidgetTable**: ReelStack (first three reels, circles for circle-shaped widgets), name linking to the editor, LayoutBadge, `#id`, reel count, ShortcodeChip, views, clicks, click rate ("—" with no views), created date (WordPress date format). Row actions: **Edit** button and a `more` Menu with Statistics, Duplicate, Copy shortcode, a separator, Delete widget. Search filters by name. Sort by Created (default, newest first) and any column 1.0.0 already sorts by.
5. **Delete** uses ConfirmDialog: title `Delete “%s”?`, body "Pages that use its shortcode or block will show nothing. Its reels stay in your library.", button "Delete widget"; toast "Widget deleted". **Duplicate** toasts "Widget duplicated" and highlights the new row.
6. **First run** (`StepGuide`): done = 0 with no reels; 1 with reels but no widgets; 2 with widgets but zero total views. Show the guide instead of the band, top reels and table until any widget has a view. Step buttons: Add reel (opens the reel editor; part 06 restyles it), Create widget (opens the create flow; part 07), Copy shortcode (first widget's shortcode).
7. **States**: loading shows the band with placeholders and three skeleton rows; an error shows a danger Notice "Couldn't load your widgets." with the server message and "Try again"; a search with no match shows EmptyState `No widgets match “%s”` with "Clear search".
8. **Header actions**: search, "Add reel" (secondary), "Create widget" (primary).

## Don't

- Change any existing REST response field.
- Count views differently from 1.0.0: the totals must equal what 1.0.0 showed.

## Done when

- [ ] Matches `ScreenWidgets.png` and `ScreenFirstRun.png` at 1440px.
- [ ] Totals equal the 1.0.0 dashboard's numbers on the same data.
- [ ] Every row action works and is keyboard reachable; Delete asks first.
- [ ] Loading, error and no-results states all render (simulate the error).
- [ ] New or changed REST routes have `permission_callback`, sanitised args, and are listed in PROGRESS.md.

## Hand-off

Commit `1.1.0 part 04: widgets home`. Tell the user to open ProductReels → Widgets, with and without data.
