# Part 01 — Foundations: tokens, fonts, type, icons, roots

**Depends on:** 00. **Changes code:** yes (styles, enqueue, one root class, Icon).

## Goal

Put the design system's foundations into the plugin without changing any screen's layout yet. After this part, every later part can use `var(--pr-…)`, `.pr-t-…`, `pr-*`/`prs-*` classes and the `Icon` component.

## Look at

- `design/css/pr-tokens.css`, `pr-fonts.css`, `pr-admin.css`, `prs-storefront.css`
- `design/fonts/` (two woff2 files and `OFL.txt`)
- `design/reference/icons.js` and the `Icon` export in `design/reference/components.jsx`
- `design/components/Icon.png`
- AUDIT.md sections 2, 3, 4, 5, 8

## Do

1. **Fonts.** Copy `design/fonts/*.woff2` and `OFL.txt` into the plugin's assets folder (AUDIT.md decides where, e.g. `assets/fonts/`). Keep `pr-fonts.css` next to them or bundle it into the admin stylesheet, fixing the relative `url()`s. Fonts load **only** on ProductReels admin screens: never on the storefront, other admin pages, or the block editor canvas.
2. **Tokens and type.** Add `pr-tokens.css` to the admin bundle and the storefront bundle. If the codebase uses SCSS, add it as a partial (e.g. `_pr-tokens.scss`) and import it first. Keep the custom-property form: don't convert tokens to SCSS variables, so merchants' per-widget overrides keep working.
3. **Component styles.** Add `pr-admin.css` to the admin bundle and `prs-storefront.css` to the storefront bundle (as partials if SCSS). The admin bundle must also include `prs-storefront.css`, because the editor previews real storefront components. Don't edit class names.
4. **Keep 1.0.0 screens working.** Unported screens still use the old styles and `_tokens.scss`. Map each old token to its nearest new one so the old screens pick up the new palette without breaking (e.g. old `$primary` → `var(--pr-brand)`). Record the mapping in PROGRESS.md; part 14 removes the old tokens. If a mapping would visibly break an old screen, leave that old token alone and note it.
5. **Roots.** Add class `pr-app` to the admin app's root element. Add class `prs` to every storefront widget root (shortcode, block and Elementor output). If any component portals into `document.body` (modals, popovers, toasts), make sure its container gets `pr-portal`.
6. **WP Admin fit.** The app should sit flush in `#wpcontent`: neutralise WordPress's left padding inside the app root only, keep core admin notices visible above the app, and keep the WP admin bar and sidebar untouched. Check at 1280px, 960px and 782px (WordPress's mobile breakpoint).
7. **Icon.** If `lucide-react` is a dependency, add a thin `Icon` wrapper with `strokeWidth={1.75}` and the same `name`/`size`/`label` props as the reference. Otherwise port `Icon` and the icons you'll need from `design/reference/icons.js` (keep the ISC licence comment). `label` makes it `role="img"` with `aria-label`; without it it's `aria-hidden`.
8. **Token rebuilds.** Mention in PROGRESS.md that `node redesign-kit/design/build-tokens.mjs` regenerates `pr-tokens.css` and `pr-fonts.css` from `tokens.json`, and where the copies live in the plugin.
9. **Enqueue hygiene.** Every new or changed `wp_enqueue_style`/`wp_enqueue_script` uses the plugin's version constant (or the `*.asset.php` version), loads only where needed, and declares dependencies.

## Don't

- Restyle or restructure any screen yet.
- Load anything from a CDN or Google Fonts.
- Put tokens on `:root` (they would leak into themes and other plugins).
- Bundle React or other WordPress-shipped libraries.

## Done when

- [x] On a ProductReels admin screen, `getComputedStyle(document.querySelector('.pr-app')).getPropertyValue('--pr-brand')` returns `#3044f2`. *(Verified in an Edge harness: real mount markup, WP admin CSS and the built bundle. Not yet in a logged-in wp-admin.)*
- [x] "ProductReels Archivo" loads on ProductReels screens (Network tab) and nowhere else: check Dashboard, Posts, the block editor, and a storefront page. *(Loads in the harness; no font requests on a storefront page with both shortcodes. Dashboard/Posts/block editor: by code, since the font style is registered only after the `is_productreels_screen()` guard. User to confirm.)*
- [x] Storefront widget roots carry `prs`, and the tokens resolve inside them. *(Live on plugin-dev.local: shortcode mount nodes, WidgetRenderer roots and the player portal all resolve `--pr-brand`; pixels unchanged.)*
- [x] Every 1.0.0 screen still works; only colours and the admin font have changed. *(Harness before/after at 1280/960/782 for widgets, reels, settings, editor: same layout, new palette and Archivo, plus the step-6 flush right edge. Unauthenticated, so data-filled states still need a logged-in check.)*
- [x] `Icon` renders the names used in `design/components/Icon.png`. *(All 69, side by side with the PNG.)*
- [x] Build and lint pass. *(Build passes. Lint: my files are clean; `npm run lint:js` still fails exactly as on 1.0.0 with ~14.6k Prettier CRLF errors from the Windows checkout plus 6 old ones in Player.jsx. PHP: `php -l` clean; phpcs not available here.)*

## Hand-off

Update PROGRESS.md (files, old-token mapping, decisions). Commit `1.1.0 part 01: design foundations`. Tell the user which screens to open to confirm nothing broke.
