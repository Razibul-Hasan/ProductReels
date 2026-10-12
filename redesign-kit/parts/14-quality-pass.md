# Part 14 — Accessibility, RTL, translations, responsive, clean-up

**Depends on:** 04–13. **Changes code:** fixes and removals only.

## Goal

Bring the whole update to release quality and remove what the redesign replaced.

## Do

1. **Keyboard and screen reader**: tab through every screen and dialog. Every control is reachable, has a visible `--pr-focus-ring`, and has a name. Dialogs and menus trap and return focus. Live regions announce toasts, reorders and bulk results. Fix what fails.
2. **Contrast**: spot-check that text uses the token pairs the brand book allows (no `--pr-ink-muted` on `--pr-surface-sunken` for small text where it fails; no text on `--pr-brand-soft` except ink, ink-muted or brand).
3. **Reduced motion**: with `prefers-reduced-motion: reduce`, the marquee is static and transitions don't animate.
4. **RTL**: switch the site language to Arabic or Hebrew (or use an RTL tester plugin) and check every admin screen and the storefront. Icons that imply direction (arrows, chevrons) flip; logos and media don't.
5. **Translations**: every new string is wrapped with the text domain; no string concatenation for sentences; `_n()` for counts; translator comments (`/* translators: … */`) on every `sprintf` placeholder. Regenerate the POT the way AUDIT.md says (e.g. `wp i18n make-pot`). Check `wp_set_script_translations()` covers each script handle that has strings.
6. **Responsive**: every admin screen at 1440, 1280, 1024, 782 and 600px; storefront at 375, 768 and 1280px.
7. **Remove replaced code**: old screens, components and styles no longer imported; the old token aliases from part 01 once nothing uses them; the old "Create Widget" screen (its redirect stays). List every removal in PROGRESS.md.
8. **Size report**: built admin and storefront JS/CSS sizes for 1.0.0 vs now in PROGRESS.md. Investigate anything more than about 20% larger.
9. **Errors**: with `WP_DEBUG`, `WP_DEBUG_LOG` and `SCRIPT_DEBUG` on, use every screen and a storefront page: no PHP notices, no console errors or React warnings.

## Done when

- [ ] Every item above is checked, with findings and fixes in PROGRESS.md.
- [ ] `checklists/regression-1.0-to-1.1.md` passes on a site upgraded from 1.0.0.

## Hand-off

Commit `1.1.0 part 14: quality pass`.
