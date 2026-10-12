# Part 09 — Editor steps: Look, Player, Product card, Advanced, Place it

**Depends on:** 08. **Changes code:** yes (five editor steps).

## Goal

Finish the remaining editor steps. After this part the whole widget editor matches the design and every 1.0.0 setting has its final home.

## Look at

- `design/screens/ScreenStudioLook.png`
- `design/components/ColorField.png`, `Segmented.png`, `Toggle.png`, `RangeField.png`, `ProductCard.png`, `ShortcodeChip.png`, `BuilderPlaceholder.png`
- `design/reference/screens.jsx` → `ScreenStudioLook`
- `design/docs/flows.md` → Look, Player, Product card, Advanced and Place it rows
- AUDIT.md → stored keys

## Look ("What visitors see before they press play.")

- **Title**: Over video / Below / Hidden (stored as 1.0.0's Overlay / Only title / None), with the note "Reels tagged with a product show the product card instead."
- **Overlay**: Shade (colour + opacity) and Text colour.
- **Preview before play**: Off / On hover / When visible.
- **Hover effect**: Zoom in / Zoom out / Lift.
- **Play button**: Toggle; when on, Size, Colour and Hover colour.
- **View count**: Toggle; when on, Text colour and Icon colour.
- **Border and shadow**: Border width, Border colour, Corner radius, Shadow, Background.
- **Carousel arrows** (carousel only): Background and Icon colours, normal and hover.

## Player ("What opens when a shopper taps a reel.")

Slide direction (Horizontal / Vertical, with the helper "Sideways, or up and down like a feed."), Play with sound (with "Browsers start muted until a visitor taps once."), Loop, Seek bar, Volume control, Navigation button colours.

## Product card ("How tagged products appear.")

Style as two option cards with mini previews (Modern: compact row; Classic: image above details), Show ratings, Add to cart with its button text, Direct Checkout. Add to cart and Direct Checkout are exclusive: turning one on turns the other off, with an inline note saying so.

## Advanced

Lazy load videos (with "Loads each video only when it scrolls into view."), CSS class.

## Place it ("Put this widget on a page.")

1. The shortcode in a large ShortcodeChip, with "Paste it into any page, post or text widget."
2. Block editor: "Add the ProductReels block and choose “%s”." with a small illustration made from existing components, not an image.
3. Elementor: "Drag the ProductReels widget onto the page and choose “%s”."
4. Single reels: "To show one reel on its own, use `[productreels_reel id="…"]` with the reel's ID from the Reels screen."
5. Before the first save, this step shows "Save the widget to get its shortcode." with the Save button.

## Shared rules

- Each step fits its content in `PanelSection`s; conditional controls appear directly under the toggle that reveals them.
- Colour values that 1.0.0 stores as gradients or rgba keep their format.
- Live preview updates on every change.

## Done when

- [ ] Look matches `ScreenStudioLook.png`; the other steps use the same patterns.
- [ ] Every setting in AUDIT.md's editor map is now in its final step: none left in an "interim" place.
- [ ] Saved widgets render on the storefront exactly as they did in 1.0.0 when no setting was changed.
- [ ] Add to cart / Direct Checkout exclusivity works and saves.

## Hand-off

Commit `1.1.0 part 09: editor look, player, product card, advanced, place it`.
