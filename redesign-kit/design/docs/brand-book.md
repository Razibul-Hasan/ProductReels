# Brand book

> In code, every token below is a CSS custom property named `--pr-<name>` (for example `brand` is `var(--pr-brand)`), and every type style is a class named `.pr-t-<name>` (for example `.pr-t-body-strong`). See `design/css/pr-tokens.css`.

ProductReels turns short vertical product videos into shoppable reels on a WooCommerce store. Merchants add **reels**, group them into styled **widgets**, and place widgets on pages. This system covers both sides: the admin inside WP Admin (`pr-*` classes) and what shoppers see on the storefront (`prs-*` classes).

The admin is calm and light so the merchant's own videos are the colour on screen. Three things make it ProductReels and not any other plugin: Archivo Expanded for titles and numbers, the dark **studio** stage where widgets are previewed, and the 9:16 reel shape used everywhere a video appears.

## Voice and copy

Write to the merchant as "you", in plain words, in sentence case. No exclamation marks, no emoji, no hype.

- **Buttons are a verb plus the thing.** "Create widget", "Add reel", "Save settings", "Delete widget". The toast repeats the same words: "Widget saved", "3 reels deleted".
- **Name things by what the merchant manages**, never by how it's built. "Allow public fetch" stays because merchants recognise it from integrations, but its description says what it exposes in everyday terms.
- **One word per concept, everywhere.** Use these and nothing else:

| Say | Not | Means |
| --- | --- | --- |
| Reel | Video, clip, story | One vertical video, its title, cover, and what it sells |
| Widget | Gallery, feed, collection | A styled set of reels placed on a page |
| Layout | Template, type | Grid, Carousel, Marquee, Stacked or Popup |
| Look | Thumbnail settings, customize | How reels appear before they're played |
| Player | Lightbox, modal | What opens when a shopper taps a reel |
| Tag products | Attach, link products | Connect WooCommerce products to a reel |
| Place it | Embed, publish, deploy | Put a widget on a page (shortcode, block or Elementor) |
| Click rate | CTR | Clicks per view, as a percentage |

- **Descriptions explain why, in one line.** "Groups this button's clicks in statistics." Not "Enter campaign name here."
- **Empty screens invite the next action.** "A reel is one vertical video and the products you sell from it." followed by an "Add reel" button.
- **Errors say what happened and how to fix it**, without apologising: "Line 2 is not a YouTube Shorts link. Links look like youtube.com/shorts/abc123."
- **Destructive confirmations name the object and state the consequence**: "Delete “Homepage stories”?" then "Pages that use its shortcode or block will show nothing. Its reels stay in your library." Never "Are you sure?".
- Never set labels in all caps. Section titles are `heading` or `title` in sentence case.
- Numbers use thousands separators and tabular figures (`12,480`, `8.3%`). Missing rates show "—".

## Colour

Light admin, one dark stage. Every pair below is at least 4.5:1 for text and 3:1 for control edges and icons.

- **Grounds.** Pages sit on `canvas`. Panels, tables, cards, dialogs and inputs are `surface`. Wells (segmented tracks, shortcode chips, count pills) are `surface-sunken`. Row hover is `surface-hover`.
- **Text.** `ink` for anything read or operated; `ink-muted` for descriptions, help, metadata and table headers. `ink-disabled` is only for disabled controls.
- **Edges.** `line` for panel and row hairlines. `line-strong` for every input, checkbox, secondary button and off toggle; never put those on `surface-sunken`.
- **Brand.** `brand` marks what's primary or selected: the one primary button per view, the selected layout, the active editor step (`brand-soft` ground with `brand-strong` text), links, chart bars and the focus ring. Text on a brand fill is `on-brand`.
- **Ink fills.** The active nav pill, the bulk-action bar, the save bar and toasts are `ink` with `on-ink` text. They read as "the app is talking".
- **Spark.** `spark` is the live accent: view counts, the unsaved-changes badge (`spark` on `spark-soft`), sale prices on storefront cards. Use it once per screen and never on a button, where it would read as destructive. On dark grounds use `spark-bright`.
- **Studio.** The widget editor's preview stage and the shopper's player sit on `studio`. Toolbars on it are `studio-raised`; their text is `on-studio` and `on-studio-muted`; control edges are `studio-line-strong`; focus is `focus-studio` (as `focus-ring-studio`). Nothing else in the admin is dark.
- **Status.** `ok`, `warn` and `danger` each have a `-soft` ground. Status is never colour alone: pair it with an icon and a word ("Out of stock", "Done").
- **Over video.** `reel-scrim` (bottom gradient), `reel-badge` (view count and player buttons), `on-reel` (text over video) and `reel-glass` (product cards) keep storefront overlays legible on any frame.
- **Dialogs** dim the page with `scrim`.

## Type

Two cuts of one family, Archivo, shipped as files (`fonts/`).

- **Display** (Archivo Expanded): `display-xl` for the single headline on a first-run screen, `display` for page titles, `metric` for totals, `display-sm` for the wordmark and the widget name in the editor. Never for body copy or anything under 17px.
- **Text** (Archivo): `title` for panel, dialog and section titles; `heading` for setting names and list-row titles; `body` for copy and table cells; `body-strong` for button labels, nav items and table name cells; `label` for form labels, table headers and segmented items; `small` for help text and metadata; `caption` for badges and timestamps.
- **Code** (system monospace): `code` for shortcodes and REST paths only.
- Keep lines under 80 characters: descriptions cap at 640px.

## Space, radius, elevation

- 4px base. Page gutters `space-8`; gaps between page sections `space-6`; editor panel padding `space-5`; card and row padding `space-4`; label-to-field `space-3`.
- Radius follows size. `radius-xs` badges, checkboxes and product thumbs; `radius-sm` buttons and inputs; `radius-md` panels, tables and notices; `radius-lg` dialogs and the device frame; `radius-pill` toggles, nav pills and chips. Every 9:16 reel uses `radius-reel`, so a video always reads as a video.
- Resting surfaces get a `line` edge, not a shadow. `shadow-sm` lifts the active segment and toggle thumb; `shadow-md` is for menus, toasts and floating bars; `shadow-lg` for dialogs; `shadow-reel` for storefront reels and the device frame.
- Fixed sizes: controls `control-sm` 32, `control` 40, `control-lg` 48 (editor Save and first-run actions only); `appbar-height`, `rail-width`, `panel-width`, `content-max`.

## Layout

- List and settings pages: `AppHeader`, then a `PageHeader` (title, count, one-line description, actions with the primary rightmost), then content, max `content-max` wide.
- The widget editor takes the whole content area: `StudioHeader` across the top, then `StudioRail`, the settings `StudioPanel`, and the `Stage`. Settings on the left, preview on the right, as in the WordPress and Elementor editors merchants already know.
- Dialogs centre over a `scrim`. Floating bars sit bottom-centre, `space-6` above the edge.

## States and motion

- Hover: `surface-hover` or `surface-sunken` fills; secondary edges darken to `ink-muted`.
- Selected: `brand` edge plus `brand-soft` fill and a check.
- Focus: `focus-ring` on every interactive element (a 2px surface gap and 2px of `brand`); `focus-ring-studio` on dark grounds. Never remove it.
- Disabled: 45% opacity and no pointer.
- Motion answers an action: toggles slide, menus and dialogs fade in, a dragged reel row lifts. The only motion nobody triggered is the storefront marquee and the "live" dot. Everything stops under `prefers-reduced-motion`.

## Imagery

Reels are the imagery. The admin never uses stock photos, illustrations of people, or decorative gradients. Empty states use outlined 9:16 shapes. `PosterArt` provides placeholder product stills for mockups and is never shipped.

## Iconography

Lucide outline icons at 1.75 stroke on a 24px grid, in `currentColor` (the `Icon` component holds the set). Sizes: 16 in badges, nav and dense rows; 18 in buttons, fields and menus; 20 in the editor rail and icon-only toolbar buttons. Only `play` and `star` are filled. No emoji, no second icon set.

## Logo

No logo files are in this system yet, so the wordmark is "ProductReels" set in `display-sm` in `ink`. Add the plugin icon to an asset group before using a mark anywhere.
