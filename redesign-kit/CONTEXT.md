# ProductReels 1.1.0 — shared context for every part

You are updating the **existing** ProductReels plugin (version 1.0.0, live on WordPress.org) to **version 1.1.0**: a new admin structure and look, and a refreshed storefront. It is the same plugin with the same data. Nothing a merchant has saved may be lost or changed, and every page that shows reels today must keep working after the update.

This file applies to every part. If a part and this file disagree, this file wins. If this file and the user disagree, the user wins: record the decision in `PROGRESS.md`.

## Read this first, every session

1. `redesign-kit/CONTEXT.md` (this file)
2. `redesign-kit/AUDIT.md`: the map of the 1.0.0 codebase, written in part 00. Use its file paths, names and keys; never guess them.
3. `redesign-kit/PROGRESS.md`: what earlier parts did, decisions, open follow-ups.
4. The part file you were asked to run, in `redesign-kit/parts/`.
5. The design files that part lists. Look at the PNGs with your image reader before you build.

Run one part per session. When a part is done, stop: don't start the next one.

## What's in the kit

| Path | What it is |
| --- | --- |
| `design/screens/*.png` | The 13 target screens at 1440px wide (admin inside WP Admin, storefront, player). The visual source of truth. |
| `design/components/*.png` | Every component, in its states |
| `design/reference/components.jsx` | Working React for every component, written against `@wordpress/element`. Markup and class names are final. Port it; don't redesign it. |
| `design/reference/screens.jsx` | How the components compose into each screen (with sample data) |
| `design/reference/icons.js` | The Lucide icon paths the design uses (ISC licence) |
| `design/css/pr-tokens.css` | All design tokens as `--pr-*` custom properties, plus the `.pr-t-*` type classes |
| `design/css/pr-fonts.css`, `design/fonts/` | Archivo and Archivo Expanded (SIL OFL 1.1), renamed "ProductReels Archivo" so they never collide with a theme's Archivo. Admin only. |
| `design/css/pr-admin.css` | Every admin component style (`pr-*`) |
| `design/css/prs-storefront.css` | Every storefront style (`prs-*`) |
| `design/reference/mock-only.css` | Styles for mockup-only helpers. Never ship. |
| `design/tokens.json`, `design/build-tokens.mjs` | Token source; regenerates the two token CSS files |
| `design/docs/flows.md` | The new information architecture: screens, flows, and which editor step holds every setting |
| `design/docs/brand-book.md` | Voice, colour, type, spacing, states, icons |
| `design/docs/components.md` | Usage rules for each component |
| `design/docs/storefront.md` | Storefront rules and defaults |
| `checklists/` | WordPress.org compliance and 1.0 → 1.1 regression checks |
| `templates/` | Upgrade routine and readme.txt changelog drafts |

`PosterArt`, `demo`, `WpAdminFrame` and anything marked MOCKUP ONLY exist only to draw the screenshots. Real screens use real reels, real covers and real data from the REST API.

## Non-negotiables: backward compatibility

The 1.0.0 → 1.1.0 update must be invisible to everything outside the admin UI except the refreshed storefront look.

- **Shortcodes** `[productreels id="X"]` and `[productreels_reel id="X"]` keep their names, attributes and output wrapper.
- **Gutenberg block**: same block name, same attributes, same saved markup (dynamic render). No block deprecation needed; if the saved markup must change, add a proper `deprecated` entry.
- **Elementor widget**: same widget name and control IDs.
- **REST API**: same namespace and routes. Existing response fields keep their names and types. You may add query parameters, response fields and new routes. Every new route has a real `permission_callback` (the same capability the admin routes use today). The public render endpoint keeps honouring the "Allow public fetch" setting.
- **Database**: never drop, rename or retype a table, column, option, post meta key or setting key. Schema additions go through `dbDelta()` in the upgrade routine (part 15).
- **Widget and reel settings**: the editor's new labels and grouping are UI only. Every control reads and writes the same stored key as 1.0.0 (AUDIT.md lists them). Never rewrite stored values to new defaults. A value the merchant saved always wins over a new default.
- **Admin URLs**: keep the top-level menu slug. Old links to "All Widgets", "All Reels", "Create Widget" and "Settings" still land somewhere sensible (part 03 adds redirects).
- **Capability checks** stay exactly as strict as 1.0.0.
- **Uninstall** behaviour is unchanged: data is deleted only when "Delete all data on uninstall" is on.

## WordPress.org rules: never break these

Full list with checks: `checklists/wporg-compliance.md`. The ones this redesign touches most:

- **No remote assets.** Fonts, icons, CSS and JS ship inside the plugin. No Google Fonts, no CDNs, no external images. (Guideline 8)
- **No tracking or phoning home.** View counting stays local, with visitor IPs hashed and never stored. No telemetry, no new external requests. (Guideline 7)
- **Use WordPress's libraries.** React comes from `@wordpress/element` via the dependency extraction plugin: never bundle React, ReactDOM, lodash, jQuery or anything WordPress ships. (Guideline 13)
- **No credits on the public site.** No "Powered by ProductReels" anywhere a shopper can see it. (Guideline 10)
- **Don't hijack the admin.** Assets and notices load only on ProductReels screens. No dashboard widgets, no nags, no upsell banners: every feature is free. (Guideline 11)
- **Human-readable code.** Built JS ships with its source in the plugin or a public repo link in readme.txt. (Guideline 4)
- **GPL-compatible.** Everything new: Lucide (ISC) and Archivo (SIL OFL 1.1, accepted by WordPress.org for bundled fonts). Credit both in readme.txt.
- **Version increments.** 1.1.0 in the plugin header, the version constant and `Stable tag`, set only in part 15. (Guideline 15)
- **Security on every new PHP path**: `defined( 'ABSPATH' ) || exit;`, capability checks, REST `permission_callback`, `sanitize_*` on input, `esc_*` on output, nonces (`wp_rest` via `apiFetch`) for writes, `$wpdb->prepare()` for queries.
- **Prefix everything global** with the plugin's existing prefix (AUDIT.md). New CSS custom properties are `--pr-*`/`--prs-*`; new classes `pr-*`/`prs-*`; new options, transients and hooks use the PHP prefix.
- **Translatable.** Every user-facing string goes through `__()`, `_n()`, `_x()` or `sprintf()` from `@wordpress/i18n` (JS) or the PHP equivalents, with the plugin's text domain. Counts always use `_n()`. Scripts get `wp_set_script_translations()`.
- **Plugin Check clean** at the end (part 15).

## Engineering rules

- **Work with the codebase, not around it.** Use its build setup, folder structure, state management, API client, router and naming. Don't add frameworks (no Tailwind, CSS-in-JS, UI kits, state libraries). Add a dependency only if AUDIT.md shows nothing existing can do the job, and say why in PROGRESS.md.
- **Port, don't paraphrase.** Copy markup and class names from `design/reference/components.jsx`. Split into files the way the codebase splits components. Replace `demo`/`PosterArt` with real data and real cover images.
- **Styles** live in the files part 01 creates from `design/css/`. Use tokens (`var(--pr-…)`) and type classes (`.pr-t-…`) for every value. No hex codes or pixel font sizes in component code. Inline styles only for dynamic values, preferably as custom properties (`style={{ '--prs-tile-w': … }}`).
- **Roots and portals.** The admin root element has class `pr-app`. Anything rendered outside it (dialogs, menus, popovers, toasts in a portal) gets class `pr-portal` on its portal root so tokens and type apply. Storefront widget roots have class `prs`.
- **Icons**: if `lucide-react` is already a dependency, use it with `strokeWidth={1.75}`. Otherwise port the `Icon` component and only the icons you use from `design/reference/icons.js`.
- **Accessibility** is part of done: visible `focus-ring` on everything focusable, labels on icon-only buttons, dialogs trap focus and return it, menus work with arrow keys and Escape, status is never colour alone, `prefers-reduced-motion` respected.
- **RTL**: use logical properties (`inset-inline-start`, `margin-inline-end`), as the design CSS already does.
- **No console errors or PHP notices** with `WP_DEBUG` and `SCRIPT_DEBUG` on.
- **Small, safe steps.** Each part leaves the plugin working. If a screen isn't redesigned yet it must still work in its 1.0.0 form.
- **Don't delete what you can't confirm is unused.** List candidates in PROGRESS.md; part 14 removes them.
- **Never** touch `node_modules/`, committed vendor code, or the user's other plugins and themes.

## Design rules in one screen

- Tokens are `--pr-<name>`; type styles are `.pr-t-<name>` (display-xl, display, metric, display-sm, title, heading, body, body-strong, label, small, caption, code).
- Admin is light on `--pr-canvas` with `--pr-surface` panels. Only the widget editor's preview stage and the shopper's player are dark (`--pr-studio`).
- One `primary` button per view. `--pr-spark` (pink) only for live things: view counts, the unsaved-changes badge, sale prices. Never on a button.
- Radius follows size: badges `xs`, buttons and inputs `sm`, panels `md`, dialogs `lg`, every 9:16 reel `reel`.
- Resting surfaces get a `--pr-line` edge, not a shadow. Shadows mean "this floats".
- Sentence case everywhere. No all-caps labels. Buttons are a verb plus the thing; the toast repeats it ("Save widget" → "Widget saved").
- Use the vocabulary exactly: **Reel, Widget, Layout, Look, Player, Product card, Place it, Tag products, Click rate**.
- The storefront inherits the theme's font. Archivo is admin only.

## How to check your work

- Run the project's build and lint scripts (AUDIT.md lists them). Fix what you broke; note pre-existing issues instead of fixing unrelated code.
- If a local WordPress is available (AUDIT.md says how: wp-env, Local, a staging URL), open the screen and compare it with its PNG. If you can take screenshots (Playwright is often available), do so and look at them side by side with the design.
- If you can't run WordPress, finish with a short "please check" list for the user: which screen, what to click, what they should see.

## Finishing a part

1. Tick every "Done when" box in the part file honestly. If one can't be met, say why.
2. Update `PROGRESS.md`: mark the part done, list changed files, decisions, follow-ups.
3. Commit with `1.1.0 part NN: <short summary>`. Never push, tag or touch SVN unless the user asks.
4. Tell the user in a few lines what changed and how to check it.

## When you're unsure

Stop and ask. Don't guess about stored keys, REST shapes, slugs, or anything that would change data. Write the question and answer into `PROGRESS.md` under Decisions.
