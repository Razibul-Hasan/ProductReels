# 03 — REST API (`wooreels/v1`)

**Deliverable:** every route below, with permissions, validation, and error envelopes.
Verify each with WP-CLI / a REST console **before** touching React.

Full spec: `BUILD PROMPT.md` §9, §8.3, §18.

## Conventions

- `includes/rest/class-wooreels-rest.php` registers all controllers on `rest_api_init`.
- `class-wooreels-rest-controller.php` — abstract base: permission callbacks, error envelope,
  argument schema.
- Errors are `WP_Error` → `{ code: 'wooreels_x_failed', message: '…', data: { status: 4xx } }`.
  Never leak exception messages; `error_log()` the real one, return a generic string.
- List endpoints send `X-WP-Total` and `X-WP-TotalPages`.
- Admin routes: `current_user_can( 'manage_options' )`. Public routes: `__return_true` + rate limit.

## Widgets — `class-wooreels-rest-widgets.php` (admin)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/widgets` | Paginated. `page`, `per_page`, `search`, `orderby` (`id\|name\|created_at`), `order`. Returns `id, name, slug, reel_count, view_total, click_total, created_at`. |
| `GET` | `/widgets/(?P<id>\d+)` | Full widget incl. `styles` + ordered `reels[]`, each hydrated with `files[]` and `links[]`. |
| `POST` | `/widgets` | Body `name`, `styles`, `reel_ids[]`. Auto-names `Untitled widget N`, generates unique slug. |
| `PUT/PATCH` | `/widgets/(?P<id>\d+)` | Update name / styles / reel_ids (replaces pivot, `sort_order` = array index). |
| `POST` | `/widgets/(?P<id>\d+)/duplicate` | `"<name> (Copy)"`, same styles + pivot + order. Does **not** copy click counters. |
| `DELETE` | `/widgets/(?P<id>\d+)` | Widget + pivot + click rows. Reels stay. |
| `GET` | `/widgets/(?P<id>\d+)/stats` | `{ reels: [{reel_id,title,view_count}], buttons: [{btn_uuid,reel_id,reelTitle,buttonText,buttonUrl,campaignName,clickCount}], totals: {views,clicks,ctr} }` |

## Reels — `class-wooreels-rest-reels.php` (admin)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/reels` | Paginated. `search`, `exclude_widget` (reels **not** in that widget — powers the picker), `page`, `per_page`. Each item hydrated with its first file. |
| `GET` | `/reels/(?P<id>\d+)` | Single reel, all files + links. |
| `POST` | `/reels` | Reel + files in one transaction. `title`, `thumbnail`, `links[]`, `files[]`. Auto-names `Untitled reel N`. |
| `PUT/PATCH` | `/reels/(?P<id>\d+)` | Update title / thumbnail / links / files (files replaced wholesale). |
| `DELETE` | `/reels/(?P<id>\d+)` | Reel + files + pivot rows. |
| `POST` | `/reels/bulk-delete` | Body `ids[]` → `{ deleted: n, failed: [] }`. |
| `POST` | `/reels/validate-url` | Body `url`, `source`. Resolves Vimeo / YouTube / hosted → `{ valid, provider_id, poster_url, duration, mime_type }`. |

## Files, Products, Tracking, Settings

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `DELETE` | `/files/(?P<id>\d+)` | admin | Remove one media row. Does not delete the WP attachment. |
| `GET` | `/products` | admin | `search`, `page`, `per_page` → `{ id, name, price_html, image, permalink, rating, rating_count, in_stock }`. Uses `wc_get_products()`, **never** raw SQL. Returns `[]` with 200 when Woo is inactive. |
| `GET` | `/products/batch` | public | `ids[]`. Display fields the player needs. Cached in a 5-minute transient keyed by the id set. |
| `GET` | `/render/(?P<id>\d+)` | public | **The frontend's only read.** `{ id, name, styles, reels: [{ id, reel_uuid, title, thumbnail, view_count, files[], links[] }] }`. Cached — see phase 11. |
| `POST` | `/widgets/(?P<wid>\d+)/reels/(?P<id>\d+)/view` | public | Increment `view_count`, rate-limited per IP+reel, `429` when limited. |
| `POST` | `/track/click` | public | `widget_id`, `reel_id`, `reel_title`, `btn_uuid`, `button_text`, `button_url`, `campaign_name`. Atomic upsert into `wooreels_clicks`. |
| `GET` | `/settings` | admin | Merged-with-defaults settings object. |
| `PUT` | `/settings` | admin | Partial update, validated + clamped. |

## Rate limiting — `includes/support/class-wooreels-rate-limiter.php`

`check( $key, $limit, $seconds )` backed by transients. View key `view:{reel_id}:{hashed ip}`.
Defaults 2 views per 1 minute, both configurable in Settings. Hash the IP with `wp_hash( $ip )` —
**never store a raw IP**, and say so in `readme.txt`. Skip tracking for obvious bot UAs.

## Media support — `includes/support/class-wooreels-media.php`

Mime sniffing, provider URL parsing (`vimeo.com/…`, `youtube.com/shorts/…`, `youtu.be/…`,
direct `.mp4`/`.webm`), poster + duration fetch via oEmbed.

## Done when

Every route above returns correct data and correct status codes from a REST client, including
the 401 path for admin routes when logged out and the 429 path on the view route. Show me the
calls and responses.
