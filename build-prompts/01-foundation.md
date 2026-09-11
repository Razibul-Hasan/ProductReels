# 01 — Foundation

**Deliverable:** real plugin header, constants, schema, activator, migrations, uninstall.
All five tables created on activate. Verify them in the database.

Full spec: `BUILD PROMPT.md` §4, §6, §7, §19.

## 1. Fix the plugin header

`wooreels.php` still says `Plugin Name: WordPress Plugin React Boilerplate`. Replace with:

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

Define `WOOREELS_VERSION`, `WOOREELS_DB_VERSION`, `WOOREELS_FILE`, `WOOREELS_PATH`, `WOOREELS_URL`.
Declare HPOS compatibility on `before_woocommerce_init` via `FeaturesUtil::declare_compatibility( 'custom_order_tables', WOOREELS_FILE, true )`.

## 2. `includes/install/class-wooreels-schema.php`

`tables()`, `table( $name )`, `install()`, `statements()`. Five tables via `dbDelta()` —
exact DDL in spec §6:

| Table | Columns (beyond `id`, timestamps) | Keys |
| --- | --- | --- |
| `wooreels_widgets` | `slug`, `name`, `styles_json` LONGTEXT, `created_by` | `UNIQUE uq_slug (slug)` |
| `wooreels_reels` | `reel_uuid` CHAR(36), `title`, `thumbnail`, `links` LONGTEXT (JSON), `view_count` | `UNIQUE uq_reel_uuid` |
| `wooreels_widget_reels` | `widget_id`, `reel_id`, `sort_order` | `UNIQUE (widget_id, reel_id)`, `idx_widget`, `idx_reel`, `idx_widget_sort (widget_id, sort_order)` |
| `wooreels_files` | `reel_id`, `file_uuid`, `wp_media_id`, `url`, `mime_type`, `source`, `provider_id`, `poster_url`, `duration` | `UNIQUE uq_file_uuid`, `idx_reel` |
| `wooreels_clicks` | `widget_id`, `reel_id`, `reel_title`, `btn_uuid`, `button_text`, `button_url`, `campaign_name`, `click_count` | `UNIQUE uq_btn (widget_id, btn_uuid)`, `idx_widget` |

**Schema rules**
- `sort_order` is what makes drag-to-reorder persistent. Always `ORDER BY sort_order ASC, id ASC`.
- `uq_btn` is `(widget_id, btn_uuid)` — the same reel in two widgets counts clicks separately.
- `source` is `varchar` not `enum` (`native|vimeo|youtube|hosted`); validate the vocabulary in PHP.
- Store the schema revision in `wooreels_db_version`, **separate** from `WOOREELS_VERSION`, so
  bumping the schema re-runs `dbDelta()` on next load without reactivation.

## 3. `includes/install/class-wooreels-migrations.php`

`maybe_upgrade()` on `init` priority 5. Compares `get_option('wooreels_db_version')` against
`WOOREELS_DB_VERSION`, runs the ordered pending migration callbacks in try/catch, then updates
the option. Ship the framework plus a no-op `1.0.0` entry. Never run during `WP_INSTALLING`.

## 4. Activator / deactivator / uninstall

- Activator → `Wooreels_Schema::install()` + seed default settings.
- Deactivator → flush rewrite rules and transients only. **Never drop data.**
- `uninstall.php` → drops the five tables and deletes `wooreels_settings`, `wooreels_db_version`,
  and every `wooreels_*` transient — **only** when the setting `delete_data_on_uninstall` is
  true. Default false.

## Done when

- Activating on a clean install creates all five tables with the exact keys above.
- Deactivating loses no data.
- Uninstall with the flag off leaves data intact; with it on, removes everything.
- Show me the `SHOW TABLES LIKE '%wooreels%'` and one `SHOW CREATE TABLE` as proof.
