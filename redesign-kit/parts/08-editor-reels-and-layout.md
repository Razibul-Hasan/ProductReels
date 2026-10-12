# Part 08 — Editor steps: Reels and Layout

**Depends on:** 07. **Changes code:** yes (two editor steps).

## Goal

Finish the Reels and Layout steps exactly as designed.

## Look at

- `design/screens/ScreenStudioReels.png`, `ScreenStudioLayout.png`
- `design/components/ReelRow.png`, `ReelPicker.png`, `TemplatePicker.png`, `RangeField.png`, `Segmented.png`, `ColorField.png`, `Toggle.png`
- `design/reference/screens.jsx` → `ScreenStudioReels`, `ScreenStudioLayout`
- `design/docs/flows.md` → the Reels and Layout rows of the settings table
- AUDIT.md → the stored key for each setting

## Reels step

1. "Reels", "Drag to set the order they appear in." List of `ReelRow`s in page order: grip, cover, title, what it sells (tagged product name, "Custom button", or "No links"), Preview, "Remove from this widget".
2. Reordering by drag (the library 1.0.0 uses) **and** keyboard: focus the grip, Space lifts, arrows move, Space drops, Escape cancels, with a polite live-region announcement ("Glow serum moved to position 2 of 5").
3. "Add from your library": SearchField, an IconButton "Add new reel" that opens the reel sheet (the new reel is added to this widget on save), and `ReelPicker` (tap to add or remove; added reels show the check). Load more for long libraries.
4. Empty widget: the stage shows EmptyState "Add reels to see your widget" and the panel focuses the library search.

## Layout step

1. `TemplatePicker` (list variant) for Grid, Carousel, Marquee, Stacked, Popup.
2. **Shape**: Segmented Rectangle / Circle.
3. **Size and spacing** with a device indicator on the section title (icon and the device name) when the setting is responsive: Reel width (RangeField), Gap, Space above, Space below, Alignment (Left / Center / Right, icon Segmented).
4. **Per layout**, shown only for that layout:
   - Carousel: Arrows Outside / Inside.
   - Marquee: Speed, Direction (Left / Right), Pause on hover.
   - Stacked: Depth, Offset, Scale.
   - Popup: Trigger (On page load / After a delay / After scrolling) with its delay in seconds or distance in % or px as 1.0.0 stores it; Corner (four-option Segmented); Show on mobile; Show again (Next page, Next visit, After 1 day, After 7 days, After 30 days).
5. **Title**: Position (Left / Center / Right / Hidden), Size, Colour, Space above, Space below, plus a Reset that restores this section's defaults.
6. Every change updates the stage immediately; dragging sliders updates live.

## Don't

- Rename stored keys or change their units. If 1.0.0 stores a value in a unit the design doesn't show, display it as stored.

## Done when

- [ ] Both steps match their PNGs at 1440px.
- [ ] Every Reels and Layout setting from AUDIT.md is present, saves, reloads, and changes the storefront the same way as 1.0.0.
- [ ] Keyboard reordering works, with announcements.
- [ ] Per-device values stay independent (change mobile gap, desktop gap unchanged).

## Hand-off

Commit `1.1.0 part 08: editor reels and layout`.
