# BUILD PROMPT — WooReels

> Paste this whole file into Claude Code as the opening message of a fresh session,
> with the working directory set to the `wooreels/` plugin folder.
> Then work through it phase by phase (see §22 Build Order).

---

## 1. Mission

Build **WooReels** — a WooCommerce shoppable-video plugin for WordPress that lets a store
owner group short vertical videos ("reels") into reusable **widgets**, style every widget
from a live visual editor, tag WooCommerce products or custom CTA buttons inside each reel,
and drop the widget anywhere via shortcode, Gutenberg block, or Elementor widget. Visitors
tap a thumbnail, a fullscreen swipeable player opens, and they can add to cart without
leaving the page. Views and button clicks are tracked and reported per widget.

This is a **complete, production-grade plugin**: database layer, REST API, React admin SPA,
React frontend renderer, page-builder integrations, analytics, settings, i18n, uninstall.
Every feature listed here ships working and unlocked — there is **no free/pro split**, no
locked controls, no upgrade popovers, no license checks, no telemetry, no external HTTP calls.

Build it on the existing `wooreels/` boilerplate described in §2. Do not scaffold a new plugin.

---

## 2. Starting point — what already exists

The `wooreels/` folder is a WordPress Plugin Boilerplate (WPPB) scaffold with a React build.
**Keep its structure and conventions.** It currently contains:

```
wooreels/
├── wooreels.php                              # bootstrap; defines WOOREELS_VERSION, activate/deactivate, run_wooreels()
├── uninstall.php
├── includes/
│   ├── class-wooreels.php                    # core: load_dependencies(), set_locale(), define_admin_hooks(), define_public_hooks(), run()
│   ├── class-wooreels-loader.php             # hook registry: add_action()/add_filter() collector
│   ├── class-wooreels-i18n.php
│   ├── class-wooreels-activator.php
│   └── class-wooreels-deactivator.php
├── admin/
│   ├── class-wooreels-admin.php              # Wooreels_Admin: enqueue_styles(), enqueue_scripts()
│   ├── partials/wooreels-admin-display.php
│   ├── src/{wooreels-admin.js, App.js}
│   └── dist/                                 # build output
├── public/
│   ├── class-wooreels-public.php             # Wooreels_Public: enqueue_styles(), enqueue_scripts()
│   ├── partials/wooreels-public-display.php
│   ├── src/{wooreels-public.js, App.js}
│   └── dist/
├── languages/wooreels.pot
├── package.json                              # @wordpress/scripts ^35
└── webpack.config.js
```

**What it does NOT have and you must add:** any database schema, repositories, REST API,
migrations, settings storage, shortcodes, block, Elementor widget, or real UI.

**Fix on first pass:** `wooreels.php` still has the boilerplate header
`Plugin Name: WordPress Plugin React Boilerplate`. Change it to the real header (§4).

---

## 3. Naming contract — use these exactly, everywhere

| Thing | Value |
| --- | --- |
| Plugin slug / folder | `wooreels` |
| Main file | `wooreels.php` |
| Text domain | `wooreels` |
| PHP class prefix | `Wooreels_` (WPPB style, e.g. `Wooreels_Rest_Widgets`) |
| Namespace | none — WPPB uses prefixed class names, stay consistent |
| Constants | `WOOREELS_VERSION`, `WOOREELS_DB_VERSION`, `WOOREELS_FILE`, `WOOREELS_PATH`, `WOOREELS_URL` |
| DB tables | `{$wpdb->prefix}wooreels_*` |
| Options | `wooreels_settings`, `wooreels_db_version` |
| Transients | `wooreels_*` |
| REST namespace | `wooreels/v1` |
| Shortcodes | `[wooreels id="1"]`, `[wooreels_reel id="1"]` |
| Block | `wooreels/reels` |
| Elementor widget name | `wooreels` |
| Asset handles | `wooreels-admin`, `wooreels-public`, `wooreels-block` |
| CSS class prefix | `.wr-` (BEM: `.wr-player__nav--left`) |
| CSS custom props | `--wr-*` |
| Admin mount node | `#wooreels-admin-app` |
| Portal root | `.wr-portal-root` |
| JS bootstrap globals | `window.wooreelsAdmin`, `window.wooreelsPublic` |
| Capability | `manage_options` |
| Hooks you fire | `wooreels_*` (e.g. `wooreels_widget_saved`) |

**Never emit** the strings `ecomm-reels`, `ecommreels`, `reelswp`, `ecr-`, or `wp_reels_`
anywhere in code, CSS, database, or markup. This plugin must be able to run side by side
with any other reels plugin on the same site with zero collisions.

**Namespace all CSS.** Every rule must be scoped under `#wooreels-admin-app`, `.wooreels-embed`,
or `.wr-portal-root` so themes and other plugins cannot bleed into the UI and vice versa.

---

## 4. Plugin header

```php
/**
 * Plugin Name:       WooReels — Shoppable Video Reels for WooCommerce
 * Plugin URI:        https://bestwebexpert.com/wooreels
 * Description:       Turn product videos and customer UGC into shoppable Instagram-style reels. Grid, carousel, marquee, stacked and popup layouts, WooCommerce product tagging, CTA buttons, and built-in view/click analytics.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Razibul Hasan
 * Author URI:        https://bestwebexpert.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wooreels
 * Domain Path:       /languages
 * WC requires at least: 7.0
 */
```

Declare HPOS compatibility:

```php
add_action( 'before_woocommerce_init', function () {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables', WOOREELS_FILE, true
        );
    }
} );
```

---

## 5. Domain model

Three nouns. Learn them before writing code.

- **Reel** — one video plus a title, an optional poster thumbnail, and zero or more links
  (CTA buttons / tagged products). A reel is **reusable**: it lives independently and can
  belong to many widgets at once.
- **Widget** — a named, styled, ordered collection of reels. What the shortcode renders.
  Owns the entire style JSON. Many-to-many with reels through a pivot table.
- **Link** — a button attached to a reel. Either a `custom` link (text + URL + campaign)
  or a `product` link (a WooCommerce product id). Each link has a stable `btn_uuid` used
  as the click-tracking key.

Deleting a widget must not delete its reels. Deleting a reel must remove its pivot rows
and its media file rows.

---

## 6. Database schema

Five tables, created with `dbDelta()` in `Wooreels_Schema::install()`. Store the schema
revision in `wooreels_db_version` **separately** from `WOOREELS_VERSION`, so bumping the
schema re-runs `dbDelta()` on the next load without requiring reactivation.

```sql
-- Widgets (styled, named collections)
CREATE TABLE {prefix}wooreels_widgets (
    id           BIGINT UNSIGNED AUTO_INCREMENT,
    slug         VARCHAR(191) NOT NULL,
    name         VARCHAR(191) NOT NULL,
    styles_json  LONGTEXT NULL,
    created_by   BIGINT UNSIGNED NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_slug (slug)
) {charset};

-- Reels
CREATE TABLE {prefix}wooreels_reels (
    id           BIGINT UNSIGNED AUTO_INCREMENT,
    reel_uuid    CHAR(36) NOT NULL,
    title        VARCHAR(255) NULL,
    thumbnail    TEXT NULL,
    links        LONGTEXT NULL,          -- JSON array, see §8.2
    view_count   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_reel_uuid (reel_uuid)
) {charset};

-- Pivot: which reels are in which widget, and in what order
CREATE TABLE {prefix}wooreels_widget_reels (
    id         BIGINT UNSIGNED AUTO_INCREMENT,
    widget_id  BIGINT UNSIGNED NOT NULL,
    reel_id    BIGINT UNSIGNED NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_widget_reel (widget_id, reel_id),
    KEY idx_widget (widget_id),
    KEY idx_reel (reel_id),
    KEY idx_widget_sort (widget_id, sort_order)
) {charset};

-- Media files attached to a reel
CREATE TABLE {prefix}wooreels_files (
    id          BIGINT UNSIGNED AUTO_INCREMENT,
    reel_id     BIGINT UNSIGNED NOT NULL,
    file_uuid   CHAR(36) NOT NULL,
    wp_media_id BIGINT UNSIGNED NULL,
    url         TEXT NOT NULL,
    mime_type   VARCHAR(100) NOT NULL,
    source      VARCHAR(32) NOT NULL DEFAULT 'native',  -- native|vimeo|youtube|hosted
    provider_id VARCHAR(191) NULL,                      -- vimeo/youtube video id
    poster_url  TEXT NULL,                              -- provider-supplied poster
    duration    INT UNSIGNED NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_file_uuid (file_uuid),
    KEY idx_reel (reel_id)
) {charset};

-- Button click counters
CREATE TABLE {prefix}wooreels_clicks (
    id            BIGINT UNSIGNED AUTO_INCREMENT,
    widget_id     BIGINT UNSIGNED NOT NULL,
    reel_id       BIGINT UNSIGNED NOT NULL,
    reel_title    VARCHAR(255) NULL,
    btn_uuid      CHAR(36) NOT NULL,
    button_text   VARCHAR(255) NULL,
    button_url    TEXT NULL,
    campaign_name VARCHAR(191) NULL,
    click_count   BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_btn (widget_id, btn_uuid),
    KEY idx_widget (widget_id)
) {charset};
```

**Schema rules**
- `sort_order` on the pivot is what makes drag-to-reorder persistent. The original plugin
  ordered by pivot `id`; we improve on that. Always `ORDER BY sort_order ASC, id ASC`.
- `uq_btn` is `(widget_id, btn_uuid)` — the same reel used in two widgets must count its
  clicks separately, per widget. (The original had a global unique on `btn_uuid`, which
  merged the two. Do not copy that bug.)
- Use `varchar` not `enum` for `source`; validate the vocabulary in PHP.
- Never write a column that is not in the repository's cast map.

---

## 7. PHP architecture

Extend the WPPB pattern. Every new class is `require_once`'d in
`Wooreels::load_dependencies()` and hooked in `define_admin_hooks()` /
`define_public_hooks()` through `$this->loader`. Keep the loader as the single list of
everything the plugin registers.

```
includes/
├── class-wooreels.php                 (extend: register the new modules)
├── class-wooreels-loader.php          (unchanged)
├── class-wooreels-i18n.php            (unchanged)
├── class-wooreels-activator.php       -> calls Wooreels_Schema::install() + seed defaults
├── class-wooreels-deactivator.php     -> flush rewrite/transients only, never drop data
├── install/
│   ├── class-wooreels-schema.php      # tables(), table($name), install(), statements()
│   └── class-wooreels-migrations.php  # maybe_upgrade(): compares wooreels_db_version
├── data/
│   ├── class-wooreels-repository.php  # abstract base: db(), casts, prepare helpers, pagination
│   ├── class-wooreels-widgets.php
│   ├── class-wooreels-reels.php
│   ├── class-wooreels-files.php
│   ├── class-wooreels-clicks.php
│   └── class-wooreels-settings.php    # wraps get_option/update_option with merged defaults
├── rest/
│   ├── class-wooreels-rest.php        # registers all controllers on rest_api_init
│   ├── class-wooreels-rest-controller.php   # abstract: permissions, error envelope, schema
│   ├── class-wooreels-rest-widgets.php
│   ├── class-wooreels-rest-reels.php
│   ├── class-wooreels-rest-files.php
│   ├── class-wooreels-rest-products.php     # WooCommerce product search for tagging
│   ├── class-wooreels-rest-tracking.php     # public: view, click, render payload
│   └── class-wooreels-rest-settings.php
├── frontend/
│   ├── class-wooreels-shortcodes.php
│   └── class-wooreels-block.php
├── integrations/
│   ├── class-wooreels-woocommerce.php
│   ├── class-wooreels-elementor.php
│   └── widgets/class-wooreels-elementor-widget.php
└── support/
    ├── class-wooreels-validator.php   # colors, urls, ints, enums, style-schema validation
    ├── class-wooreels-rate-limiter.php
    └── class-wooreels-media.php       # mime sniffing, provider url parsing, poster fetch
```

### Repository base class

Model it on a cast map so an unexpected key in a request payload can never reach the
database:

```php
abstract class Wooreels_Repository {
    const CAST_INT = 'int'; const CAST_STRING = 'string';
    const CAST_BOOL = 'bool'; const CAST_JSON = 'json';
    const CAST_DATETIME = 'datetime';

    abstract protected function table_key();   // e.g. 'widgets'
    abstract protected function casts();       // column => cast

    protected function db() { global $wpdb; return $wpdb; }
    protected function table() { return Wooreels_Schema::table( $this->table_key() ); }
    // cast_row(), cast_rows(), fillable(), paginate(), find(), delete()...
}
```

Every repository method returns typed PHP arrays (ints as `int`, JSON columns already
decoded, booleans as `bool`). Controllers never touch `$wpdb`. `global $wpdb` appears in
exactly one place: `Wooreels_Repository::db()`.

### Security rules (non-negotiable)

- Every admin route: `current_user_can( 'manage_options' )`.
- Every write uses `$wpdb->prepare()` or `$wpdb->insert/update/delete` with format arrays.
  Never interpolate a variable into SQL. Table names come only from `Wooreels_Schema::table()`.
- `ORDER BY` / `orderby` params are matched against a hardcoded allowlist, never passed through.
- Sanitize on write: `sanitize_text_field`, `esc_url_raw`, `absint`, `wp_kses_post` where
  rich text is genuinely needed (it is not, here).
- Escape on output in every PHP template: `esc_html`, `esc_attr`, `esc_url`.
- Public tracking routes are `permission_callback => '__return_true'` but **rate limited**
  (§18) and accept only integers plus a uuid.
- `uninstall.php` drops the five tables and deletes `wooreels_settings`,
  `wooreels_db_version`, and every `wooreels_*` transient — but **only** when the setting
  `delete_data_on_uninstall` is true. Default false.
- Multi-file writes (create reel + files, save widget + pivot) run inside
  `START TRANSACTION` / `COMMIT` with `ROLLBACK` on any throwable.

---

## 8. Data shapes

### 8.1 Widget style JSON (`widgets.styles_json`)

This single object drives the entire visual editor and the entire frontend render.
Ship these exact defaults in `Wooreels_Settings::default_styles()`, and validate every
incoming key against a schema — unknown keys are dropped, out-of-range numbers clamped.

```jsonc
{
  // ---- layout ----
  "template": "carousel",              // "grid" | "carousel" | "marquee" | "stacked" | "popup"
  "shape": "rectangle",                // "rectangle" (9:16) | "circle" (1:1)
  "size": 200,                         // thumbnail width px — desktop
  "sizeOnTab": 150,
  "sizeOnMobile": 150,
  "gap": 16, "gapOnTab": 16, "gapOnMobile": 16,
  "topBottomSpacing": 0,

  // ---- thumbnail ----
  "appearance": "overlay",             // "overlay" | "title" | "none"
  "showFallbackTitle": true,           // show reel title when no link exists (overlay only)
  "hoverEffect": "none",               // "none" | "zoom-in" | "zoom-out"
  "cardBgColor": "#ffffff00",
  "border": {
    "width": 2,
    "color": "#9ca3af",
    "radius": 6, "radiusOnTab": 6, "radiusOnMobile": 6
  },
  "shadow": { "size": 16 },

  // ---- play icon ----
  "showPlayButton": false,
  "playIconSize": 40,
  "playIconColor": "#ffffff",

  // ---- view count badge ----
  "showViews": true,
  "viewsBgColor": "#6b7280",
  "viewsTextIconColor": "#ffffff",

  // ---- widget title ----
  "widgetTitle": {
    "alignment": "hidden",             // "hidden" | "left" | "center" | "right"
    "fontSize": 24,
    "color": "#000000"
  },

  // ---- player ----
  "playerAppearance": "overlay",       // "overlay" | "title" | "none"
  "showPlayerFallbackTitle": true,
  "slideDirection": "horizontal",      // "horizontal" | "vertical"
  "playBehavior": "click",             // "click" | "autoplay" | "hover"
  "playWithSound": true,
  "loop": true,
  "disablePreview": false,
  "showSeekbar": true,
  "showVolumeControl": true,

  // ---- preview nav buttons (inside player) ----
  "previewBtnBgColor": "#ffffff",
  "previewBtnIconColor": "#374151",
  "previewBtnHoverBgColor": "#ffffff",
  "previewBtnHoverIconColor": "#374151",
  "previewBtnBorderRadius": 40,

  // ---- carousel nav buttons (on the thumbnail rail) ----
  "carouselBtnBgColor": "#ffffff",
  "carouselBtnIconColor": "#1f2937",
  "carouselBtnHoverBgColor": "#dbeafe",
  "carouselBtnHoverIconColor": "#1f2937",
  "carouselBtnBorderRadius": 40,
  "carouselBtnPosition": "inside",     // "inside" | "outside"

  // ---- product card ----
  "productCardStyle": "modern",        // "modern" | "classic"
  "showRatings": true,
  "showAddToCart": true,
  "addToCartText": "Add to cart",

  // ---- template-specific ----
  "marquee": { "speed": 40, "direction": "left", "pauseOnHover": true },
  "stacked":  { "depth": 3, "offset": 24, "scale": 0.92 },
  "popup":    {
    "trigger": "load",                 // "load" | "delay" | "scroll"
    "delaySeconds": 5,
    "scrollPercent": 30,
    "position": "bottom-right",        // 4 corners
    "size": 180,
    "showOnMobile": true
  },

  // ---- performance ----
  "lazyLoad": true
}
```

### 8.2 Reel links JSON (`reels.links`)

An array. Two variants, discriminated by `btn_type`:

```jsonc
[
  {
    "btn_type": "custom",
    "btn_uuid": "b2a1…",           // uuid v4, generated client-side, stable forever
    "buttonText": "Buy Now",
    "buttonUrl": "https://example.com/product",
    "openInNewTab": true,
    "campaignName": "Summer sale",
    "customClass": ""
  },
  {
    "btn_type": "product",
    "btn_uuid": "9fd3…",
    "product_id": 421,
    "buttonText": "Denim Jacket"   // snapshot of the product name at tag time
  }
]
```

Multiple links per reel are supported and shipped. The player renders them stacked at the
bottom of the frame; `product` links render as a product card, `custom` links as a button.

### 8.3 Bootstrap payload (`window.wooreelsAdmin` / `window.wooreelsPublic`)

```js
window.wooreelsAdmin = {
  restUrl:   'https://site.test/wp-json/',
  apiBase:   'https://site.test/wp-json/wooreels/v1/',
  nonce:     '…',                   // wp_rest
  adminUrl:  'https://site.test/wp-admin/admin.php?page=wooreels',
  hasWoo:    true,
  currency:  { code: 'USD', symbol: '$', position: 'left', decimals: 2 },
  storeApiNonce: '…',               // wc_store_api, only when Woo active
  capabilities: { manage: true },
  defaults:  { /* default style object from §8.1 */ },
  version:   '1.0.0',
};

window.wooreelsPublic = {
  apiBase:  '…/wooreels/v1/',
  nonce:    '',                     // wp_rest, only when logged in
  storeApiNonce: '',
  hasWoo:   true,
  currency: { … },
};
```

---

## 9. REST API — `wooreels/v1`

All responses use a consistent envelope on error:
`{ code: 'wooreels_x_failed', message: '…', data: { status: 4xx } }` via `WP_Error`.
Never leak exception messages to the client — log with `error_log()`, return a generic string.
List endpoints send `X-WP-Total` and `X-WP-TotalPages` headers.

### Widgets

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/widgets` | admin | Paginated list. Params: `page`, `per_page`, `search`, `orderby` (`id\|name\|created_at`), `order`. Returns `id, name, slug, reel_count, view_total, click_total, created_at`. |
| `GET` | `/widgets/(?P<id>\d+)` | admin | Full widget incl. `styles` and ordered `reels[]` (each hydrated with `files[]` and `links[]`). |
| `POST` | `/widgets` | admin | Create. Body: `name`, `styles`, `reel_ids[]`. Auto-names `Untitled widget N` when name is blank. Generates unique slug. |
| `PUT/PATCH` | `/widgets/(?P<id>\d+)` | admin | Update name / styles / reel_ids (replaces pivot, writes `sort_order` from array index). |
| `POST` | `/widgets/(?P<id>\d+)/duplicate` | admin | Deep copy: new widget `"<name> (Copy)"`, same styles, same reel pivot + order. Does **not** copy click counters. |
| `DELETE` | `/widgets/(?P<id>\d+)` | admin | Deletes widget + pivot rows + its click rows. Leaves reels intact. |
| `GET` | `/widgets/(?P<id>\d+)/stats` | admin | `{ reels: [{ reel_id, title, view_count }], buttons: [{ btn_uuid, reel_id, reelTitle, buttonText, buttonUrl, campaignName, clickCount }], totals: { views, clicks, ctr } }` |

### Reels

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/reels` | admin | Paginated. Params: `search`, `exclude_widget` (returns reels *not* in that widget — powers the "add reels" picker), `page`, `per_page`. Each item hydrated with its first file. |
| `GET` | `/reels/(?P<id>\d+)` | admin | Single reel, all files + links. |
| `POST` | `/reels` | admin | Create reel + files in one transaction. Body: `title`, `thumbnail`, `links[]`, `files[]`. Auto-names `Untitled reel N`. |
| `PUT/PATCH` | `/reels/(?P<id>\d+)` | admin | Update title / thumbnail / links / files (files replaced wholesale). |
| `DELETE` | `/reels/(?P<id>\d+)` | admin | Delete reel + its files + its pivot rows. |
| `POST` | `/reels/bulk-delete` | admin | Body `ids[]`. Returns `{ deleted: n, failed: [] }`. Powers multi-select delete. |
| `POST` | `/reels/validate-url` | admin | Body `url`, `source`. Resolves Vimeo/YouTube/hosted URLs → `{ valid, provider_id, poster_url, duration, mime_type }`. |

### Files

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `DELETE` | `/files/(?P<id>\d+)` | admin | Remove one media row (does not delete the WP attachment). |

### Products (WooCommerce)

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/products` | admin | Search for tagging. Params `search`, `page`, `per_page`. Returns `{ id, name, price_html, image, permalink, rating, rating_count, in_stock }`. Uses `wc_get_products()`, **not** raw SQL. Returns `[]` with 200 when Woo is inactive. |
| `GET` | `/products/batch` | public | Body/param `ids[]`. Public read of the display fields the player needs. Cached in a 5-minute transient keyed by id set. |

### Tracking & render (public)

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/render/(?P<id>\d+)` | public | **The frontend's only read.** Returns everything one widget needs to paint: `{ id, name, styles, reels: [{ id, reel_uuid, title, thumbnail, view_count, files:[…], links:[…] }] }`. Cached (§20). |
| `POST` | `/widgets/(?P<wid>\d+)/reels/(?P<id>\d+)/view` | public | Increment `view_count`, rate-limited per IP+reel. `429` when limited. |
| `POST` | `/track/click` | public | Body: `widget_id`, `reel_id`, `reel_title`, `btn_uuid`, `button_text`, `button_url`, `campaign_name`. Upsert into `wooreels_clicks` (`INSERT … ON DUPLICATE KEY UPDATE click_count = click_count + 1`). |

### Settings

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/settings` | admin | Returns merged-with-defaults settings object. |
| `PUT` | `/settings` | admin | Partial update, validated + clamped. |

---

## 10. Admin experience

### 10.1 Menu

```
WooReels                    (dashicons-format-video, position 25)
├── All Widgets             page=wooreels          #/widgets
├── All Reels               page=wooreels          #/reels
├── Create Widget           page=wooreels          #/widgets/new
└── Settings                page=wooreels          #/settings
```

One `add_menu_page` rendering `<div id="wooreels-admin-app"></div>`, plus submenu entries.
Submenus that point at a hash route use a callback that `wp_safe_redirect`s to
`admin.php?page=wooreels#/…` — this is how a single SPA gets four real WP menu items.
Highlight the correct submenu as the hash changes (patch `$submenu_file` / do it in JS).

Only enqueue the admin bundle when `get_current_screen()->id` contains `wooreels`.
Call `wp_enqueue_media()` on those screens.

### 10.2 Routing

Hash router, no `react-router` dependency — a small `useHashRoute()` hook is enough:

| Hash | Screen |
| --- | --- |
| `#/widgets` (default) | Widgets list |
| `#/widgets/new` | Widget editor, create mode |
| `#/widgets/:id` | Widget editor, edit mode |
| `#/widgets/:id/stats` | Statistics |
| `#/reels` | Reels library |
| `#/settings` | Settings |

Sync on `hashchange` and on mount. Guard navigation away from a dirty editor with a
confirm dialog: *"You have unsaved changes. Leave this page without saving?"* — and a
`beforeunload` listener for tab close.

### 10.3 Screen: Widgets list

- Header: page title, search box with a clear (×) button, **Create Widget** primary button.
- Table columns: **Name** (link to editor) · **Reels** (count) · **Shortcode** (mono chip
  with copy-to-clipboard, toast "Copied!") · **Views** · **Clicks** · **Created** ·
  **Actions**.
- Row actions as icon buttons with tooltips: Edit · Statistics · Duplicate · Copy shortcode · Delete.
- Delete opens a confirm dialog: *"Are you sure you want to delete this widget?"* with the
  widget name, a note that the reels themselves are kept, and a loading state on confirm.
- Empty state: illustration + *"You haven't created any widget yet!"* + Create Widget CTA.
- Loading: skeleton rows that match the real row height (never a centered spinner that
  collapses the layout).

### 10.4 Screen: Reels library

- Header: search, **Add Reel** button, and — when any card is selected — a **Delete Selected (n)** button.
- Responsive card grid. Each card: 9:16 poster, hover-play preview, title, view count badge,
  a link/product count chip, and a checkbox for multi-select.
- Card actions on hover: Preview (opens the player modal) · Edit · Delete.
- Bulk delete confirm: *"Are you sure you want to remove {n} reels?"*, reports
  `"{n} reels deleted successfully!"` / `"{n} reels failed to delete."`.
- Empty state: *"You don't have any reels yet."* + Add Reel CTA.

### 10.5 Screen: Reel editor (modal or full page)

Left = media, right = metadata.

**Upload sources** — a source picker popover with four options, all working:
1. **Media Library** — `wp.media` frame, video mime types only, multi-select.
2. **Vimeo** — paste one or more `vimeo.com/…` URLs; validate via `/reels/validate-url`;
   pull the poster and duration from oEmbed; show a preview thumbnail per URL; error line
   *"Enter a valid Vimeo video URL."* under any bad row.
3. **YouTube Shorts** — same flow for `youtube.com/shorts/…` and `youtu.be/…`.
4. **Hosted / custom URL** — direct `.mp4`/`.webm` URLs from a CDN or object store.
   Helper text: *"For smooth playback across all browsers, use MP4 video URLs."*

Also support drag-and-drop onto the media zone (*"Click or drag and drop files here"*).

**Codec warning:** after selection, if any file is not H.264/AAC MP4 or WebM, show a
non-blocking warning — *"{n} video(s) may not play reliably on iOS/macOS Safari.
Recommended format: MP4 (H.264/AAC)."*

**Poster / thumbnail:** choose from the media library, or capture a frame from the video
at a chosen timestamp using a `<canvas>` and upload the result to the media library.

**Metadata panel:**
- Reel title (placeholder *"Enter reel title"*).
- **Links** section with an "Add link" button opening a two-tab dialog:
  - **Custom link** tab: Button Text (required, e.g. *"Buy Now"*), URL (required, validated,
    e.g. *"https://example.com"*), Campaign Name (required, e.g. *"Summer sale"*),
    Open in new tab (toggle), Custom class (optional). Inline field errors:
    *"Button text is required!"*, *"A valid url is required!"*, *"Campaign name is required!"*.
  - **Products** tab: debounced product search, multi-select result list with thumbnail +
    name + price, *"Select Products"* confirm. Disabled with an explanatory note when
    WooCommerce is inactive. Empty: *"No products are available to add."*
  - Added links appear as a sortable list of chips with edit and remove actions.

Save → `POST /reels` or `PUT /reels/:id` in one transaction, toast
*"Reel created successfully!"* / *"Reel updated successfully!"*.

### 10.6 Screen: Widget editor — the centrepiece

Three-pane layout, and the whole reason the plugin exists:

```
┌───────────────────────────────────────────────────────────────────┐
│  ‹ Back    Widgets / My Homepage Reels        [shortcode ⧉] [Save]│
├──────────────┬──────────────────────────────┬─────────────────────┤
│  REEL PICKER │      LIVE PREVIEW            │   STYLE PANEL       │
│              │                              │                     │
│ [search…]    │  renders the widget exactly  │ ▸ Layout            │
│ ┌──┐┌──┐     │  as the frontend will,       │ ▸ Thumbnail         │
│ │  ││  │     │  using the same components   │ ▸ Player            │
│ └──┘└──┘     │                              │ ▸ Product Card      │
│ click to add │  device toggle: 🖥 📱 📟      │ ▸ Widget Title      │
│              │                              │ ▸ Advanced          │
└──────────────┴──────────────────────────────┴─────────────────────┘
```

- **Left — reel picker.** Searchable grid of reels *not yet in this widget*
  (`GET /reels?exclude_widget=:id`). Click a card to add it. Infinite scroll or "Load more".
  Empty: *"No reels are available to add."*
- **Centre — live preview.** Renders through the **same React components as the frontend**,
  fed by local state. This is a hard architectural requirement (§11.1): the editor must not
  own a second copy of the render logic, or the preview will drift from reality.
  Reels here are **drag-to-reorder** (`@dnd-kit`), each with a remove (×) and a preview (▶).
  A small caption under the preview reads: *"This is a representation of how the widget will
  appear to visitors."* Device toggle switches the preview width and the responsive style
  bucket (desktop / tablet / mobile) that the controls edit.
  Empty: *"No reels have been added to this widget yet. Select some from the list on the left."*
- **Right — style panel.** Collapsible accordion sections (§10.7). Sticky within the
  viewport, independently scrollable, collapses to a slide-over drawer below 1024px with a
  floating "Customize" toggle button.
- **Header.** Editable widget name inline (placeholder *"Enter widget title"*), a shortcode
  chip with copy, a **Save** button that shows a spinner and is disabled while clean,
  and a Back button that respects the unsaved-changes guard.

### 10.7 Style panel — every control

Group into collapsible sections. Each control is labelled, and anything non-obvious carries
a short helper line beneath it.

**▸ Layout**
- Template: 5 visual preview cards — Grid · Carousel · Marquee · Stacked · Popup.
- Shape: Rectangle (9:16) / Circle (1:1) — icon toggle.
- Size: responsive slider (per device), 80–400 px.
- Gap: responsive slider, 0–64 px.
- Top/bottom spacing: slider 0–120 px.
- *Carousel only:* nav button position (inside / outside).
- *Marquee only:* speed slider, direction (left / right), pause on hover.
- *Stacked only:* depth (2–5), offset, scale.
- *Popup only:* trigger (on load / after delay / after scroll %), delay seconds, scroll %,
  corner position, size, show on mobile.

**▸ Thumbnail**
- Appearance: Overlay / Only Title / None — with a visual preview per option.
- Reel Title toggle (shown only when Appearance = Overlay).
- Hover effect: None / Zoom in / Zoom out.
- Border: width, color, radius (radius is responsive).
- Shadow size.
- Card background color (supports alpha).
- Show Play Button toggle → play icon size slider + icon color.
- Show Views toggle → views badge background + text/icon color.

**▸ Player**
- Player appearance: Overlay / Only Title / None (visual previews).
- Reel Title toggle (Overlay only).
- Slide direction: Horizontal / Vertical.
- Play behaviour: On click / Autoplay / On hover.
- Play with sound toggle — helper: *"Play with sound by default. Visitors can still mute
  or unmute anytime while watching."*
- Loop toggle.
- Show seekbar toggle.
- Show volume control toggle.
- Disable preview toggle — helper: *"Turn off previews for a cleaner, more focused browse."*
- Nav button colors: background, icon, hover background, hover icon, border radius.

**▸ Product Card**
- Style: Modern / Classic (visual previews with helper copy).
- Show Ratings toggle — helper: *"Control whether product ratings are visible."*
- Show Add to Cart toggle.
- Add to cart button text input.

**▸ Widget Title**
- Alignment: Hidden / Left / Center / Right.
- Font size slider, color picker.

**▸ Advanced**
- Lazy load videos toggle — helper: *"Defers video loading to reduce initial page weight."*
- Custom CSS class input.

**Control primitives to build once and reuse:** `ColorPicker` (swatch + popover + hex input
+ alpha + recent swatches), `ResponsiveSlider` (device tabs + slider + numeric input +
reset), `IconToggleGroup`, `VisualOptionCards` (image/SVG preview per option),
`Switch` with optional helper text, `CollapsibleSection`, `SearchInput` with clear button.

### 10.8 Screen: Statistics

- Header: widget name, date range is not needed for v1 (counters are lifetime totals).
- Three stat tiles: **Total Views**, **Total Clicks**, **CTR**.
- **Reel performance** table: thumbnail · title · views · clicks · CTR, sortable.
- **Button performance** table: reel · button text · campaign · URL · clicks, sortable.
- Empty: *"No stats available for this widget yet."*
- Follow the `dataviz` skill's guidance if you add charts; a clean table beats a bad chart.

### 10.9 Screen: Settings

Card-based form:
- **View tracking** — View limit (integer, per visitor per reel) and Time interval (minutes).
  Helper explaining they work together as a rate limit.
- **Public API** — Allow public fetch toggle, with a clear note about what it exposes.
- **Performance** — Cache render responses toggle, cache TTL.
- **Data** — Delete all plugin data on uninstall toggle, with a red warning.
- Save button with toast *"Settings updated successfully."*; validation error
  *"Please enter valid numbers."*

---

## 11. Frontend

### 11.1 Shared render core — architectural requirement

Put every rendering component under `src/shared/` and import it from **both** the admin
editor preview and the public bundle:

```
src/shared/
├── WidgetRenderer.jsx        # picks the template component from styles.template
├── templates/{Grid,Carousel,Marquee,Stacked,Popup}.jsx
├── Thumbnail.jsx
├── ViewsBadge.jsx
├── PlayIcon.jsx
├── player/{Player,PlayerSlide,Seekbar,VolumeControl,PlayerNav,LinkStack}.jsx
├── providers/{NativeVideo,VimeoPlayer,YouTubePlayer}.jsx
├── ProductCard.jsx
├── hooks/{useSwipe,useKeyboardNav,useWheelNav,useInView,useMediaQuery}.js
└── styles/                   # SCSS, all under .wooreels-embed / .wr-portal-root
```

The admin preview passes local unsaved state as props; the public bundle passes the
`/render/:id` response. Same components, same CSS, zero drift.

### 11.2 Mounting

`Wooreels_Shortcodes` outputs only a mount node — no server-rendered markup:

```php
// [wooreels id="12"]
sprintf(
    '<div class="wooreels-embed" data-widget-id="%d"></div>',
    absint( $atts['id'] )
);

// [wooreels_reel id="7"]  — a single reel, no widget chrome
sprintf(
    '<div class="wooreels-embed wooreels-embed--single" data-reel-id="%d"></div>',
    absint( $atts['id'] )
);
```

Invalid or missing id → render nothing on the frontend, and a small admin-only notice when
`current_user_can('manage_options')`.

The public bundle scans for `.wooreels-embed[data-widget-id]` on `DOMContentLoaded` **and**
observes the DOM with a `MutationObserver`, so widgets inside lazy-loaded content, AJAX
tabs, or Elementor popups still mount. Each mount gets its own `createRoot`.

**Only enqueue the public bundle when a widget is actually on the page.** Detect in PHP:
set a flag when a shortcode/block/Elementor widget renders, and register the script early
but enqueue it in `wp_footer`. A page with no reels must load zero WooReels JS/CSS.

### 11.3 Templates

**Grid** — CSS Grid, `repeat(auto-fill, minmax(var(--wr-size), 1fr))`, responsive size and
gap from the style object. Optional "Load more" when reel count is large.

**Carousel** — horizontal scroll rail with `scroll-snap-type: x mandatory`, prev/next nav
buttons (styled from `carouselBtn*`, positioned inside or outside), pointer drag-to-scroll
with proper click suppression after a drag, keyboard arrow support, hidden scrollbar,
buttons auto-hide at the ends. Must not fight the page's own scroll on touch.

**Marquee** — infinite auto-scrolling rail. Duplicate the track and translate with
`requestAnimationFrame` (not a CSS animation with a hardcoded width — it must adapt to
content). Pause on hover, pause when off-screen (`IntersectionObserver`), and **fully
disable the animation under `prefers-reduced-motion: reduce`**.

**Stacked** — a card deck; the top card is interactive, the ones behind are offset and
scaled per `stacked.depth/offset/scale`. Swipe or click advances the deck with a spring
transition.

**Popup** — a floating sticky bubble in a chosen corner. Trigger on load, after N seconds,
or after scrolling N%. Dismissible with a × that persists the dismissal in `sessionStorage`
per widget id. Respects `showOnMobile`.

### 11.4 Thumbnail

- Aspect ratio `9/16` for rectangle, `1/1` + `border-radius:50%` for circle.
- Poster image if set; otherwise the video's first frame via `preload="metadata"` and
  `#t=0.1`; otherwise a neutral placeholder.
- `loading="lazy"` on images; when `lazyLoad` is on, the `<video>` gets no `src` until it
  enters the viewport (`IntersectionObserver`, 200px rootMargin).
- Hover effect scales the media inside `overflow:hidden` — never the box, so the grid
  never reflows.
- Overlay appearance: a bottom gradient scrim with the first link's button text, or the
  reel title as fallback when `showFallbackTitle` is on.
- Views badge: positioned per shape (centred below for circle, inset for rectangle),
  formatted compactly — `950`, `1.2k`, `3m`, `1.1b`.
- The whole thumbnail is a `<button>` with an accessible name
  (`aria-label="Play reel: {title}"`), not a `<div onClick>`.

### 11.5 Player

Rendered in a **portal** into `document.body` under `.wr-portal-root`, so no theme
`overflow:hidden` or stacking context can clip it.

**Layout**
- Backdrop `rgba(0,0,0,.92)` with a light blur; click-outside closes — but only when the
  pointer *started* on the backdrop (track `pointerdown` target), so dragging the seekbar
  out of the frame never closes the player.
- A centred 9:16 stage, `max-height: 92vh`, letterboxed on desktop, edge-to-edge on mobile.
- Prev/next chevrons outside the frame on desktop, hidden on mobile (swipe instead).
- Close × top-right.

**Navigation**
- Swipe: horizontal or vertical per `slideDirection`, with a velocity threshold and a
  rubber-band at the ends.
- Keyboard: `←/→` or `↑/↓` per direction, `Space` play/pause, `M` mute, `Esc` close.
- Mouse wheel advances between reels (throttled).
- Advancing past the last file of a reel moves to the next reel; past the last reel it wraps.

**Controls**
- Play/pause via a full-frame click layer.
- Seekbar: track + fill + draggable thumb, keyboard accessible (`role="slider"`,
  `aria-valuenow`), with a pointer-capture drag that works on touch and does **not**
  trigger swipe navigation.
- Volume: mute toggle plus a slider that appears on hover/focus.
- Autoplay honours `playWithSound`; browsers block unmuted autoplay, so start muted with a
  visible "tap for sound" affordance and unmute on first user gesture.
- `loop` per style.
- Only ever one video playing across the page.

**Content**
- Links render in a stack at the bottom of the frame: `custom` → styled CTA button,
  `product` → a ProductCard.
- Appearance `title` shows only the reel title; `none` shows nothing.

**Body scroll lock** while open, restoring the exact scroll position on close.

**Mobile back button:** push a history state when the player opens and close on `popstate`,
so Android back closes the player instead of leaving the page.

**Focus management:** trap focus inside the player, return focus to the originating
thumbnail on close, `role="dialog"` + `aria-modal="true"` + `aria-label`.

**View tracking:** fire `POST /widgets/:wid/reels/:id/view` once per reel per session
(guard with a `Set` in memory plus `sessionStorage`), only after ~1s of actual playback —
not on open. Swallow `429` silently.

### 11.6 Providers

Abstract behind one interface — `{ play, pause, seek, setVolume, getDuration, getCurrentTime, on(event) }`:

- **Native** — `<video playsInline muted={…} preload>`, with `playsinline` and
  `webkit-playsinline` so iOS never hijacks into its fullscreen player.
- **Vimeo** — Player SDK loaded lazily only when a Vimeo reel is actually opened, `dnt=1`.
- **YouTube** — IFrame API loaded lazily, `playsinline=1`, `rel=0`, `modestbranding=1`.

Never load a provider SDK on a page that has no reel from that provider.

### 11.7 Product card & add to cart

Two visual styles, both shipped:
- **Modern** — glassy, full-width across the bottom of the frame: rounded thumbnail left,
  title + price + stars stacked, Add to cart on the right.
- **Classic** — a compact opaque card floating in the lower-left, title over price,
  full-width Add to cart beneath.

Add to cart posts to the **WooCommerce Store API** (`/wp-json/wc/store/v1/cart/add-item`)
with the `Nonce` header from `storeApiNonce`. States: `Add to cart` → `Adding…` (spinner,
disabled) → `View cart` (links to the cart) plus a toast *"Product added to cart!"*.
Failures show the API message: *"Failed to add to cart: {message}"*, falling back to
*"Failed to add to cart. Please try again."*.
Variable products link to the product page instead of adding directly.
Emit `wooreels:added-to-cart` as a DOM `CustomEvent` and trigger `wc_fragment_refresh` so
theme cart counters update.

Clicking the product **title or image** navigates and must **not** toggle play/pause —
stop propagation on those elements.

**Every** link click (custom or product) fires `POST /track/click` first,
`navigator.sendBeacon` where available so navigation doesn't cancel it.

---

## 12. Gutenberg block

Register `wooreels/reels` with `register_block_type()` from PHP, `render_callback` →
the same markup as the shortcode.

- `attributes: { widgetId: { type: 'string', default: '' } }`
- Edit: a `SelectControl` (or `ComboboxControl` for search) of widgets fetched from
  `/widgets`, plus a `Placeholder` with the plugin icon when nothing is selected, plus a
  live thumbnail-count preview. Inspector panel offers a "Open in WooReels" link.
- Save: `null` (dynamic block).
- `block.json` with `"apiVersion": 3`, `"textdomain": "wooreels"`, and an SVG icon.
- Enqueue the block editor script only on block-editor screens.

---

## 13. Elementor widget

Load `includes/integrations/class-wooreels-elementor.php` only when
`did_action('elementor/loaded')`. Register on `elementor/widgets/register`.

- Name `wooreels`, title *"WooReels"*, custom SVG icon (registered via an editor CSS file),
  category `general`.
- Control: `SELECT2` of widgets — fetched through `rest_do_request()` internally, not HTTP.
- A `NOTICE` control explaining the preview renders on the live page.
- `render()` → `do_shortcode( '[wooreels id="…"]' )`.
- Declare `get_script_depends()` / `get_style_depends()` so Elementor loads the bundle.
- Handle the editor preview: Elementor's iframe needs the mount observer (§11.2) to catch
  dynamically inserted widgets.

---

## 14. WooCommerce integration

- Everything Woo-related is guarded by `class_exists( 'WooCommerce' )`. The plugin must be
  fully functional (minus product tagging) without WooCommerce installed.
- Product search uses `wc_get_products()` with `status => publish`, `limit`, `page`, `s`.
- Return `price_html` already formatted by Woo so currency/tax settings are respected —
  never format prices in JS.
- Ratings come from `get_average_rating()` / `get_rating_count()`; render as stars, not a number.
- Respect `is_in_stock()` — out-of-stock products show a disabled button reading
  *"Out of stock"*.
- Declare HPOS compatibility (§4).

---

## 15. Design system

The admin UI must not look like a default WordPress settings page, and it must not look
like generic AI-generated Tailwind. Aim for the polish of Linear or Vercel's dashboard:
calm, dense, confident, with real hierarchy.

**Load the `frontend-design` skill before writing any UI, and follow it.**

### Tokens

Define once on `#wooreels-admin-app` and `.wooreels-embed`; never hardcode a color in a
component:

```scss
--wr-primary: #2563eb;          --wr-primary-fg: #ffffff;
--wr-primary-hover: #1d4ed8;    --wr-primary-subtle: #eff6ff;
--wr-fg: #111827;               --wr-fg-muted: #6b7280;
--wr-fg-subtle: #9ca3af;
--wr-bg: #ffffff;               --wr-bg-muted: #f9fafb;
--wr-bg-sunken: #f3f4f6;
--wr-border: #e5e7eb;           --wr-border-strong: #d1d5db;
--wr-ring: #60a5fa;
--wr-danger: #dc2626;           --wr-danger-subtle: #fef2f2;
--wr-success: #16a34a;          --wr-warning: #d97706;

--wr-radius-sm: 6px;  --wr-radius: 10px;  --wr-radius-lg: 16px;
--wr-shadow-sm: 0 1px 2px rgb(0 0 0 / .05);
--wr-shadow:    0 4px 12px rgb(0 0 0 / .08);
--wr-shadow-lg: 0 16px 48px rgb(0 0 0 / .16);
--wr-font: 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
--wr-ease: cubic-bezier(.22,.61,.36,1);
```

### Rules

- **Type scale:** 12 / 13 / 14 / 16 / 20 / 24 / 32. Body 14. Labels 13/500. Section
  headings 13 uppercase with `letter-spacing:.04em` in `--wr-fg-muted`.
- **Spacing:** 4px base, use 4/8/12/16/24/32/48 only.
- **Density:** the style panel is a dense tool, not a marketing page. 12px between controls,
  20px between sections, a 1px divider between groups.
- **Motion:** 150–200ms on `--wr-ease` for hovers and toggles, 240ms for panels and modals.
  Everything wrapped in `@media (prefers-reduced-motion: reduce) { … }`.
- **Focus:** a visible 2px `--wr-ring` outline with 2px offset on every interactive element.
  Never `outline: none` without a replacement.
- **Empty and loading states are designed, not afterthoughts.** Skeletons that match the
  real content's dimensions; empty states with an illustration, one sentence, and one CTA.
- **Dark mode:** respect `prefers-color-scheme: dark` for the *frontend embed* tokens.
  The admin follows WordPress's own admin color scheme (light), so don't fight it.
- **Toasts** bottom-right, auto-dismiss 4s, with success/error/loading variants, stacked,
  pausable on hover.
- **Never ship** a raw `<select>`, a browser `alert()`/`confirm()`, or an unstyled
  `<input type="color">`.

### Frontend embed rules

- Zero layout shift: every media box declares `aspect-ratio` before load.
- The embed inherits nothing harmful from the theme — reset `box-sizing`, `margin`, and
  `button` borders inside `.wooreels-embed` only.
- Nothing may exceed the container width or cause horizontal page scroll at 320px.
- Touch targets ≥ 44×44px.

---

## 16. Accessibility

Not optional:
- Thumbnails are buttons with descriptive `aria-label`s.
- Player is `role="dialog" aria-modal="true"` with a focus trap and focus restoration.
- Seekbar and volume are `role="slider"` with `aria-valuemin/max/now/text` and full
  keyboard control.
- All icon-only buttons have `aria-label`s; decorative SVGs get `aria-hidden="true"`.
- Videos support captions when a `<track>` is supplied.
- Color contrast ≥ 4.5:1 for text; validate the default palette.
- The whole admin is keyboard operable, including the drag-to-reorder list
  (`@dnd-kit` keyboard sensor: Space to lift, arrows to move, Space to drop).
- `prefers-reduced-motion` disables marquee, autoplay-on-scroll, and all transitions.

---

## 17. Internationalization

- Every user-facing string in PHP: `__()` / `esc_html__()` with domain `wooreels`.
- Every string in JS: `@wordpress/i18n` `__()`, `sprintf`, `_n()` — domain `wooreels`.
- `wp_set_script_translations()` for each enqueued bundle.
- Generate `languages/wooreels.pot` with `wp i18n make-pot . languages/wooreels.pot --exclude=node_modules,dist,build`.
- **Full RTL support**: use CSS logical properties (`margin-inline-start`,
  `padding-block`, `inset-inline-end`) throughout; mirror carousel direction, chevron
  icons, and swipe direction when `document.dir === 'rtl'`.
- Never concatenate translated fragments — use `sprintf` with placeholders.
- Format numbers with `Intl.NumberFormat` using the site locale.

---

## 18. Rate limiting & tracking integrity

- `Wooreels_Rate_Limiter::check( $key, $limit, $seconds )` backed by transients.
- View key: `view:{reel_id}:{hashed ip}`. Defaults: 2 views per 1 minute, both configurable
  in Settings.
- Hash the IP (`wp_hash( $ip )`) — never store a raw IP. Say so in `readme.txt`.
- Click tracking is not rate limited but is an atomic
  `INSERT … ON DUPLICATE KEY UPDATE click_count = click_count + 1` so concurrent clicks
  cannot lose counts.
- Bots: skip tracking when the UA matches a simple bot pattern, and when
  `wp_is_json_request()` comes from a REST preflight.

---

## 19. Migrations

`Wooreels_Migrations::maybe_upgrade()` runs on `init` (priority 5), compares
`get_option('wooreels_db_version')` against `WOOREELS_DB_VERSION`, runs the ordered list of
pending migration callbacks inside a try/catch, then updates the option.
Ship the framework plus a no-op `1.0.0` entry. Never call it during `WP_INSTALLING`.

---

## 20. Performance

- **Render caching.** `GET /render/:id` output is cached in a transient keyed
  `wooreels_render_{id}_{styles_hash}`, TTL from Settings (default 12h). Bust on any
  widget/reel/file/pivot write. Send `Cache-Control: public, max-age=…` so CDNs can help,
  and add a `?v={updated_at}` cache-buster to the URL the frontend requests.
- **Bundle discipline.** Admin and public are separate entry points. The public bundle must
  stay lean — no admin components, no product-search code, no drag-and-drop library.
  Code-split the player so a page that never opens one doesn't parse it.
- **Externals.** React, ReactDOM, `@wordpress/element`, `@wordpress/i18n`,
  `@wordpress/api-fetch`, `@wordpress/components` come from WordPress core handles — never
  bundle a second React copy. `@wordpress/scripts` handles this via the generated
  `*.asset.php`; use it as the dependency array in `wp_enqueue_script`.
- **N+1 queries.** Hydrating a widget's reels must be **three** queries total (reels, files,
  clicks) joined in PHP — never one query per reel.
- **Media.** `loading="lazy"`, `decoding="async"`, `preload="metadata"` (never `auto`),
  `IntersectionObserver` gating of `<video src>` when `lazyLoad` is on.
- Target: a page with one 12-reel carousel adds < 60KB gzipped JS and < 12KB CSS before the
  player is opened.

---

## 21. Quality gates

Before calling any phase done:

- **PHPCS** clean against `WordPress-Extra` + `WordPress-Docs`. Every function has a
  docblock with `@since`, `@param`, `@return`.
- **ESLint** clean (`@wordpress/eslint-plugin`), Prettier formatted (`wp-prettier`).
- No `console.log`, no `error_log` left in shipped paths except inside catch blocks.
- No PHP notices/warnings with `WP_DEBUG` and `WP_DEBUG_DISPLAY` on.
- Plugin Check plugin passes with no errors.
- Tested at 320px, 768px, 1024px, 1440px.
- Tested with WooCommerce active **and** deactivated.
- Tested in an RTL locale (switch site language to Arabic).
- Activation on a clean install creates all five tables; deactivation loses no data;
  uninstall with the flag off leaves data intact, with it on removes everything.

---

## 22. Build order

Work in phases. **Finish and verify each phase before starting the next.** Show me the
diff and a short summary at each phase boundary rather than building everything silently.

| # | Phase | Deliverable |
| --- | --- | --- |
| 1 | **Foundation** | Real plugin header, constants, Schema + Activator + Migrations, all five tables created on activate, `uninstall.php`. Verify tables in the DB. |
| 2 | **Data layer** | `Wooreels_Repository` base + the five repositories, `Wooreels_Settings`, `Wooreels_Validator`. Unit-check via WP-CLI `eval`. |
| 3 | **REST API** | Every route in §9, with permissions, validation, and error envelopes. Verify each with `wp-cli` / REST console before touching React. |
| 4 | **Admin shell** | Menu + submenus + redirects, mount node, bootstrap payload, hash router, app chrome (header, breadcrumb, toasts), design tokens and the shared control primitives from §10.7. |
| 5 | **Reels library** | Reels list, card grid, multi-select delete, reel editor with all four upload sources, links dialog (custom + product tabs), poster capture. |
| 6 | **Shared render core** | `src/shared/` — Thumbnail, Grid, Carousel, Player with seekbar/volume/swipe/keyboard, ProductCard, providers. Built once, used by 7 and 8. |
| 7 | **Widget editor** | Three-pane editor, drag-to-reorder, live preview wired to the shared core, the complete style panel, save/duplicate/delete, shortcode copy. |
| 8 | **Public frontend** | Shortcodes, conditional enqueue, mount + MutationObserver, all five templates, view/click tracking, add to cart. |
| 9 | **Statistics + Settings** | Stats screen with tiles and tables; Settings screen. |
| 10 | **Integrations** | Gutenberg block, Elementor widget. |
| 11 | **Polish** | i18n pass + POT, RTL pass, a11y pass, performance pass, render caching, `readme.txt`, `CHANGELOG.md`, screenshots. |

---

## 23. Working agreement

- **Ask before inventing.** If a requirement here is ambiguous, ask rather than guessing —
  once, in a batch, at the start of the phase.
- **Never stub.** No `// TODO`, no `return [];` placeholder, no "implement later". If a
  phase is too big, split it — but what you deliver must work end to end.
- **No new dependencies without asking.** The expected set is: React (from core),
  `@wordpress/*` (from core), `@dnd-kit/core` + `@dnd-kit/sortable` for reordering, and
  a tiny toast implementation you write yourself. No UI kit, no Tailwind, no lodash,
  no moment. Icons: inline SVG components you author, no icon package.
- **SCSS, not CSS-in-JS.** `@wordpress/scripts` compiles `.scss` out of the box. One
  stylesheet per component folder, all namespaced.
- **Verify as you go.** After each phase, actually load the admin page / frontend page and
  confirm it works. Report what you checked. If something fails, say so with the output
  rather than declaring success.
- **Match the file style.** WPPB naming (`class-wooreels-*.php`), tabs in PHP per WP
  standards, `snake_case` PHP, `camelCase` JS, `kebab-case` files and CSS.
- Commit at each phase boundary with a clear message.

---

## Appendix A — string bank

Use these exact strings (all wrapped in `__()`), so the UI reads consistently:

**Nav & titles:** All Widgets · All Reels · Create Widget · Settings · Statistics ·
Customization · Layout · Thumbnail · Player · Product Card · Widget Title · Advanced

**Actions:** Save · Update · Cancel · Delete · Delete Selected · Duplicate · Preview ·
Edit · Copy · Copied! · Add Reel · Add Videos · Tag Products · Add Custom Link ·
Select Products · Select all · Clear · Back · Continue · Upload · Choose from Media

**Fields:** Widget Name · Reel Title · Button Text · Url · Campaign Name · Custom class ·
Open in new tab · Size · Gap · Shape · Border Radius · Border Width · Border Color ·
Alignment · Font size · Title Color · Play Icon Size · Position · Loop · Hover effect

**Options:** Grid · Carousel · Marquee · Stacked · Popup · Circle · Rectangle · Overlay ·
Only Title · None · Zoom in · Zoom out · Horizontal · Vertical · Modern · Classic ·
Inside · Outside · Left · Center · Right · Hidden · Autoplay · Play on Hover ·
Initial Page Load · After Some Time · After Scrolling Distance

**Placeholders:** Enter widget title · Enter reel title · Search widgets… · Search reels… ·
Search products… · e.g Buy Now · e.g https://example.com · e.g Summer sale ·
Click or drag and drop files here

**Toasts:** Widget created successfully! · Widget deleted successfully! ·
Changes saved successfully! · Reel created successfully! · Reel updated successfully! ·
Reel deleted successfully! · Settings updated successfully. · Product added to cart! ·
Copied! · Something went wrong. Please try again.

**Confirms:** Are you sure you want to delete this widget? ·
Are you sure you want to remove this reel? · Are you sure you want to remove %d reels? ·
You have unsaved changes. Leave this page without saving?

**Empty states:** You haven't created any widget yet! · You don't have any reels yet. ·
No reels are available to add. ·
No reels have been added to this widget yet. Select some from the list on the left to get started. ·
No stats available for this widget yet. · No products are available to add.

**Helpers:** These reels will be shown in this widget ·
This is a representation of how the widget will appear to visitors. ·
Play with sound by default. Visitors can still mute or unmute anytime while watching. ·
For smooth playback across all browsers, use MP4 video URLs. ·
%d video(s) may not play reliably on iOS/macOS Safari. Recommended format: MP4 (H.264/AAC).

---

## Appendix B — reference implementation

A working plugin with the same domain model exists at
`../ecomm-reels/` (ReelsWP 4.1.79). Read it for reference on the data model and REST
shape — its `includes/domain/repositories/` and `includes/api/controllers/` are the clearest
parts. Its frontend is shipped only as a minified bundle (`build/index.min.js`), so there is
no source to copy; build the React side fresh from this specification.

**Do not copy its code, class names, table names, CSS prefixes, or text domain.** Improvements
this spec deliberately makes over it:

1. Persistent `sort_order` on the pivot (it ordered by insert id, so reorder didn't stick).
2. Click uniqueness scoped to `(widget_id, btn_uuid)` (it used a global unique, merging
   counts across widgets).
3. Atomic click upsert instead of a read-then-write race.
4. Conditional asset loading (it enqueued its full bundle on every frontend page).
5. Multiple files and multiple links per reel actually supported end to end (it silently
   truncated both to the first entry when hydrating).
6. Hashed IPs in rate-limit keys.
7. Render-response caching with proper invalidation.
8. Real focus management, ARIA, and reduced-motion support in the player.
