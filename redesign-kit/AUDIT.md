# AUDIT — ProductReels 1.0.0 codebase map

> Filled in by part 00 (2026-10-12) from commit `5fe2583` on `master`. Every later part reads this. Use real paths, names and keys. Paths are relative to the plugin root.

## 1. Identity
- Main plugin file: `productreels.php` (bootstraps `Productreels` in `includes/class-productreels.php`, which wires every hook through `Productreels_Loader`).
- Header: Plugin Name `ProductReels – Shoppable Video Reels for WooCommerce` / Version `1.0.0` / Requires at least `6.6` / Requires PHP `7.4` / Tested up to: **not in the PHP header** (only `readme.txt`: `Tested up to: 7.1`) / Text Domain `productreels` / Domain Path `/languages` / License `GPL-2.0-or-later` / `WC requires at least: 7.0`. Author `bestwpexpert`, Plugin URI `https://bestwebexpert.com/productreels/`.
- `readme.txt`: `Stable tag: 1.0.0`, `Tested up to: 7.1`, `Requires at least: 6.6`, `Requires PHP: 7.4`. Has an "External services" section (Vimeo oEmbed + Player SDK, YouTube thumbnails + IFrame API).
- Slug and folder: `productreels` / `wp-content/plugins/productreels/`.
- PHP prefix and/or namespace: no namespace. Classes `Productreels_*` (e.g. `Productreels_Widgets`), functions `productreels_*`, constants `PRODUCTREELS_*`, options/transients/hooks `productreels_*`. PHPCS `PrefixAllGlobals` enforces `productreels` / `Productreels` / `PRODUCTREELS`.
- Version constant: `PRODUCTREELS_VERSION` (`'1.0.0'`, `productreels.php`). Also `PRODUCTREELS_DB_VERSION` (`'1.0.0'`, schema revision), `PRODUCTREELS_FILE`, `PRODUCTREELS_PATH`, `PRODUCTREELS_URL`.
- Stored version option: **no plugin-version option**. The schema revision is stored in `productreels_db_version` (`Productreels_Migrations::OPTION`). `Productreels_Migrations::maybe_upgrade()` runs on `init` priority 5, compares it with `PRODUCTREELS_DB_VERSION`, runs `Productreels_Schema::install()` (dbDelta) and then each pending callback in `Productreels_Migrations::migrations()` (`'1.0.0' => migrate_1_0_0`, a no-op). **Part 15 should use this existing runner** (add `'1.1.0' => migrate_1_1_0` and bump `PRODUCTREELS_DB_VERSION`) rather than the template's new `productreels_version` option. See question 6.

## 2. Build
- package.json scripts: `build` (`wp-scripts build`), `start` (`wp-scripts start`), `lint:js` (`wp-scripts lint-js admin/src public/src src block/src`), `lint:js:fix`, `lint:php` (`phpcs`), `make-pot` (`wp i18n make-pot . languages/productreels.pot --exclude=node_modules,admin/dist,public/dist,block/dist,build,build-prompts,*.map --domain=productreels --slug=productreels`), `plugin-zip` (`wp-scripts plugin-zip --root-folder=productreels`), `zip` (build + plugin-zip).
- Key dependencies: devDependencies `@wordpress/scripts ^35.0.0`; dependencies `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2`. No `lucide-react`, no other UI or state library. `@wordpress/*` packages and React come from core handles (not in package.json). `playwright` is in `node_modules/.bin` (it ships with `@wordpress/scripts`); whether its browsers are installed hasn't been checked.
- Entry points → outputs (`webpack.config.js`, which extends the `@wordpress/scripts` default config; `output.path` is the plugin root and **`output.clean` must stay `false`**):
  - `admin/src/index.js` → `admin/dist/productreels-admin.js` + `style-productreels-admin.css` (+ `-rtl.css`) + `.asset.php`
  - `public/src/index.js` → `public/dist/productreels-public.js` + `style-productreels-public.css` (+ rtl) + `.asset.php`; lazy chunk `public/dist/productreels-player.js` (the Player, `chunkFilename: 'public/dist/[name].js?ver=[chunkhash]'`; `__webpack_public_path__` is set from `boot.pluginUrl`)
  - `block/src/index.js` → `block/dist/productreels-block.js` + `productreels-block.css` (+ rtl) + `.asset.php`
  - The webpack alias `@shared` → `src/shared/` (the render core that both admin and public import).
  - Elementor: no JS entry. It reuses the public bundle via `get_script_depends()` / `get_style_depends()` and loads one icon stylesheet, `admin/css/productreels-elementor.css`.
- How assets are enqueued: each PHP side `require`s its `*.asset.php` for dependencies and version.
  - Handles: `productreels-admin` (script + style, `Productreels_Admin::enqueue_assets`), `productreels-public` (`Productreels_Public::HANDLE`; registered on `wp_enqueue_scripts`, enqueued on `wp_footer` priority 5 only when a mount node called `Productreels_Public::request_assets()`), `productreels-block` (`Productreels_Block::HANDLE`, registered on `init`), `productreels-elementor-editor` (style).
  - The RTL stylesheets are swapped in with `wp_style_add_data( …, 'rtl', 'replace' )`.
- React externalised? Yes (dependency extraction via `@wordpress/scripts`). Built files committed? **No**: `dist` is in `.gitignore`, so `admin/dist`, `public/dist` and `block/dist` are untracked and rebuilt locally. The zip comes from `npm run zip`, which builds and then packs.
- **Release file list:** `package.json` → `files` is an allowlist. Anything new (e.g. a fonts folder or new PHP files outside `includes/`) **must be added to `files`** or it won't be in the zip. `admin/` is not wholly included: only `admin/index.php`, `admin/class-productreels-admin.php`, `admin/partials/`, `admin/css/`, `admin/images/`, `admin/dist/*`, `admin/src/`. The list also names `THIRD-PARTY-NOTICES.txt`, **which doesn't exist in the repo**.
- Lint / format / test / PHPCS commands: `npm run lint:js` (ESLint flat config `eslint.config.js`, the `@wordpress/scripts` ruleset); `npm run lint:php` → `phpcs` with `phpcs.xml.dist` (WordPress-Extra + WordPress-Docs, `minimum_wp_version` 6.6, `testVersion` 7.4-). **No PHP, phpcs, composer or WP-CLI is on PATH on this machine**, so `lint:php` and `make-pot` can't run here as things stand. No test suite, no Prettier config beyond what wp-scripts ships.

## 3. Admin app
- Mount point and root element: `admin/partials/productreels-admin-display.php` prints `<div class="wrap productreels-wrap"><h1 class="screen-reader-text">…</h1><div id="productreels-admin-app"></div></div>`. `admin/src/index.js` does `createRoot( #productreels-admin-app ).render( <App/> )`. `App` renders `<div className="wr-app">`, or `wr-app wr-app--editor` on the editor routes. PHP adds the body class `productreels-screen` on ProductReels screens.
- Bootstrap global: `window.productreelsAdmin` = `{ restUrl, nonce, defaults (default styles), settings, version, logoUrl, hasWoo, currency, storeApiNonce, cartUrl, checkoutUrl }` (`Productreels_Admin::bootstrap()` + `Productreels_WooCommerce::bootstrap()`).
- Router and URL format: a custom hash router in `admin/src/hooks/use-hash-route.js` (`parseRoute`, `useHashRoute`). Routes, all on `admin.php?page=productreels`:
  - `#/widgets` → `widgets` (also the default for an empty or unknown hash)
  - `#/widgets/new` → `widget-new`
  - `#/widgets/:id` → `widget-edit`
  - `#/widgets/:id/stats` → `widget-stats`
  - `#/reels` → `reels`
  - `#/settings` → `settings`
  - The same file has `useSubmenuHighlight` (it moves the WP submenu `current` class) and `useDocumentTitle` (sets "ProductReels - <screen> ‹ …").
- Screens (`admin/src/screens/`):
  - `WidgetsList.js`: home. Overview strip (`Overview`), widgets table with sortable columns (`SortHeader`), `ShortcodeChip`, `PosterStack`, `GettingStarted` (first run), `SkeletonRows`. Five icon buttons per row. It loads **every** widget (`per_page: 100` pages in a loop) and sorts and sums on the client.
  - `ReelsLibrary.js`: reel card grid (`ReelCard`), `SkeletonCards`, search, multi-select with a bulk-delete bar, Load more (`PAGE_SIZE = 60`), opens `ReelEditor` in a modal, previews with `Player`.
  - `ReelEditor.js`: add/edit reel modal. `SourcePicker` (`library`/`vimeo`/`youtube`/`hosted`), `UrlSourcePanel`, file list, title, poster (with `PosterCapture`), links (`LinkChip`, opens `LinkDialog`). Save is blocked until there is ≥1 file and ≥1 link.
  - `LinkDialog.js`: add/edit a link. `CustomTab` (button text, URL, new tab, campaign, CSS class) and `ProductsTab` (Woo product search, multi-select).
  - `PosterCapture.js`: scrub a video, capture a canvas frame, upload it to the media library.
  - `WidgetEditor.js`: editor shell. Header with name, shortcode, Discard, Duplicate, Delete, Save. Reel picker (`PickerCard`, `PICKER_PAGE = 24`, `exclude_widget`), sortable attached reels (`SortableReel`), live preview via `@shared/WidgetRenderer` with the `DEVICES` (desktop 100%, tablet 768px, mobile 390px) toggle, `StylePanel`, `TitleAppearanceDialog`.
  - `StylePanel.js`: every widget style control. Tabs "Thumbnail" (`LayoutSection`, `ThumbnailSection`, `StylesSection`, `AdvancedSection`) and "Player" (`PlayerAppearanceSection`, `PlaybackSection`, `NavButtonsSection`, `ProductCardSection`).
  - `TitleAppearanceDialog.js`: the `widgetTitle.*` settings in a dialog.
  - `Statistics.js`: one widget. `Tile` ×3, reels table and buttons table, both sortable on the client.
  - `Settings.js`: four `Card`s (View tracking, Public API, Performance, Data) with one Save. `cache_ttl` is shown in minutes (`MINUTE = 60`) and stored in seconds.
  - Styles: `screens.scss`, `editor.scss`, `reports.scss`, `widgets.scss`.
- Shared components (`admin/src/components/`):
  - `ui/Button.js`: `Button`, `IconButton` (its tooltip is portalled into the app root)
  - `ui/Choice.js`: `Select` (custom listbox; there is no native `<select>`), `Tabs`, `IconToggleGroup`, `VisualOptionCards`
  - `ui/ColorPicker.js`: `ColorPicker` (custom popover, 8-digit hex with alpha slider and session recents; native `<input type=color>` only as the eyedropper)
  - `ui/Feedback.js`: `Skeleton`, `EmptyState`, `Notice`, `CollapsibleSection`
  - `ui/Fields.js`: `Field`, `TextField`, `SearchInput`, `Switch`, `Checkbox` (switch and checkbox are ARIA buttons)
  - `ui/Modal.js`: `Modal`, `ConfirmDialog`
  - `ui/Sliders.js`: `Slider`, `ResponsiveSlider` (desktop/tablet/mobile tabs)
  - `ui/Toasts.js`: `ToastProvider`, `useToasts`
  - `ui/ui.scss`: all primitive styles
  - `icons/index.js`: about 30 hand-drawn `Icon*` components
  - Hooks: `hooks/use-debounced.js`, `hooks/use-dismiss.js`, `hooks/use-hash-route.js`, `hooks/use-unsaved-guard.js`
- Data fetching / API client: `admin/src/api/client.js` wraps `@wordpress/api-fetch` with the nonce and root-URL middlewares. It exports `get`, `post`, `put`, `del`, and `getList`, which returns `{ items, total, pages }` from the `X-WP-Total` / `X-WP-TotalPages` headers. Errors are normalised to `Error` with `.code` and `.status`. `admin/src/api/index.js` exports named resources: `widgets.{list,get,create,update,duplicate,remove,stats}`, `reels.{list,get,create,update,remove,bulkRemove,validateUrl}`, `products.search`, `settings.{get,update}`. Screens never build paths themselves. `admin/src/preview-services.js` gives the editor preview real product lookups and add-to-cart, with tracking disabled.
- Toasts: `ToastProvider` / `useToasts()` (`success`, `error`, loading toasts). Bottom-right stack, 4 s, pauses on hover.
- Unsaved-changes guard: `useUnsavedChanges( dirty )` (`hooks/use-unsaved-guard.js`) sets `UnsavedContext.setDirty` and adds `beforeunload`. `useHashRoute` intercepts hash changes while dirty, and `App` shows a `ConfirmDialog` ("You have unsaved changes. Leave this page without saving?" → Continue). Used by `WidgetEditor` (and other screens that hold a draft).
- Dialogs / modals: custom `ui/Modal.js`. It renders **inline** (`.wr-modal-root` inside the app, not a portal), moves focus in, traps it and restores it. `ConfirmDialog` is built on it. No `@wordpress/components` in the admin app.
- Drag and drop: `@dnd-kit/core` + `@dnd-kit/sortable` (`WidgetEditor.js`, `PointerSensor` with a 4px activation distance and a `KeyboardSensor` using `sortableKeyboardCoordinates`, `rectSortingStrategy`). Only the widget editor uses it. `ReelEditor.js` reorders links with move buttons (`LinkChip` `onMove`), not drag.
- Colour picker: the custom `ui/ColorPicker.js`, not wp-color-picker or `@wordpress/components`. Values are lowercase `#rgb[a]` / `#rrggbb[aa]` (validated by `Productreels_Validator::hex_color`).
- Media library usage: `wp_enqueue_media()` on the admin screen. `ReelEditor.js` opens `window.wp.media( … )` twice: video picking (source `native`) and poster image. `PosterCapture.js` uploads the captured frame to the media library.
- Icons: hand-authored set in `admin/src/components/icons/index.js` (24-grid, 1.6 stroke, `aria-hidden`). `lucide-react` is **not** a dependency, so later parts port `Icon` + the needed paths from `design/reference/icons.js`. Storefront icons are inline SVG inside `src/shared/*` (`PlayIcon.jsx`, `ViewsBadge.jsx`, player icons).

## 4. Styles
- Structure and entry files: `admin/src/style.scss` (`@use` order: `styles/tokens` → `styles/base` → `components/ui/ui` → `screens/screens` → `screens/editor` → `screens/reports` → `screens/widgets` → `../../src/shared/styles/embed` → `../../src/shared/styles/player`). The admin bundle includes the storefront styles so the preview is honest. `public/src/style.scss` imports the shared `embed.scss` and `player.scss`. `block/src/editor.scss` is separate. Sass with `@use`, compiled by wp-scripts, plus an RTL build.
- `_tokens.scss` contents (summary): custom properties declared on `#productreels-admin-app` (not `:root`), all `--wr-*`:
  - primary blue `#2563eb` (+ fg, hover, subtle)
  - fg, muted and subtle greys; bg, muted and sunken; border, border-strong, ring
  - danger, danger-subtle, success, warning
  - radius sm 6 / 10 / lg 16; shadow sm / md / lg
  - `--wr-font: 'Inter', -apple-system, …` (Inter is not bundled, so it only applies if installed locally), `--wr-font-mono`, `--wr-ease`, `--wr-scrim`
- Scoping and naming today:
  - Admin: everything is under `#productreels-admin-app` or `body.productreels-screen`. Classes are BEM-ish with the legacy **`wr-`** prefix (from the old WooReels name): `wr-app`, `wr-appbar__tab`, `wr-modal__head`, `wr-badge--youtube`, …
  - Storefront: the root class is `productreels-embed` (`--{device}`, `--align-*`, `--reveal`, `--in-editor`, `--single`) and inner classes are `wr-*` (`wr-widget-title`, `wr-embed-loading`, …). Style settings are passed as `--wr-*` custom properties by `src/shared/styleVars.js`.
  - The player portals into `.wr-portal-root` appended to `<body>`.
  - The new design's `pr-*`/`prs-*`/`--pr-*` names don't collide with any of this.

## 5. Admin menu
All are registered in `Productreels_Admin::register_menu()` on `admin_menu`. Capability `Productreels_Rest_Controller::CAPABILITY` = `manage_options`.

| Title | Slug | Capability | Callback | hook_suffix |
| --- | --- | --- | --- | --- |
| ProductReels (top level, `dashicons-format-video`) | `productreels` | `manage_options` | `render_app` | `toplevel_page_productreels` |
| All Widgets (replaces the auto duplicate) | `productreels` | `manage_options` | `render_app` | `toplevel_page_productreels` |
| All Reels | `productreels-reels` | `manage_options` | `__return_null`; `load-{hook}` → `redirect_to_route` → `admin.php?page=productreels#/reels` | `productreels_page_productreels-reels` |
| Create Widget | `productreels-new-widget` | `manage_options` | same → `#/widgets/new` | `productreels_page_productreels-new-widget` |
| Settings | `productreels-settings` | `manage_options` | same → `#/settings` | `productreels_page_productreels-settings` |

- The redirect map is `Productreels_Admin::REDIRECTS`. The submenu hook names follow WP's `sanitize_title( menu title )` convention for the parent ("productreels").
- Asset loading: `is_productreels_screen()` checks `strpos( $screen->id, 'productreels' )`. It doesn't compare against a fixed hook_suffix list. The same check drives `admin_footer_text` / `update_footer` (blanked), `admin_body_class` (`productreels-screen`) and `admin_title` (prefixed "ProductReels - ").
- Note: `strpos( $screen->id, 'productreels' )` would also match a third-party screen whose id contains "productreels". This is harmless today.

## 6. REST API
Namespace `productreels/v1`. Base class `Productreels_Rest_Controller` (extends `WP_REST_Controller`), registered by `Productreels_Rest::register_routes()` on `rest_api_init`.

Permission callbacks:
- `admin_permission` = `manage_options`
- `place_permission` = `manage_options` OR `edit_posts`
- `public_read_permission` = setting `allow_public_fetch`, or a valid `X-WP-Nonce` for `wp_rest`
- `track_permission` = always true

Lists send `X-WP-Total` / `X-WP-TotalPages` headers. Collection args (`collection_args()`): `page` ≥1 (default 1), `per_page` 1–100 (default 20), `search`, `orderby` (enum), `order` ASC|DESC. Errors are `WP_Error` with `productreels_*` codes and generic messages.

| Method | Route | permission_callback | Args | Response fields | Public? |
| --- | --- | --- | --- | --- | --- |
| GET | `/widgets` | `place_permission` | collection; orderby `id`\|`name`\|`created_at` | array of `{ id, name, slug, template, reel_count, view_total, click_total, posters[] (≤3 poster URLs in widget order), created_at, updated_at }` + headers | no |
| POST | `/widgets` | `admin_permission` | `name` string, `styles` object, `reel_ids` int[] | full widget (as GET `/widgets/:id`), 201 | no |
| GET | `/widgets/:id` | `place_permission` | `id` | `{ id, name, slug, styles (full validated object), reels[] (reel rows + `sort_order` + `files[]`), created_by, created_at, updated_at }` | no |
| PUT, PATCH | `/widgets/:id` | `admin_permission` | `id`, `name`, `styles`, `reel_ids` (any subset) | full widget | no |
| DELETE | `/widgets/:id` | `admin_permission` | `id` | `{ deleted: true, id }` | no |
| POST | `/widgets/:id/duplicate` | `admin_permission` | `id` | full widget (name "%s (Copy)"), 201 | no |
| GET | `/widgets/:id/stats` | `admin_permission` | `id`, `orderby` `click_count`\|`button_text`\|`campaign_name`\|`reel_title`, `order` | `{ reels: [{ reel_id, title, thumbnail, view_count, click_count, ctr }], buttons: [{ btn_uuid, reel_id, reelTitle, buttonText, buttonUrl, campaignName, clickCount }], totals: { views, clicks, ctr } }` (ctr is a percentage with 2 decimals) | no |
| GET | `/reels` | `admin_permission` | collection; orderby `id`\|`title`\|`view_count`\|`created_at`; `exclude_widget` int | array of reel rows `{ id, reel_uuid, title, thumbnail, links[], view_count, created_at, updated_at, file (first file or null) }` + headers | no |
| POST | `/reels` | `admin_permission` | `title`, `thumbnail`, `links` object[], `files` object[] | reel + `files[]`, 201. 400 `productreels_reel_no_files` / `productreels_reel_no_links` if empty | no |
| GET | `/reels/:id` | `admin_permission` | `id` | reel row + `files[]` | no |
| PUT, PATCH | `/reels/:id` | `admin_permission` | `id` + any of `title`, `thumbnail`, `links`, `files` (files replace wholesale) | reel + `files[]` | no |
| DELETE | `/reels/:id` | `admin_permission` | `id` | `{ deleted: true, id }` | no |
| POST | `/reels/bulk-delete` | `admin_permission` | `ids` int[] (required) | `{ deleted, failed[] }` | no |
| POST | `/reels/validate-url` | `admin_permission` | `url`, `source` (`native`\|`vimeo`\|`youtube`\|`hosted`, default `hosted`) | `Productreels_Media::describe()` result (`valid`, source, provider id, poster, mime…) or 400 `productreels_url_invalid` | no |
| GET | `/products` | `admin_permission` | `search`, `page`, `per_page` | array of `{ id, name, price_html, image, permalink, rating, rating_count, in_stock, purchasable }` + headers; empty with 200 if Woo is inactive | no |
| GET | `/products/batch` | `public_read_permission` | `ids` int[] (required, max 100) | same product shape; transient `productreels_products_{md5}` for 300 s | **yes** |
| GET | `/render/:id` | `public_read_permission` | `id` | `{ id, name, styles, reels: [{ id, reel_uuid, title, thumbnail, view_count, files[], links[] }] }`; transient-cached; `Cache-Control: public` for logged-out users when caching and public fetch are on | **yes, the public render endpoint** |
| GET | `/render/reel/:id` | `public_read_permission` | `id` | same shape with `id: 0`, `name: ''`, default styles with `template: 'grid'`, one reel | **yes** |
| POST | `/widgets/:wid/reels/:id/view` | `track_permission` | `wid` (≥0, 0 = standalone reel), `id` | `{ counted, view_count }`; 429 `productreels_view_rate_limited`; 404 if the reel isn't in the widget | **yes** |
| POST | `/track/click` | `track_permission` | `widget_id` (≥0), `reel_id`, `btn_uuid` | `{ counted }` (labels are copied from the stored link, never from the request; widget 0 isn't stored) | **yes** |
| GET | `/settings` | `admin_permission` | — | the six settings (section 7) | no |
| PUT, PATCH | `/settings` | `admin_permission` | any of the six keys (typed, ranged) | the full settings after the update; 400 if nothing valid was sent | no |

The block editor reads `/widgets?per_page=100&orderby=name&order=ASC` and `/widgets/:id` through `place_permission`. The Elementor widget reads the repository directly in PHP.

## 7. Data model
No CPTs, no post meta. Five custom tables (`Productreels_Schema::TABLES`, created through `dbDelta()` in `Productreels_Schema::statements()` / `install()`), one settings option, two bookkeeping options, and transients.

- **Reels**: `{prefix}productreels_reels`.
  - Columns: `id` PK; `reel_uuid` char(36) UNIQUE; `title` varchar(255); `thumbnail` text (cover URL); `links` longtext (JSON); `view_count` bigint (**lifetime views of the reel across every widget and the standalone shortcode**); `created_at`; `updated_at`.
  - Files: `{prefix}productreels_files`. Columns: `id`; `reel_id` (idx); `file_uuid` UNIQUE; `wp_media_id`; `url`; `mime_type`; `source` varchar(32) ∈ `native` (media library), `vimeo`, `youtube`, `hosted` (URL); `provider_id`; `poster_url`; `duration`; `created_at`; `updated_at`. Files are replaced wholesale on save; order = insertion `id`.
  - Repository: `Productreels_Reels`, `Productreels_Files`.
  - Untitled reels get "Untitled reel %d" (MAX(id)+1).
- **Widgets**: `{prefix}productreels_widgets`. Columns: `id`; `slug` varchar(191) UNIQUE (never changes on rename); `name`; `styles_json` longtext; `created_by`; `created_at`; `updated_at`.
  - Reel order: the pivot `{prefix}productreels_widget_reels`. Columns: `id`; `widget_id`; `reel_id`; `sort_order`; `created_at`. UNIQUE (`widget_id`,`reel_id`). Rewritten wholesale by `write_pivot()`.
  - Repository: `Productreels_Widgets`.
  - Deleting a widget removes its pivot rows and click rows but never its reels. Deleting a reel removes its files and pivot rows but **keeps its click rows**.
- **Links / tagged products**: JSON array in `reels.links`, validated by `Productreels_Validator::validate_links()`. Two shapes:
  - `{ btn_type: 'product', btn_uuid, product_id, buttonText }`
  - `{ btn_type: 'custom', btn_uuid, buttonText, buttonUrl, openInNewTab, campaignName, customClass }`
  - `btn_uuid` (v4) is the click-tracking key and must never be regenerated for an existing link.
  - A product link is a "tagged product"; a custom link is a "button".
  - A reel must have ≥1 file and ≥1 link (REST 400 otherwise).
- **Statistics**:
  - Views: `reels.view_count` only. There is **no per-widget or per-day view storage**. A widget's `view_total` is `SUM(view_count)` of its reels, so a reel in two widgets counts in both.
  - Clicks: `{prefix}productreels_clicks`. Columns: `id`; `widget_id`; `reel_id`; `reel_title`; `btn_uuid`; `button_text`; `button_url`; `campaign_name`; `click_count`; `updated_at`. UNIQUE (`widget_id`,`btn_uuid`). Upserted atomically by `Productreels_Clicks::record()`.
  - Product-card clicks count too (product links are links with a `btn_uuid`; the URL is resolved to the product permalink).
  - "Campaign" = the custom link's `campaignName`. There is no separate buttons or campaigns table.
- **Settings option(s) and keys**: one option, `productreels_settings` (`Productreels_Settings::OPTION`). Keys, defaults and ranges:
  - `view_limit` (2, 1–100)
  - `view_interval` (1 minute, 1–1440)
  - `allow_public_fetch` (true)
  - `cache_render` (true)
  - `cache_ttl` (43200 s, 60–604800)
  - `delete_data_on_uninstall` (false)
  - Reads merge over the defaults. Updates are partial and unknown keys are dropped (`Productreels_Settings::update()`). The activator seeds the option with `array_merge( defaults, existing )`.
  - Other options: `productreels_db_version` (schema revision), `productreels_render_generation` (render-cache generation counter, autoloaded).
- **Widget setting keys and how defaults merge**:
  - The style object is defined in `Productreels_Settings::default_styles()`. Its schema (types, enums, ranges) is in `Productreels_Validator::styles_schema()`, and `validate_styles()` walks the schema, filling every missing key from the defaults. Full key list with defaults:
    - `template` (carousel)
    - `shape` (rectangle)
    - `size` 200, `sizeOnTab` 150, `sizeOnMobile` 150
    - `gap` / `gapOnTab` / `gapOnMobile` 16
    - `topBottomSpacing` 0
    - `alignment` (center)
    - `appearance` (overlay), `showFallbackTitle` (true)
    - `captionColor` #ffffff, `overlayColor` #000000b8, `titleColor` #111827
    - `hoverEffect` (none)
    - `cardBgColor` #ffffff00
    - `border.{width 2, color #9ca3af, radius 6, radiusOnTab 6, radiusOnMobile 6}`
    - `shadow.size` 16
    - `showPlayButton` (false), `playIconSize` 40, `playIconColor` #ffffff
    - `showViews` (true), `viewsBgColor` #6b7280, `viewsTextIconColor` #ffffff
    - `widgetTitle.{alignment hidden, fontSize 24, color #000000, spacingTop 0, spacingBottom 16}`
    - `playerAppearance` (overlay), `showPlayerFallbackTitle` (true)
    - `slideDirection` (horizontal)
    - `playBehavior` (click), `disablePreview` (false)
    - `playWithSound` (true), `loop` (true)
    - `showSeekbar` (true), `showVolumeControl` (true)
    - `previewBtnBgColor`, `previewBtnIconColor`, `previewBtnHoverBgColor`, `previewBtnHoverIconColor`, `previewBtnBorderRadius` 40
    - `carouselBtnBgColor`, `carouselBtnIconColor`, `carouselBtnHoverBgColor`, `carouselBtnHoverIconColor`, `carouselBtnBorderRadius` 40, `carouselBtnPosition` (inside)
    - `productCardStyle` (modern), `showRatings` (true)
    - `showAddToCart` (true), `addToCartText` ("Add to cart")
    - `directCheckout` (false), `directCheckoutText` ("Buy now")
    - `marquee.{speed 40, direction left, pauseOnHover true}`
    - `stacked.{depth 3, offset 24, scale 0.92}`
    - `popup.{trigger load, delaySeconds 5, scrollPercent 30, position bottom-right, showOnMobile true, dismissFor session}`
    - `lazyLoad` (true)
    - `customClass` ('')
  - **All values are saved**: create and update store the full validated object (`validate_styles()` output), and the editor sends the whole `styles` object on save. A widget saved under 1.0.0 therefore already holds every 1.0.0 key. A key new in 1.1.0 would fill from `default_styles()` on read (merge-on-read), with no migration needed.
  - Unknown keys are **dropped** on save, so any new 1.1.0 style key must be added to both `default_styles()` and `styles_schema()`.
  - The editor's slider ranges are narrower than the validator's (e.g. size UI 80–400 vs stored 40–600; gap UI 0–64 vs 0–200). The UI must still display out-of-UI-range stored values without clamping them.
- **View tracking storage**: `POST /widgets/:wid/reels/:id/view` → `Productreels_Rate_Limiter::check( 'view:{reel}:{visitor_hash}', view_limit, view_interval*60 )`. Transients `productreels_rl_{md5}` hold a fixed window. `visitor_hash()` = `wp_hash( REMOTE_ADDR )`, so raw IPs are never stored. Bots are skipped by `is_bot()` (UA heuristics, OPTIONS). The counter is `UPDATE … view_count = view_count + 1`. The client counts a view after one second of playback (`Player.jsx` tracking effect, 1000 ms), at most once per widget+reel per browser session (`public/src/services.js`, sessionStorage key `productreels_viewed_{widgetId}_{reelId}`).
- **Render cache storage and clearing**: `Productreels_Render_Cache`.
  - One transient per widget, `productreels_render_{id}` = `{ stamp, payload }`. The stamp is `md5( styles_json | generation )`.
  - The generation is the option `productreels_render_generation`, bumped by `bump()` on `productreels_{widget,reel}_{created,updated,deleted}` and `productreels_settings_updated`. `forget()` deletes a deleted widget's transient.
  - The mount node's `data-version` = `md5( updated_at | generation )` (first 12 chars).
  - It is enabled by `cache_render`; TTL comes from `cache_ttl`.
  - **To flush every cached payload (e.g. in the 1.1.0 upgrade), call `Productreels_Render_Cache::bump()`.**
- **Uninstall cleanup**: `uninstall.php` does nothing unless `productreels_settings['delete_data_on_uninstall']` is truthy. When it is on, it calls `Productreels_Schema::drop_tables()` (all five tables) and `Productreels_Schema::delete_transients()` (`_transient_productreels_*`), then deletes the options `productreels_settings`, `productreels_db_version` and `productreels_render_generation`. Deactivation (`Productreels_Deactivator`) deletes the transients and flushes rewrite rules only.

## 8. Storefront
- **Shortcode → markup path**: `[productreels id]` → `Productreels_Shortcodes::widget_markup()` prints `<div class="productreels-embed" data-widget-id data-version data-name></div>` and calls `Productreels_Public::request_assets()`. `[productreels_reel id]` prints `<div class="productreels-embed productreels-embed--single" data-reel-id data-version>`. A missing widget or reel shows a dashed notice to `manage_options` users only, and nothing to visitors. There is no server-rendered widget HTML.
- **Client render**: `public/src/index.js` mounts a React root on each `.productreels-embed[data-widget-id|data-reel-id]`, with a `MutationObserver` for late nodes. `public/src/Embed.jsx` fetches `GET render/:id` (or `render/reel/:id`) with `?v=version` through `public/src/services.js`, then renders `@shared/WidgetRenderer` and lazy-loads the Player chunk.
- **Storefront JS/CSS entries and when enqueued**: handle `productreels-public` (JS + CSS). It is registered on `wp_enqueue_scripts` with the inline global `window.productreelsPublic` = `{ restUrl, apiBase, pluginUrl, nonce, defaults, version, hasWoo, currency, storeApiNonce, cartUrl, checkoutUrl }`, and enqueued in the footer only if a mount node was printed. The Player chunk `public/dist/productreels-player.js` loads on demand (warmed on pointer approach).
- **Player**:
  - Files: `src/shared/player/Player.jsx` (portal into `body > .wr-portal-root`), `PlayerSlide.jsx`, `PlayerNav.jsx`, `Seekbar.jsx`, `VolumeControl.jsx`, `LinkStack.jsx` (buttons + product cards).
  - Providers in `src/shared/providers/`: `NativeVideo.jsx`, `YouTubePlayer.jsx` and `VimeoPlayer.jsx`. The YouTube and Vimeo SDKs are loaded remotely by `loadScript.js`, only when such a reel plays.
  - Hooks: `useSwipe`, `useWheelNav`, `useKeyboardNav`, `useReducedMotion`. Single-playback coordination: `src/shared/playback.js`.
- **Layouts**: `src/shared/templates/` `Grid.jsx`, `Carousel.jsx`, `Marquee.jsx`, `Stacked.jsx`, `Popup.jsx`. Each renders `src/shared/Thumbnail.jsx` (tile with poster, preview video, `ViewsBadge`, `PlayIcon`, product mini card). `WidgetRenderer.jsx` picks the template, renders the widget title (`<h2 class="wr-widget-title">` = **widget name**, shown when `widgetTitle.alignment !== 'hidden'`), applies `styleVars()` as `--wr-*` properties, and handles the reveal animation. Styles: `src/shared/styles/embed.scss` (1483 lines) and `player.scss` (1333 lines).
- **Admin preview reuse**: `WidgetEditor.js` renders the same `WidgetRenderer` (`inEditor`, `device`) and the same `Player` with `admin/src/preview-services.js` (no tracking; real products and add-to-cart). The admin stylesheet `@use`s `embed.scss` and `player.scss`. `ReelsLibrary` previews with `Player` too.
- **Popup dismissal storage**: `src/shared/templates/Popup.jsx`. The key is `productreels_popup_dismissed_{widgetId}`. `session` uses `sessionStorage` ('1'); `day`/`week`/`month` use `localStorage` with an expiry timestamp (1/7/30 days); `page` uses no storage.
- **Add to cart / mini-cart sync / direct checkout**: `src/shared/storeApi.js` `createAddToCart()` → `POST {restUrl}wc/store/v1/cart/add-item` with a `Nonce` header (`storeApiNonce` = `wc_store_api`). It then dispatches `productreels:added-to-cart` on `document`, and jQuery `wc_fragment_refresh` + `added_to_cart` when jQuery exists. Only simple, purchasable products get the button (`purchasable` flag). Direct checkout (`directCheckout`) adds the product, then goes to `checkoutUrl` (falling back to `cartUrl`, then the permalink) in `ProductCard.jsx`.

## 9. Integrations
- **Block**: `block/block.json`.
  - name `productreels/reels`, apiVersion 3, version `1.0.0`, category `widgets`
  - attributes `{ widgetId: { type: 'string', default: '' } }` (note: a **string**)
  - supports `html:false`, `align: [wide, full]`, `spacing.margin`
  - `editorScript`/`editorStyle` `productreels-block`
  - Rendering: PHP `Productreels_Block::render()` (`render_callback`) wraps `Productreels_Shortcodes::widget_markup()` in `get_block_wrapper_attributes()`. JS `save: () => null` (dynamic; nothing to deprecate).
  - Editor UI (`block/src/index.js`): `@wordpress/components` `Placeholder` + `ComboboxControl` (options "%1$s (%2$d reels)"), `InspectorControls` → `PanelBody`, and a static **poster preview**, not a live storefront render. Inline global `window.productreelsBlock = { adminUrl, canManage }`.
- **Elementor**: bootstrapped by `Productreels_Elementor::maybe_boot()` on `plugins_loaded` 20, if `elementor/loaded` has fired.
  - Widget class `Productreels_Elementor_Widget` (`includes/integrations/widgets/class-productreels-elementor-widget.php`): `get_name()` `productreels`, title "ProductReels", icon class `productreels-elementor-icon`, category `general`.
  - Controls: section `productreels_section` (TAB_CONTENT); `widget_id` (SELECT2, options "%1$s (#%2$d)", up to 100 widgets by name); `productreels_notice` (NOTICE or RAW_HTML fallback).
  - `render()` echoes `do_shortcode( '[productreels id="…"]' )`, or in edit mode with no widget chosen a dashed hint paragraph.
  - Script and style depend on `productreels-public`.
- **Shortcodes**: `productreels` (attr `id`) and `productreels_reel` (attr `id`), registered on `init` in `Productreels_Shortcodes::register()`.

## 10. i18n
- Text domain usage: `productreels` everywhere (PHP `__`/`esc_html__`/`esc_html_e`/`sprintf` with translators comments; JS `@wordpress/i18n` `__`, `_n`, `sprintf`). Some hard-coded English stays in JS: the source labels `'Vimeo'`, `'YouTube Shorts'`, URL placeholders, and the storefront `Error('WooCommerce is not available.')`.
- wp_set_script_translations: `productreels-admin` (`Productreels_Admin::enqueue_assets`), `productreels-public` (`Productreels_Public::register_assets`), `productreels-block` (`Productreels_Block::register`). All use path `PRODUCTREELS_PATH . 'languages'`.
- `languages/`: `productreels.pot` (1851 lines) + `index.php`. No .po/.mo/.json. POT generation: `npm run make-pot` (needs WP-CLI, which isn't on PATH here). No `load_plugin_textdomain` call (WordPress.org loads translations automatically).

## 11. Local environment
- How to run WordPress for this plugin: **Local (by Flywheel)**. The site is "plugin-dev" (`C:\Users\razib\Local Sites\plugin-dev\app\public`), and the plugin is developed in place under `wp-content/plugins/productreels`. No `.wp-env.json`. The site URL hasn't been confirmed (Local's usual default is `http://plugin-dev.local`; see question 2). PHP and WP-CLI run inside Local's shell, not from this terminal's PATH.
- Screenshot tooling available: the `playwright` CLI is in `node_modules/.bin` (it comes with `@wordpress/scripts`); its browser binaries haven't been verified (`npx playwright install chromium` may be needed). Claude can read PNGs, so it can compare screenshots with `design/screens/*.png`.

## 12. Design → code map
### Components
| Design component | Existing file | NEW? | Notes |
| --- | --- | --- | --- |
| Icon | `admin/src/components/icons/index.js` | NEW | Port `Icon` + Lucide paths from `design/reference/icons.js`; retire the `Icon*` set when unused |
| Button | `admin/src/components/ui/Button.js` (`Button`) | replace | |
| IconButton | `Button.js` (`IconButton`) | replace | Keep its tooltip-as-label behaviour |
| ShortcodeChip | `WidgetsList.js` `ShortcodeChip`; `WidgetEditor.js` `.wr-shortcode` + `copyShortcode` | NEW (extract) | Copy-with-fallback logic exists twice |
| Badge | `ReelEditor.js` `SourceBadge` (`.wr-badge--{source}`) | NEW | |
| LayoutBadge | `WidgetsList.js` `TEMPLATE_LABELS` | NEW | |
| Notice | `ui/Feedback.js` `Notice` | replace | |
| Toast | `ui/Toasts.js` | restyle | Keep the provider API (`useToasts`) |
| FloatingBar | `ReelsLibrary.js` inline bulk bar (`selected.length > 0`) | NEW | Also used by Settings save (new) |
| AppHeader | `App.js` `AppBar` | replace | Labels move from "All Widgets/All Reels" to "Widgets/Reels" |
| PageHeader | inline headers in each screen | NEW | |
| FilterChips | — | NEW | Needs filter counts (section 13) |
| Tabs | `ui/Choice.js` `Tabs` | replace | |
| Segmented | `ui/Choice.js` `IconToggleGroup` (+ `Select` usages for small sets) | NEW | |
| Menu | — | NEW | Row "more" menus |
| TextField | `ui/Fields.js` `TextField`, `Field` | replace | |
| SearchField | `ui/Fields.js` `SearchInput` | replace | |
| Checkbox | `ui/Fields.js` `Checkbox` | replace | |
| Toggle | `ui/Fields.js` `Switch` | replace | |
| ColorField | `ui/ColorPicker.js` | restyle | wordpress.md says "the colour picker the plugin already uses", i.e. this custom one. Keep the 8-digit hex values |
| RangeField | `ui/Sliders.js` `Slider` / `ResponsiveSlider` | replace | The device switch moves to the Stage (see flows.md) |
| SettingsCard | `Settings.js` `Card` | replace | |
| TemplatePicker | `StylePanel.js` `TemplateArt` + `ui/Choice.js` `VisualOptionCards` | replace | |
| MetricBand | `WidgetsList.js` `Overview`; `Statistics.js` `Tile` | NEW | |
| WidgetTable | `WidgetsList.js` table + `SortHeader`, `SkeletonRows` | replace | |
| BarCell | — | NEW | |
| ReelStack | `WidgetsList.js` `PosterStack` | replace | Data exists (`posters`, ≤3) |
| ReelCard | `ReelsLibrary.js` `ReelCard` | replace | Needs counts (section 13) |
| EmptyState | `ui/Feedback.js` `EmptyState` | replace | |
| StepGuide | `WidgetsList.js` `GettingStarted` | replace | |
| StudioHeader | `WidgetEditor.js` header markup | NEW | |
| StudioRail | — | NEW | |
| ReelRow | `WidgetEditor.js` `SortableReel` | replace | dnd-kit stays |
| ReelPicker | `WidgetEditor.js` `PickerCard` + picker pane | replace | |
| Stage | `WidgetEditor.js` preview pane + `DEVICES` | replace | |
| SourcePicker | `ReelEditor.js` `SourcePicker`, `SourceTile`, `UrlSourcePanel` | replace | Upload = `native` via `wp.media`; YouTube Shorts; Vimeo; Video link = `hosted` |
| VideoList | `ReelEditor.js` file list | replace | |
| Filmstrip | `PosterCapture.js` | NEW | Same canvas capture + upload; same cross-origin limitation |
| ShopLinks | `ReelEditor.js` links section + `LinkChip` | replace | |
| ProductPicker | `LinkDialog.js` `ProductsTab` | replace | |
| LinkForm | `LinkDialog.js` `CustomTab` | replace | Must keep `btn_uuid` |
| Dialog | `ui/Modal.js` `Modal`, `ConfirmDialog` | replace | Today inline, not portalled; the design wants a `pr-portal` root |
| BuilderPlaceholder | `block/src/index.js` `Placeholder`; Elementor `render()` edit-mode hint | restyle | |
| ReelTile | `src/shared/Thumbnail.jsx` (+ `ViewsBadge.jsx`, `PlayIcon.jsx`) | restyle (`prs-*`) | |
| ProductCard | `src/shared/ProductCard.jsx` | restyle | |
| ReelsWidget | `src/shared/WidgetRenderer.jsx` + `templates/*` | restyle | Root becomes `prs`; keep `.productreels-embed` mount node |
| ReelPlayer | `src/shared/player/Player.jsx`, `PlayerSlide.jsx`, `LinkStack.jsx`, `Seekbar.jsx`, `VolumeControl.jsx` | restyle | |
| PlayerTheater | `Player.jsx` (desktop) + `PlayerNav.jsx` | restyle | |
| PosterArt | — | mock only | Never ship |

### Screens
| Design screen PNG | Existing screen file |
| --- | --- |
| `ScreenWidgets.png` | `admin/src/screens/WidgetsList.js` |
| `ScreenFirstRun.png` | `WidgetsList.js` (`GettingStarted`) |
| `ScreenCreateWidget.png` | NEW dialog. Today "Create Widget" opens `WidgetEditor.js` at `#/widgets/new` |
| `ScreenStudioReels.png` | `WidgetEditor.js` (picker + attached reels) |
| `ScreenStudioLayout.png` | `WidgetEditor.js` + `StylePanel.js` `LayoutSection` + `TitleAppearanceDialog.js` |
| `ScreenStudioLook.png` | `StylePanel.js` `ThumbnailSection` + `StylesSection` |
| `ScreenReels.png` | `admin/src/screens/ReelsLibrary.js` |
| `ScreenReelEditor.png` | `ReelEditor.js` (+ `LinkDialog.js`, `PosterCapture.js`) |
| `ScreenStatistics.png` | `Statistics.js` |
| `ScreenSettings.png` | `Settings.js` |
| `ScreenStorefront.png` | `src/shared/WidgetRenderer.jsx`, `Thumbnail.jsx`, `ProductCard.jsx`, `templates/*` |
| `ScreenLayouts.png` | `src/shared/templates/{Grid,Marquee,Stacked,Popup,Carousel}.jsx` |
| `ScreenPlayer.png` | `src/shared/player/*` |

### Editor settings (every row of flows.md's table)
"Responsive" = there is a separate stored value per device; the editor edits the device the Stage shows.

| Step | Setting | Stored key(s) | Responsive? | Notes |
| --- | --- | --- | --- | --- |
| Reels | Reels in page order | pivot `productreels_widget_reels.sort_order`, sent as `reel_ids[]` | no | Drag + keyboard already via dnd-kit |
| Reels | Library search / Load more / Add reel | `GET /reels?exclude_widget=` (`PICKER_PAGE` 24) | — | Add reel → `ReelEditor`, the new reel is appended |
| Layout | Template | `template` | no | grid, carousel, marquee, stacked, popup |
| Layout | Shape | `shape` | no | rectangle, circle |
| Layout | Alignment | `alignment` | no | left, center, right; shown only for alignable templates |
| Layout | Reel width | `size`, `sizeOnTab`, `sizeOnMobile` | **yes** | UI 80–400, stored 40–600 |
| Layout | Gap | `gap`, `gapOnTab`, `gapOnMobile` | **yes** | UI 0–64, stored 0–200 |
| Layout | Space above and below | `topBottomSpacing` | no | |
| Layout | Carousel: arrows inside/outside | `carouselBtnPosition` | no | carousel and stacked |
| Layout | Marquee: speed, direction, pause on hover | `marquee.speed`, `marquee.direction` (left/right), `marquee.pauseOnHover` | no | |
| Layout | Stacked: depth, offset, scale | `stacked.depth`, `stacked.offset`, `stacked.scale` | no | |
| Layout | Popup: trigger | `popup.trigger` (load/delay/scroll) + `popup.delaySeconds` / `popup.scrollPercent` | no | |
| Layout | Popup: corner | `popup.position` | no | bottom-right, bottom-left, top-right, top-left |
| Layout | Popup: show on mobile | `popup.showOnMobile` | no | |
| Layout | Popup: show again | `popup.dismissFor` | no | next page = `page`, next visit = `session`, 1 day = `day`, 7 days = `week`, 30 days = `month` |
| Layout | Title: position | `widgetTitle.alignment` | no | hidden, left, center, right. Title text = widget name |
| Layout | Title: size, colour | `widgetTitle.fontSize`, `widgetTitle.color` | no | |
| Layout | Title: space above and below | `widgetTitle.spacingTop`, `widgetTitle.spacingBottom` | no | |
| Look | Title over video / below / hidden | `appearance` (overlay / title / none) | no | Circle shape collapses to a switch writing `title`/`none` (`ThumbnailSection`) |
| Look | Overlay shade and opacity | `overlayColor` (#rrggbbaa; alpha = opacity) | no | |
| Look | Title colour | `captionColor` (over video), `titleColor` (below) | no | Two keys behind one design control, chosen by `appearance` |
| Look | Preview before play | `playBehavior` (Off = `click`, On hover = `hover`, When visible = `autoplay`) + `disablePreview` | no | When writing, set `disablePreview: false` (as 1.0.0's `setPreview` does). Reading: `disablePreview: true` means Off |
| Look | Hover effect | `hoverEffect` | no | 1.0.0 also has `none`; design shows zoom in / zoom out / lift only (see below) |
| Look | Play button on/off, size, colour | `showPlayButton`, `playIconSize`, `playIconColor` | no | |
| Look | Play button hover colour | — | — | **No stored key** |
| Look | View count on/off, text and icon colour | `showViews`, `viewsTextIconColor` (+ `viewsBgColor`) | no | |
| Look | Border width, colour, radius | `border.width`, `border.color`, `border.radius`/`border.radiusOnTab`/`border.radiusOnMobile` | **radius yes** | |
| Look | Shadow | `shadow.size` | no | |
| Look | Background | `cardBgColor` | no | |
| Look | Carousel arrow colours (normal, hover) | `carouselBtnBgColor`, `carouselBtnIconColor`, `carouselBtnHoverBgColor`, `carouselBtnHoverIconColor` | no | |
| Player | Slide direction | `slideDirection` (horizontal / vertical) | no | |
| Player | Play with sound | `playWithSound` | no | |
| Player | Loop | `loop` | no | |
| Player | Seek bar | `showSeekbar` | no | |
| Player | Volume control | `showVolumeControl` | no | |
| Player | Navigation button colours | `previewBtnBgColor`, `previewBtnIconColor`, `previewBtnHoverBgColor`, `previewBtnHoverIconColor` | no | |
| Product card | Style (Modern / Classic) | `productCardStyle` (modern / classic) | no | |
| Product card | Ratings | `showRatings` | no | |
| Product card | Add to cart + button text | `showAddToCart`, `addToCartText` | no | Exclusive with Direct Checkout (editor writes both keys) |
| Product card | Direct Checkout + button text | `directCheckout`, `directCheckoutText` | no | The renderer prefers direct checkout if both are on |
| Advanced | Lazy load videos | `lazyLoad` | no | |
| Advanced | CSS class | `customClass` | no | ≤10 sanitised class names |
| Place it | Widget shortcode with copy | — | — | `[productreels id="{id}"]` |
| Place it | Block / Elementor how-to, single-reel shortcode | — | — | `productreels/reels` block; Elementor "ProductReels"; `[productreels_reel id="{reel id}"]` |
| (header) | Widget name | `widgets.name` | — | Slug never changes on rename |

1.0.0 settings missing from the design:
- `showFallbackTitle`: "show the reel title on the thumbnail when it has no product card" under `appearance: overlay`.
- `playerAppearance` (overlay / title / none) and `showPlayerFallbackTitle`: how the title shows inside the player.
- `previewBtnBorderRadius`: the player navigation button radius.
- `carouselBtnBorderRadius`: the carousel arrow radius.
- `viewsBgColor`: the view-count badge background. The design names only "text and icon colour".
- `hoverEffect: 'none'`: the design shows three options, but `none` is the 1.0.0 **default**, so most existing widgets hold it.
- `disablePreview`: a legacy flag, folded into "Preview before play: Off".
- These must stay reachable (CONTEXT: "every old setting still reachable"). See question 4.

Design settings with no stored key:
- **Play button hover colour** (Look). Needs a new additive style key (e.g. `playIconHoverColor`, default = `playIconColor` behaviour, i.e. unchanged look), added to `default_styles()`, `styles_schema()` and `styleVars()`. See question 4.
- Everything else in flows.md maps to an existing key.

## 13. Data the design needs
| Need | Exists (where) / Missing (additive proposal) |
| --- | --- |
| Totals: views, clicks, click rate | **Partly exists.** 1.0.0 computes them on the client in `WidgetsList.js` `Overview` by summing every widget's `view_total` / `click_total` from `GET /widgets` (all pages). A reel used in N widgets counts N times in "views". **Proposal:** new `GET /productreels/v1/overview` (`admin_permission`) returning `{ views, clicks, ctr, reels_in_use, reels_total, top_reels[] }`, with `views` computed the same way 1.0.0 does unless the user decides otherwise (question 3). Clicks = `SUM(clicks.click_count)` (same as the sum over widgets, since click rows are per widget). |
| Reels in use / total reels | **Missing.** Total = `X-WP-Total` of `GET /reels?per_page=1` (WidgetsList already does this for first run). In use = `COUNT(DISTINCT reel_id)` from `productreels_widget_reels`. Add both to `/overview` above. |
| Top six reels by views, with clicks | **Missing.** Proposal: in `/overview`, `top_reels` = `SELECT id, title, thumbnail, view_count FROM reels ORDER BY view_count DESC LIMIT 6` + poster fallback from first file + `clicks` = `SUM(click_count) GROUP BY reel_id` over all widgets (click rows kept even after reel delete are ignored by the join). `view_count` is lifetime, across widgets. |
| Per reel: widgets count, products count, buttons count, source | **Partly exists.** `GET /reels` items already include `links[]` (products = `btn_type: product` count, buttons = `btn_type: custom` count; derivable on the client) and `file` (`file.source`: `native`/`youtube`/`vimeo`/`hosted`). **Missing: widgets count.** Proposal: add `widget_count` to each item in `GET /reels` via one `SELECT reel_id, COUNT(*) … GROUP BY reel_id` for the page (additive field; same for `GET /reels/:id`). Optionally add `product_count`/`button_count` server-side for convenience. |
| Reel filters with counts | **Missing.** Proposal: new optional `filter` arg on `GET /reels` (`all` default, `tagged`, `button`, `unused`): `unused` = `id NOT IN (SELECT reel_id FROM pivot)`; `tagged`/`button` = `links LIKE '%"btn_type":"product"%'` / `'%"btn_type":"custom"%'` (the JSON is written by `wp_json_encode` of validator output, so the token is stable). Counts: new `GET /productreels/v1/reels/counts` (`admin_permission`) → `{ all, tagged, button, unused }`, or response headers `X-ProductReels-Count-*` on the list. Must combine with `search`. |
| Reels paging totals | **Exists.** `X-WP-Total` / `X-WP-TotalPages` on `GET /reels`, exposed as `{ total, pages }` by `getList()`. "Showing 24 of 61" = `items.length` of `total`. |
| Per-widget reel posters in order | **Exists.** `GET /widgets` items carry `posters[]`: the first 3 reels in `sort_order`, thumbnail or the first file's `poster_url`, or `''` if neither (`Productreels_Widgets::reel_posters_for_widgets()`, `$limit = 3`). `reel_count` gives the "+N". |

Other data notes for later parts:
- **Statistics.** A widget's reel "views" are the reel's lifetime views across all widgets and standalone embeds; only clicks are per widget. Part 10 should keep this (numbers must equal 1.0.0's) and word the hint carefully.
- **Reel editor upload progress.** The design shows "Uploading, 62%" in `VideoList`. 1.0.0 uploads through the `wp.media` modal, which shows its own progress; there is no in-sheet upload.
- **Statistics "Sorted by views"** (design) vs 1.0.0's client-side sorting on any column. Keep it client-side; no API change needed.

## 14. Risks and questions for the user

Risks:
1. **Release file allowlist.** New folders (fonts, any new top-level PHP or asset dirs) won't ship unless they're added to `package.json` → `files`. A missing font folder would pass every local test and break only on the release zip. Part 01 must add its fonts path there, and part 15 must unzip and check.
2. **`THIRD-PARTY-NOTICES.txt` is listed in `files` but doesn't exist.** Part 15 should create it (Lucide ISC, Archivo OFL, dnd-kit MIT) or drop the entry.
3. **Storefront class/markup change.** Merchants or themes may have custom CSS targeting `.productreels-embed` / `wr-*` storefront classes or `--wr-*` variables, and `customClass` is applied on the root. Keep the `.productreels-embed` mount node and the `customClass` placement. Consider keeping key legacy classes alongside the new `prs-*` ones in part 12.
4. **Render cache.** Cached `/render/:id` payloads and CDN copies (`Cache-Control: public`, up to `cache_ttl`) won't change shape (the payload is data, not markup), but if any payload field is added, the 1.1.0 migration should call `Productreels_Render_Cache::bump()`. The new JS/CSS is cache-busted by `asset.php` versions.
5. **Block attribute `widgetId` is a string.** Part 13 must keep it a string (no type change) or add a `deprecated` entry.
6. **Rate-limit window is per reel, not per widget**, and views are only stored per reel. "Views" anywhere in the new UI can't be split by widget without new storage. Don't promise per-widget views.
7. **Hover effect `none`, and the 1.0.0 settings the design dropped** (section 12) must remain reachable, or saving a widget from the new editor could silently change its look.
8. **No PHP/phpcs/WP-CLI in this terminal.** `npm run lint:php` and `npm run make-pot` can't run here unless you run them from Local's "Open site shell" or install PHP + PHPCS. Plugin Check (part 15) will need the site itself.
9. **The legacy `wr-` prefix** (from WooReels) is still everywhere in admin and storefront classes. That's fine for 1.1.0 (it's prefixed and scoped); it's listed as a part-14 clean-up candidate only where code is fully replaced.
10. **Remote scripts.** The YouTube and Vimeo SDKs load from their own domains when such a reel plays, and Vimeo oEmbed is called from admin. This is already disclosed in readme "External services" and isn't a font/CSS/icon CDN, so it doesn't conflict with "no remote assets", but no new remote calls may be added.

Questions (please answer before part 01):
1. **Git setup.** Nothing is committed for this redesign yet: no `v1.0.0` tag, no `release/1.1.0` branch, and the kit itself is untracked on `master`. OK to tag `5fe2583` as `v1.0.0`, create `release/1.1.0`, and commit the kit + CLAUDE.md + this audit there? (Or tell me which commit is the real 1.0.0 on WordPress.org.)
2. **Test site.** What URL is your Local site at (probably `http://plugin-dev.local`)? Is WooCommerce active there with some products, and does it have 1.0.0 reels and widgets placed on pages (shortcode, block and Elementor)? Is Elementor installed? Can I log in to screenshot with Playwright? If yes, give a test admin username, or say you'd rather check screens yourself.
3. **Home totals.** 1.0.0's "Views" on the widgets screen adds up each widget's reel views, so a reel used in 3 widgets is counted 3 times. Keep exactly that (numbers equal 1.0.0's, as part 04 asks), or show true lifetime views (sum of each reel once), which will be lower on sites that reuse reels?
4. **Settings the design dropped.** For `showFallbackTitle`, `playerAppearance` + `showPlayerFallbackTitle`, `previewBtnBorderRadius`, `carouselBtnBorderRadius`, `viewsBgColor` and hover effect "None": OK to keep them in the matching step (Look / Player) in the new style, as extra controls the design doesn't show? And should I add the new **play button hover colour** (a new additive key, defaulting to "same as the normal colour" so existing widgets don't change), or leave it out?
5. **Logo.** 1.0.0 shows `admin/images/logo.png` in the app bar. The design's AppHeader is the wordmark only. Drop the logo image from the header (keep the file for the WP menu/readme), or keep it next to the wordmark?
6. **Upgrade routine.** The plugin already has a migration runner (`productreels_db_version` + `Productreels_Migrations`). OK to use it for 1.1.0 instead of adding the template's separate `productreels_version` option?
7. **`Tested up to`.** readme says 7.1. Which WordPress version do you test with now (keep 7.1, or bump in part 15)?
8. **Reel upload progress.** The design's in-sheet "Uploading 62%" row implies uploading without the Media Library modal. OK to keep using the Media Library for uploads (it shows its own progress) and show "Uploaded" rows after, or do you want direct upload in the sheet (more work, same storage)?
