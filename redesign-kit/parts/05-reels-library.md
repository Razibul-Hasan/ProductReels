# Part 05 — Reels library

**Depends on:** 04. **Changes code:** yes (Reels screen; additive REST for filters and counts).

## Goal

Rebuild the Reels screen as a visual library with filters, search, bulk delete and paging.

## Look at

- `design/screens/ScreenReels.png`
- `design/components/ReelCard.png`, `FilterChips.png`, `FloatingBar.png`, `EmptyState.png`, `Checkbox.png`
- `design/reference/screens.jsx` → `ScreenReels`
- `design/docs/flows.md` → "Reels library"

## Do

1. **Header**: title "Reels" with count, the description from the PNG, search ("Search reels"), primary "Add reel".
2. **FilterChips**: All, Tagged products, With a button, Not in a widget, each with its count. Filtering and counts happen on the server (additive query parameter such as `filter=products|buttons|unused`, plus counts in the response or a small counts route). Counts follow the search query.
3. **Grid** of `ReelCard`s: `grid-template-columns: repeat(auto-fill, minmax(156px, 1fr))` (eight across at 1440px). Each card shows the real cover image (fall back to the first frame or a neutral `--pr-surface-sunken` 9:16 block), views, the source icon for YouTube Shorts, Vimeo or a link, the title, products/buttons count and "In N widgets" / "Not in a widget" (`_n()`).
4. **Card actions**: clicking the title opens the reel editor; the play button previews the reel in the real storefront player (in a `pr-portal`); `more` holds Preview, Edit, Delete.
5. **View toggle** Grid/List (Segmented, icon-only). List view is a table: cover, title, products, buttons, widgets, views, actions. Remember the choice per browser in `localStorage`, wrapped in try/catch.
6. **Bulk delete**: hovering shows each card's checkbox; once any is selected all checkboxes stay visible, and the FloatingBar shows "%d reels selected" (`_n()`), "Clear", and "Delete selected". Confirm with title "Delete %d reels?" and body "They'll be removed from every widget they're in. This can't be undone."; toast "%d reels deleted". Use the existing bulk endpoint, or call the existing delete endpoint per reel if there's none.
7. **Paging**: "Load more" button under the grid with "Showing %1$d of %2$d" beside it. Keep the page size 1.0.0 uses.
8. **States**: skeleton cards while loading; EmptyState "No reels yet" with "Add reel"; EmptyState `No reels match “%s”` with "Clear search"; an empty filter says which filter is on, with "Show all reels"; a danger Notice with "Try again" on error.

## Don't

- Load every reel at once to compute counts in the browser.
- Ship autoplaying video in the grid: covers only; video plays only in Preview.

## Done when

- [ ] Matches `ScreenReels.png` at 1440px; three columns at 782px; two at 600px.
- [ ] Filter counts are correct and follow search.
- [ ] Bulk delete removes the reels from every widget (check a widget that used one).
- [ ] Load more appends without duplicates.
- [ ] Every action works by keyboard; the checkbox is reachable without hover.

## Hand-off

Commit `1.1.0 part 05: reels library`.
