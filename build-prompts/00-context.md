# 00 — Context (paste this first, every session)

Working directory is the `wooreels/` plugin folder. Full spec: `BUILD PROMPT.md`.

## Mission

Build **WooReels** — a WooCommerce shoppable-video plugin. Store owners group short vertical
videos ("reels") into reusable, styled **widgets**, tag WooCommerce products or CTA buttons
inside each reel, and drop a widget anywhere via shortcode, block, or Elementor. Visitors tap
a thumbnail, a fullscreen swipeable player opens, and they add to cart without leaving the page.
Views and clicks are tracked per widget.

Production-grade and complete: no free/pro split, no locked controls, no license checks, no
telemetry, no external HTTP calls. Build on the existing WPPB + React boilerplate already in
`wooreels/` — do **not** scaffold a new plugin.

## Domain model

- **Reel** — one video + title + poster + zero or more links. Reusable across many widgets.
- **Widget** — a named, styled, ordered collection of reels. Owns the whole style JSON.
- **Link** — a button on a reel: `custom` (text + url + campaign) or `product` (Woo product id).
  Each has a stable `btn_uuid` used as the click-tracking key.

Deleting a widget never deletes its reels. Deleting a reel removes its pivot rows and file rows.

## Naming contract — exact, everywhere

| Thing | Value |
| --- | --- |
| Slug / text domain | `wooreels` |
| PHP class prefix | `Wooreels_` (WPPB style, no namespaces) |
| Constants | `WOOREELS_VERSION`, `WOOREELS_DB_VERSION`, `WOOREELS_FILE`, `WOOREELS_PATH`, `WOOREELS_URL` |
| Tables | `{$wpdb->prefix}wooreels_*` |
| Options | `wooreels_settings`, `wooreels_db_version` |
| REST namespace | `wooreels/v1` |
| Shortcodes | `[wooreels id="1"]`, `[wooreels_reel id="1"]` |
| Block / Elementor | `wooreels/reels` · `wooreels` |
| Asset handles | `wooreels-admin`, `wooreels-public`, `wooreels-block` |
| CSS prefix | `.wr-` (BEM) · custom props `--wr-*` |
| Mount nodes | `#wooreels-admin-app` · `.wooreels-embed` · `.wr-portal-root` |
| JS globals | `window.wooreelsAdmin`, `window.wooreelsPublic` |
| Capability | `manage_options` |
| Hooks fired | `wooreels_*` |

**Never emit** `ecomm-reels`, `ecommreels`, `reelswp`, `ecr-`, or `wp_reels_` anywhere.
**Namespace all CSS** under `#wooreels-admin-app`, `.wooreels-embed`, or `.wr-portal-root`.

## Architecture

Extend WPPB. Every new class is `require_once`'d in `Wooreels::load_dependencies()` and hooked
through `$this->loader`. Folders under `includes/`: `install/`, `data/`, `rest/`, `frontend/`,
`integrations/`, `support/`. Full tree: spec §7.

`global $wpdb` appears in exactly one place — `Wooreels_Repository::db()`. Controllers never
touch `$wpdb`. Repositories return typed arrays (ints as int, JSON decoded, bools as bool).

## Security — non-negotiable

- Every admin route: `current_user_can( 'manage_options' )`.
- Always `$wpdb->prepare()` or `insert/update/delete` with format arrays. Never interpolate SQL.
  Table names only from `Wooreels_Schema::table()`.
- `orderby`/`order` matched against a hardcoded allowlist.
- Sanitize on write (`sanitize_text_field`, `esc_url_raw`, `absint`), escape on output.
- Public tracking routes are `__return_true` but rate limited (§18) and take ints + a uuid only.
- Multi-row writes run in a transaction with rollback on throwable.
- Cast map on every repository — an unknown payload key can never reach the database.

## Working agreement

- **Ask before inventing.** Ambiguity → ask once, batched, at the start of a phase.
- **Never stub.** No `// TODO`, no placeholder returns. Split a phase rather than faking it.
- **No new dependencies without asking.** Allowed: React + `@wordpress/*` from core,
  `@dnd-kit/core` + `@dnd-kit/sortable`, and a toast you write yourself. No UI kit, no Tailwind,
  no lodash, no icon package — inline SVG components you author.
- **SCSS, not CSS-in-JS.** One stylesheet per component folder, all namespaced.
- **Verify as you go.** Load the real page and confirm. If it fails, say so with the output.
- **Match the file style.** `class-wooreels-*.php`, tabs in PHP, `snake_case` PHP,
  `camelCase` JS, `kebab-case` files and CSS.
- Show a diff and a short summary at each phase boundary. Commit at each boundary.
- Load the **`frontend-design`** skill before writing any UI.
- Use the exact strings from `BUILD PROMPT.md` Appendix A, all wrapped in `__()`.
