# Part 03 — App shell, navigation and routes

**Depends on:** 02. **Changes code:** yes (header, menu labels, routes, redirects, guard).

## Goal

Give every screen the new frame: the ProductReels app bar, page headers, three sections, and routes that still accept every 1.0.0 link.

## Look at

- `design/components/AppHeader.png`, `PageHeader.png`
- `design/screens/ScreenWidgets.png` (top 200px), `ScreenStudioLayout.png` (editor hides the app bar)
- `design/docs/flows.md` → "Map"
- AUDIT.md sections 3 and 5

## Do

1. **AppHeader.** Replace the 1.0.0 top bar: wordmark "ProductReels" in `.pr-t-display-sm`, version badge (from the version constant passed to JS), three nav pills (Widgets, Reels, Settings) with the current one in ink, and "Documentation" on the right (existing docs URL, new tab, `rel="noopener noreferrer"`, an external-link icon and a visually hidden "(opens in a new tab)"). If the plugin ships its logo mark (AUDIT.md), place it at 28px before the wordmark; otherwise wordmark only.
2. **PageHeader** on every list and settings page: title in `.pr-t-display` with optional count, one-sentence description, actions on the right with the primary last. Use the copy from the screen PNGs.
3. **WP admin submenu.** Labels become Widgets, Reels, Settings, in that order. Remove the separate "Create Widget" submenu item, but keep its old slug or route working: it now opens Widgets with the Create widget dialog open (part 07 builds the dialog; until then send it to the 1.0.0 create screen). Keep the top-level menu slug, icon, position and capability.
4. **Routes.** Widgets (home), Widget editor (new and edit), Statistics (per widget), Reels, Settings. Keep whatever URL format 1.0.0 uses, and map every 1.0.0 route to its 1.1.0 equivalent so bookmarks still work.
5. **Editor frame.** The widget editor hides the app bar and fills the content area (as in 1.0.0). Keep that switch in one place in the shell.
6. **Unsaved-changes guard.** One shared guard for in-app navigation and `beforeunload`. Copy: title "Leave without saving?", body "Your changes to %s will be lost.", buttons "Keep editing" and "Leave".
7. **Toast host** bottom-centre, above floating bars, inside a `pr-portal`.
8. **Responsive.** Below 960px the nav pills scroll horizontally; below 782px page gutters drop to `--pr-space-5` and page-header actions wrap under the title.
9. **Document title.** Set `document.title` per screen (e.g. "Reels ‹ ProductReels ‹ Site — WordPress"), following WordPress's pattern.

## Don't

- Change the screens' content yet. Old screen bodies render inside the new shell.
- Remove the old create screen's PHP until part 14.

## Done when

- [ ] The app bar matches `AppHeader.png`; the current section is highlighted on every screen.
- [ ] Every 1.0.0 admin URL (list them from AUDIT.md) still opens the right place.
- [ ] The WP submenu shows Widgets, Reels, Settings, and the right one is highlighted as current.
- [ ] Leaving a dirty editor asks first, both for in-app links and for closing the tab.
- [ ] Works at 1440, 1280, 960 and 782px wide.

## Hand-off

PROGRESS.md: the old → new URL map. Commit `1.1.0 part 03: app shell and navigation`.
