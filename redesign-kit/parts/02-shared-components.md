# Part 02 — Shared admin components

**Depends on:** 01. **Changes code:** yes (new component files; existing toast/dialog restyled).

## Goal

Build the reusable admin components once, so screen parts only compose them.

## Look at

- `design/docs/components.md`: rules for each component below
- `design/components/<Name>.png` for each one
- `design/reference/components.jsx`: the exports with the same names
- AUDIT.md sections 3 and 12 (where components live; what exists already)

## Build (in the components folder AUDIT.md chose)

Actions and status: `Button`, `IconButton`, `Badge`, `LayoutBadge` (with the `LAYOUTS` map), `Count`, `ShortcodeChip`, `Notice`, `Toast`, `FloatingBar`.

Navigation: `FilterChips`, `Tabs`, `Segmented`, `Menu`.

Forms: `Field`, `TextField`, `SearchField`, `Checkbox`, `Switch`, `Toggle`, `ColorField`, `RangeField`, `SettingRow`, `SettingsCard`.

Data and feedback: `MetricBand`, `BarCell`, `ReelStack`, `EmptyState`, and a `Skeleton` that isn't in the reference: rows or 9:16 cards in `--pr-surface-sunken`, with `aria-busy` on the container.

Dialogs: `Dialog` and `ConfirmDialog`.

## Behaviour the reference only sketches

- **Strings.** Wrap every default string in `__()` with the text domain. Counts use `_n()` with `sprintf()` (e.g. "%d reels selected").
- **Menu.** Opens from a `more` IconButton; positioned below the trigger, flipping up near the viewport bottom; arrow keys move, Enter activates, Escape closes and returns focus to the trigger; closes on outside click. Portal root gets `pr-portal`.
- **Dialog / ConfirmDialog.** Focus moves in on open (first field, or Cancel in a confirmation), is trapped, and returns to the opener on close; Escape and the close button cancel; `aria-modal`, `aria-labelledby`; page scroll is locked; the scrim is `--pr-scrim`. If 1.0.0 uses `@wordpress/components` `Modal`, you may wrap it and restyle it to match instead of building a new one: keep one dialog implementation.
- **Toast.** Restyle the existing toast system to the design (ink, bottom-centre, 5 seconds, paused while hovered or focused, optional single action). Keep its API so existing calls still work.
- **ShortcodeChip.** Copies with the Clipboard API, falling back to a hidden textarea and `execCommand('copy')`; shows the check for 2 seconds and fires the toast "Shortcode copied".
- **ColorField.** Opens the colour picker the plugin already uses (AUDIT.md) in a popover; supports opacity only when the setting stores it.
- **RangeField.** The value box is editable; arrow keys step 1, Shift+arrow steps 10; the fill updates the `--pr-fill` custom property.
- **Segmented.** `role="radiogroup"` with roving arrow-key focus.
- **Switch/Toggle.** `role="switch"`, `aria-checked`; the label states the "on" behaviour.
- **Number formatting.** Add one helper (e.g. `formatNumber`) using `Intl.NumberFormat` with the admin locale, used by every count and metric.

## Don't

- Rebuild a component that 1.0.0 already has with the same job: restyle and extend it to match the reference, keeping its props working for current callers.
- Change any screen layout yet (apart from the restyled toasts and dialogs appearing in their new look).

## Done when

- [x] Each component matches its PNG at 1440px (check by rendering it in a screen or a temporary story; remove temporary code before committing). *(All 24 PNGs compared with a temporary `#/__story` route in an Edge harness at 1440 (WP core admin CSS + built bundle), plus open Menu, Dialog, ConfirmDialog, colour popover, toasts over a floating bar. Story deleted before commit.)*
- [x] Keyboard: Menu, Dialog, Segmented, Switch, Checkbox, ShortcodeChip all work without a mouse, with a visible focus ring. *(57 scripted keyboard-only checks pass, incl. Tabs, RangeField, menu flip, nested Escape, focus trap/return, scroll lock, toast hover pause. Found and fixed: pr-admin's selected-state shadows cancelled the focus ring on the checked segment.)*
- [x] Existing toasts and dialogs in 1.0.0 screens still work, in the new style. *(Mocked REST in the harness: widget delete confirm + toast, reel editor (xl) with the link dialog stacked on it, settings save success/error toasts, unsaved-changes guard. Not yet in a logged-in wp-admin.)*
- [x] No hard-coded colours, font sizes or radii in component code. *(JS has only dynamic inline styles (positions, bar width, --pr-fill); `_pr-components.scss` uses tokens. The only hex in JS is splitColor's `#000000` fallback for an unreadable stored value, which is data, not styling.)*
- [x] Build and lint pass; no console warnings. *(Build passes (the entrypoint-size warning predates this part). ESLint clean on every new/changed file (CRLF-stripped for the two adapters); `ColorPicker.js` keeps 4 old Prettier errors on untouched lines (6 before). `_pr-components.scss` passes stylelint. No console errors or warnings in any harness run.)*

## Hand-off

PROGRESS.md: list the components and their paths. Commit `1.1.0 part 02: shared components`. Tell the user where they can already see the new toasts and dialogs.
