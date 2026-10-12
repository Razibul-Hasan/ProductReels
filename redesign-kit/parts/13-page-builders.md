# Part 13 — Block editor and Elementor

**Depends on:** 12. **Changes code:** yes (block editor UI, Elementor editor placeholder).

## Goal

Make choosing a widget in the block editor and Elementor clear, while fitting each builder's own conventions.

## Look at

- `design/components/BuilderPlaceholder.png`, `Notice.png`
- `design/docs/components.md` → BuilderPlaceholder
- AUDIT.md section 9

## Block editor

1. Before a widget is chosen, use core `Placeholder` (from `@wordpress/components`) with the ProductReels icon, label "ProductReels", the instruction "Choose which widget shows here.", a searchable widget picker (`ComboboxControl`, or `SelectControl` if the list is short), and links "Create widget" and "Open ProductReels". This follows editor conventions, matching the intent of the design's placeholder in the editor's own style.
2. After choosing: the live widget renders (as 1.0.0). The sidebar (`InspectorControls`) keeps the picker, plus "Edit widget" (opens the editor for that widget in a new tab) and "Open ProductReels".
3. If the chosen widget no longer exists: a core `Notice` (error) "This widget was deleted. Choose another or create one." with the picker.
4. Don't load Archivo or `pr-admin.css` into the editor canvas. Storefront CSS loads in the canvas so the preview is accurate.
5. Keep the block name, attributes and render. Leave `block.json` `version` to part 15.

## Elementor

1. Placeholder before a widget is chosen, in Elementor's editor only: the ProductReels name and "Choose a widget in the panel." on a light surface with a dashed `--pr-line-strong` border.
2. Control labels in the panel: "Widget", plus a link control or description "Create widgets in ProductReels → Widgets." Same control IDs as 1.0.0.

## Done when

- [ ] New block shows the placeholder; choosing a widget renders it; the sidebar links work; a deleted widget shows the notice.
- [ ] Existing posts with 1.0.0 blocks open without "This block contains unexpected or invalid content".
- [ ] Elementor: placeholder before choosing, live widget after; existing Elementor pages unchanged.

## Hand-off

Commit `1.1.0 part 13: page builders`.
