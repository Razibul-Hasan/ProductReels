# 04 — Admin shell

**Deliverable:** menu + submenus + redirects, mount node, bootstrap payload, hash router,
app chrome (header, breadcrumb, toasts), design tokens, and the shared control primitives.

Full spec: `BUILD PROMPT.md` §8.3, §10.1, §10.2, §10.7, §15.
**Load the `frontend-design` skill before writing any UI.**

## Menu

```
WooReels                 (dashicons-format-video, position 25)
├── All Widgets          page=wooreels  #/widgets
├── All Reels            page=wooreels  #/reels
├── Create Widget        page=wooreels  #/widgets/new
└── Settings             page=wooreels  #/settings
```

One `add_menu_page` rendering `<div id="wooreels-admin-app"></div>`. Submenus pointing at a hash
route use a callback that `wp_safe_redirect`s to `admin.php?page=wooreels#/…` — that is how one
SPA gets four real WP menu items. Highlight the right submenu as the hash changes.

Enqueue the admin bundle **only** when `get_current_screen()->id` contains `wooreels`, and call
`wp_enqueue_media()` on those screens.

## Bootstrap payload

```js
window.wooreelsAdmin = {
  restUrl, apiBase, nonce /* wp_rest */, adminUrl,
  hasWoo: true,
  currency: { code:'USD', symbol:'$', position:'left', decimals:2 },
  storeApiNonce,            // wc_store_api, only when Woo active
  capabilities: { manage: true },
  defaults: { /* default style object, spec §8.1 */ },
  version: '1.0.0',
};
```

## Routing

Hash router, **no `react-router` dependency** — a small `useHashRoute()` hook. Sync on
`hashchange` and on mount.

| Hash | Screen |
| --- | --- |
| `#/widgets` (default) | Widgets list |
| `#/widgets/new` · `#/widgets/:id` | Widget editor (create / edit) |
| `#/widgets/:id/stats` | Statistics |
| `#/reels` | Reels library |
| `#/settings` | Settings |

Guard navigation away from a dirty editor with a confirm — *"You have unsaved changes. Leave
this page without saving?"* — plus a `beforeunload` listener for tab close.

## Widgets list screen (§10.3)

- Header: title, search with clear (×), **Create Widget** primary button.
- Columns: **Name** (links to editor) · **Reels** · **Shortcode** (mono chip, copy-to-clipboard,
  toast *"Copied!"*) · **Views** · **Clicks** · **Created** · **Actions**.
- Row actions as icon buttons with tooltips: Edit · Statistics · Duplicate · Copy shortcode · Delete.
- Delete confirm names the widget and notes the reels are kept; loading state on confirm.
- Empty: illustration + *"You haven't created any widget yet!"* + CTA.
- Loading: **skeleton rows matching real row height** — never a centered spinner.

## Design tokens (§15)

Define once on `#wooreels-admin-app` and `.wooreels-embed`; never hardcode a color in a
component. Full token list in spec §15 — primary/fg/bg/border/ring/danger/success/warning,
`--wr-radius-*`, `--wr-shadow-*`, `--wr-font`, `--wr-ease`.

Aim for Linear / Vercel dashboard polish: calm, dense, confident, real hierarchy. Not a default
WP settings page, not generic AI Tailwind.

- Type scale 12/13/14/16/20/24/32, body 14, labels 13/500, section headings 13 uppercase
  `letter-spacing:.04em` in `--wr-fg-muted`.
- Spacing: 4px base — use 4/8/12/16/24/32/48 only.
- Motion 150–200ms for hovers, 240ms for panels, all inside `prefers-reduced-motion` guards.
- Focus: visible 2px `--wr-ring` outline, 2px offset, on every interactive element.
- Toasts bottom-right, auto-dismiss 4s, success/error/loading variants, stacked, pause on hover.
- **Never ship** a raw `<select>`, a browser `alert()`/`confirm()`, or a bare `<input type="color">`.

## Control primitives — build once, reuse everywhere

`ColorPicker` (swatch + popover + hex + alpha + recent swatches) · `ResponsiveSlider` (device
tabs + slider + numeric input + reset) · `IconToggleGroup` · `VisualOptionCards` (image/SVG
preview per option) · `Switch` with optional helper text · `CollapsibleSection` ·
`SearchInput` with clear button.

## Done when

All four menu items land on the right screen, the widgets list reads real data from
`GET /widgets`, shortcode copy works, delete works, and every primitive above is built and
demoed. Load the page and report what you checked.
