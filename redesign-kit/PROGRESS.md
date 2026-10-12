# PROGRESS — ProductReels 1.1.0

Claude Code updates this at the end of every part. Newest notes at the bottom of each section.

## Parts

- [x] 00 Audit (no code changes)
- [x] 01 Foundations: tokens, fonts, type, icons, roots
- [ ] 02 Shared admin components
- [ ] 03 App shell, navigation and routes
- [ ] 04 Widgets home and first run
- [ ] 05 Reels library
- [ ] 06 Add / edit reel sheet
- [ ] 07 Create widget flow and editor shell
- [ ] 08 Editor steps: Reels and Layout
- [ ] 09 Editor steps: Look, Player, Product card, Advanced, Place it
- [ ] 10 Widget statistics
- [ ] 11 Settings
- [ ] 12 Storefront refresh
- [ ] 13 Block editor and Elementor
- [ ] 14 Accessibility, RTL, translations, responsive, clean-up
- [ ] 15 Release 1.1.0

## Log
<!-- Part NN — date — files changed — what to check -->
- Part 00 — 2026-10-12 — `redesign-kit/AUDIT.md` (filled in), `redesign-kit/PROGRESS.md`. No plugin code changed. Check: read AUDIT.md and answer the 8 questions in section 14. Setup also added `CLAUDE.md` (kit snippet) and `.claude/commands/pr-part.md`.
- Part 01 — 2026-10-12 — Design foundations. New: `admin/fonts/` (2 woff2 + OFL.txt), `admin/css/productreels-fonts.css`, `src/shared/styles/_pr-tokens.scss`, `src/shared/styles/_prs-storefront.scss`, `admin/src/styles/_pr-admin.scss`, `src/shared/Icon.jsx`, `src/shared/icons.js`. Changed: `admin/class-productreels-admin.php` (font style `productreels-admin-fonts`, a dependency of `productreels-admin`), `admin/partials/productreels-admin-display.php` (`pr-app` on `#productreels-admin-app`), `admin/src/style.scss`, `public/src/style.scss`, `admin/src/styles/_tokens.scss` (old → new mapping), `admin/src/styles/_base.scss` (flush right edge), `includes/frontend/class-productreels-shortcodes.php` (`prs` on both mount nodes), `src/shared/WidgetRenderer.jsx` (`prs` on the root), `src/shared/player/Player.jsx` (`prs` on `.wr-portal-root`), `package.json` (`admin/fonts/` in `files`). Check: every ProductReels screen (Widgets, Reels, Settings, Create/Edit widget, Statistics) looks the same apart from the blue-violet palette and Archivo, and now reaches the right edge; Network tab shows `Archivo-Variable.woff2` only on ProductReels screens; a page with `[productreels id]` looks unchanged.

## Decisions
<!-- Question → answer (who decided) -->
- Release exclusion of `redesign-kit/` → no `.distignore` needed: `npm run zip` packs only `package.json` → `files`, which doesn't list the kit (Claude, setup).
- Q1 git setup → branch `release/1.1.0` from `5fe2583`; kit + CLAUDE.md + `.claude/commands` committed there first (`b642d8c`); no tag (user, part 01).
- Font placement → static files, not bundled: `admin/fonts/*.woff2` + `admin/css/productreels-fonts.css` (the kit's `pr-fonts.css`, unchanged; its `../fonts/` URLs resolve as is). Registered as `productreels-admin-fonts` (ver `PRODUCTREELS_VERSION`) and declared as a dependency of the `productreels-admin` style, so it loads only where the admin bundle does. Keeps webpack from emitting hashed font files into the plugin root (Claude, part 01).
- Design CSS as SCSS partials, unchanged apart from a header comment: `src/shared/styles/_pr-tokens.scss` and `_prs-storefront.scss` (both bundles), `admin/src/styles/_pr-admin.scss` (admin). Load order: `pr-tokens` → old tokens/base → `pr-admin` → `prs-storefront` → 1.0.0 ui/screens → `embed` → `player`. The design layer comes before the 1.0.0 rules so unported screens and the storefront keep winning ties; e.g. `.prs { color: var(--pr-ink) }` loses to `.productreels-embed { color: inherit }`, so shoppers keep the theme's text colour. Parts 02–12 can reorder as they port (Claude, part 01).
- `prs` placement → on the PHP mount nodes (shortcode, block and Elementor all go through `widget_markup()`/`reel_markup()`), on `WidgetRenderer`'s root (so the admin preview carries it too) and on the player portal `.wr-portal-root`. The player portal gets `prs`, not `pr-portal`: it is shopper UI, and `.pr-portal` would give it the admin font in the editor preview. Admin portals: the IconButton tooltip already portals into `#productreels-admin-app` and `Modal` renders inline, so nothing else needs `pr-portal` yet; part 02's Dialog/Menu/Toast portals must add it (Claude, part 01).
- WP admin fit → `#productreels-admin-app` now also has `margin-inline-end: -20px`, cancelling `.productreels-wrap`'s end padding, so the app is flush with `#wpcontent` on both sides. Core notices keep their gutter above the app. Checked at 1280/960/782: flush, no horizontal scroll (Claude, part 01).
- Old → new token mapping (`admin/src/styles/_tokens.scss`, colours and font only; radii, shadows and easing keep their 1.0.0 values so no layout moves): `--wr-primary` → `--pr-brand`; `-primary-fg` → `--pr-on-brand`; `-primary-hover` → `--pr-brand-strong`; `-primary-subtle` → `--pr-brand-soft`; `--wr-fg` → `--pr-ink`; `-fg-muted` → `--pr-ink-muted`; `-fg-subtle` → `--pr-ink-disabled`; `--wr-bg` → `--pr-surface`; `-bg-muted` → `--pr-canvas`; `-bg-sunken` → `--pr-surface-sunken`; `--wr-border` → `--pr-line`; `-border-strong` → `--pr-line-strong` (darker than 1.0.0's, the design's control-border role; nothing broke); `--wr-ring` → `--pr-brand`; `--wr-danger` → `--pr-danger`; `-danger-subtle` → `--pr-danger-soft`; `--wr-success` → `--pr-ok`; `--wr-warning` → `--pr-warn`; `--wr-scrim` → `--pr-scrim`; `--wr-font` → `--pr-font-sans`; `--wr-font-mono` → `--pr-font-mono`. Unchanged: `--wr-radius-*`, `--wr-shadow-*`, `--wr-ease`. Storefront `--wr-*` style variables (from `styleVars()`) are untouched (Claude, part 01).
- Token rebuilds → `node redesign-kit/design/build-tokens.mjs` regenerates `redesign-kit/design/css/pr-tokens.css` and `pr-fonts.css` from `tokens.json`. Then copy `pr-tokens.css` over `src/shared/styles/_pr-tokens.scss` (keep the 3-line header) and `pr-fonts.css` over `admin/css/productreels-fonts.css`, and run `npm run build` (Claude, part 01).
- Icon → no `lucide-react`, so `Icon` is ported to `src/shared/Icon.jsx` (shared, because the storefront needs it too), with all 69 icons from `icons.js` in `src/shared/icons.js` (ISC notice kept). Same props as the reference: `name`, `size`, `strokeWidth`, `fill`, `className`, `label`, `style`. Import with `import { Icon } from '@shared/Icon';` (Claude, part 01).
- Open: AUDIT.md §14 questions 2–8 (git setup, test site, home totals, dropped settings + play-button hover colour, logo, upgrade runner, Tested up to, upload progress). Awaiting user.

## Follow-ups and removal candidates
<!-- Things later parts must handle -->
- Part 01: new font folder must be added to `package.json` → `files` (allowlist), or it won't ship.
- Part 15: `THIRD-PARTY-NOTICES.txt` is listed in `package.json` → `files` but doesn't exist; create it (Lucide ISC, Archivo OFL, dnd-kit MIT) or drop the entry.
- Part 15: use the existing `Productreels_Migrations` runner (`PRODUCTREELS_DB_VERSION` / `productreels_db_version`) and `Productreels_Render_Cache::bump()` (pending question 6).
- Parts 07–09: keep the 1.0.0 settings the design omits reachable (AUDIT §12 list); UI slider ranges must not clamp stored values outside them.
- Part 13: block attribute `widgetId` stays a string.
- Part 14 candidates: `admin/src/components/icons/index.js`, `ui/*` primitives and `wr-*` admin styles once fully replaced; `PosterCapture.js` once Filmstrip lands.
- Part 02 (Toggle) / part 14: the RTL build double-flips the design's `[dir="rtl"] .pr-switch[aria-checked="true"]::after` rule (rtlcss turns the base into `translateX(-16px)` and the override into `+16px`), so the knob moves the wrong way in RTL. Fix when porting Toggle, e.g. with `/*rtl:ignore*/` or by using a logical property.
- Part 12: `Icon` imports the whole `ICONS` map (~11 KB). Admin is fine; if the storefront only needs a few icons, consider a smaller storefront map.
- Part 12: the design layer loads before `embed.scss`/`player.scss` on purpose (see Decisions). When the storefront is ported, drop the 1.0.0 rules it replaces rather than reordering.
- Part 14 candidates: the `--wr-*` admin tokens in `admin/src/styles/_tokens.scss` (now just aliases) once no `wr-*` admin styles remain.
- Tooling: `npm run lint:js` fails on 1.0.0 too: ~14.6k `prettier/prettier` "Delete ␍" errors because the Windows checkout is CRLF (`core.autocrlf`) and wp-scripts' Prettier wants LF, plus 6 old formatting errors in `src/shared/player/Player.jsx`. Lint single files with `tr -d '\r' < FILE | npx eslint --stdin --stdin-filename FILE`. A `.gitattributes` with `* text=auto eol=lf` would fix it for good (user's call; touches every file).
- Tooling: Local's PHP is at `%APPDATA%/Local/lightning-services/php-8.2.29+0/bin/win64/php.exe` (`php -l` works). WordPress can be bootstrapped read-only from the CLI with `-n -d extension_dir=<that dir>/ext -d extension=mysqli -d mysqli.default_port=10005 -d mysqli.default_host=127.0.0.1`. Playwright works with the system Edge: `chromium.launch({ channel: 'msedge' })`, plus `--disable-features=BlockInsecurePrivateNetworkRequests,LocalNetworkAccessChecks` when routing pages on plugin-dev.local.
- Tooling: no PHP/phpcs/WP-CLI on this terminal's PATH; `lint:php`, `make-pot` and Plugin Check need Local's site shell.

## REST and data changes (all additive)
<!-- Route / param / field / table change — part — permission -->
- Proposed only (part 00, not built): `GET /overview` (admin_permission); `widget_count` field and `filter` arg on `GET /reels`; `GET /reels/counts` (admin_permission). See AUDIT §13.
