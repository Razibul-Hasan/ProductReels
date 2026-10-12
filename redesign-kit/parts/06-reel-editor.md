# Part 06 — Add / edit reel sheet

**Depends on:** 05. **Changes code:** yes (reel editor UI). **Data:** same payload as 1.0.0.

## Goal

Replace the Add/Edit Reel modal with the wide sheet: live player preview on the left, and Video, Title, Cover and "Shop this reel" on the right.

## Look at

- `design/screens/ScreenReelEditor.png`
- `design/components/SourcePicker.png`, `VideoList.png`, `Filmstrip.png`, `ShopLinks.png`, `ProductPicker.png`, `LinkForm.png`, `Tabs.png`, `Dialog.png`, `ReelPlayer.png`
- `design/reference/components.jsx` → `ReelEditor`, `SourcePicker`, `VideoList`, `Filmstrip`, `ShopLinks`, `ProductPicker`, `LinkForm`
- `design/docs/flows.md` → "Add or edit a reel"

## Do

1. **Sheet**: wide `Dialog` titled "Add reel" or "Edit reel", description "One vertical video and the products it sells." Left column on `--pr-studio`: the real storefront player in compact mode, updating live as fields change, captioned "How it looks when it opens". Right column scrolls.
2. **Video**: `SourcePicker` with Upload (drop zone plus "Choose from Media Library" via `wp.media`, MP4/WebM only), YouTube Shorts, Vimeo, Video link. Links are one per line. Keep 1.0.0's validation rules, but reword errors to name the line and the fix (e.g. "Line 2 is not a YouTube Shorts link. Links look like youtube.com/shorts/abc123."). `VideoList` shows each video with upload progress, Move up / Move down buttons and Remove.
3. **Title** field with the help text from the PNG.
4. **Cover**: `Filmstrip`. Generate 10 frames by seeking a muted, `crossOrigin="anonymous"` video element and drawing to canvas, but only once the Cover section is visible. Dragging or arrow-keying the playhead picks the frame; "Upload image" uses `wp.media`; "Use first frame" clears the custom cover. For YouTube, Vimeo or cross-origin videos where canvas capture fails, show the warn Notice from `Filmstrip.png` instead of the strip. Reuse 1.0.0's capture-and-save logic for storing the chosen frame.
5. **Shop this reel**: `ShopLinks` with two options. "Tag products" opens `ProductPicker` (search by name or SKU, multi-select, out-of-stock badge, confirm button "Tag %d products"); with WooCommerce inactive it shows the warn Notice instead. "Add a button" opens `LinkForm` (Button text, Campaign, Link, Open in a new tab, CSS class). Use a nested Dialog or swap the sheet's right column: either way, Escape returns to the sheet, not out of it.
6. **Validation**: 1.0.0 requires at least one video and at least one product or button. Keep Save enabled and show the footer note in `--pr-warn` naming what's missing ("Add a video and a product or button to save this reel."); on Save, move focus to the first problem.
7. **Saving**: "Save reel" → toast "Reel saved"; the library and any open widget editor refresh. Closing with unsaved changes asks "Discard changes to this reel?" with "Keep editing" / "Discard".
8. **Entry points**: Reels "Add reel", reel card title/Edit, Widgets "Add reel", top reels, the editor's Reels step (part 08), first-run step 1.

## Don't

- Change the saved reel payload or REST calls.
- Autoplay sound in the preview.

## Done when

- [ ] Matches `ScreenReelEditor.png`; nested pickers match their PNGs.
- [ ] Add, edit, reorder videos, pick a cover, tag products, add a button, save: all work, and the saved reel plays the same on the storefront as before.
- [ ] Cross-origin video shows the Notice instead of a broken strip.
- [ ] WooCommerce deactivated: product tagging shows the Notice; buttons still work.
- [ ] Fully keyboard operable; focus returns to the opener on close.

## Hand-off

Commit `1.1.0 part 06: reel editor`.
