# Screens and flows

How the admin is organised, what lives on each screen, and the paths merchants take through it. The Screens group in Components shows each one.

## Map

```
ProductReels (WP admin menu)
├── Widgets            home: first-run guide, or totals + top reels + widgets table
│   ├── Create widget  dialog: name, layout, shape → opens the editor on Reels
│   ├── Widget editor  full-area studio: Reels · Layout · Look · Player · Product card · Advanced · Place it
│   └── Statistics     one widget: totals, reels ranked, buttons ranked
├── Reels              library: filter, search, bulk select
│   └── Add / edit reel   sheet: player preview + video, title, cover, what it sells
└── Settings           view tracking, public API, performance, data
```

The WP submenu and the app bar show the same three sections: Widgets, Reels, Settings.

## Where things moved

| Before | Now | Why |
| --- | --- | --- |
| Five icon buttons on every widget row | Edit button plus a `more` menu (Statistics, Duplicate, Copy shortcode, Delete) | One obvious action per row; the destructive one sits last behind a separator |
| Reel picker in a left column, attached reels under the preview | One Reels step: the widget's reels in page order, the library below | Picking and ordering happen in one place; the preview gets the full stage |
| Thumbnail / Player tabs with long accordions | Six steps on a rail: Reels, Layout, Look, Player, Product card, Advanced, then Place it | Each step fits one panel without scrolling past unrelated settings |
| Title appearance dialog in the header | The Title section of the Layout step | It's part of how the widget sits on the page |
| Create widget opens an untitled editor | Create widget asks for a name, layout and shape first | Merchants start from the result they picture |
| Add reel modal with cramped source cards | A sheet with the live player on the left | Merchants see the product card and buttons as shoppers will |
| "Capture frame" sub-dialog | A filmstrip in the Cover section | Choosing a cover is scrubbing, so it looks like scrubbing |
| "CTR" | "Click rate" | Plain words |
| Uppercase section labels (VIDEO, LINKS, LAYOUT) | Sentence-case titles | Easier to read, consistent with WordPress |

## Widgets (home)

- **First run** (no widgets with views yet): `StepGuide` replaces everything. Steps tick off from real data: a reel exists, a widget exists, the widget has views.
- **Otherwise**: `PageHeader` (search, Add reel, Create widget), `MetricBand` (Views, Clicks, Click rate, Reels in use), Top reels (six most viewed, each with views and click rate, linking to the reel), then `WidgetTable`.
- Each row: `ReelStack`, name (links to the editor), `LayoutBadge`, id, reel count, `ShortcodeChip`, views, clicks, click rate, created date, Edit and `more`.
- States: loading shows three skeleton rows; an error shows a danger `Notice` with "Try again"; a search with no match shows `EmptyState` naming the query with "Clear search".

## Create widget

1. "Create widget" opens a `Dialog` (wide): widget name, `TemplatePicker` as tiles, reel shape.
2. "Choose reels" opens the editor on the Reels step with that layout set.
3. After the first save, the header shows the shortcode and the toast offers "Place it", which opens that step.

## Widget editor

`StudioHeader` across the top: back to Widgets, the name (click to rename), "Unsaved changes" when dirty, the shortcode once saved, Discard, `more` (Duplicate, Delete widget) and **Save widget**. Clicking the active rail step again collapses the panel so the stage fills the width; clicking any step reopens it.

Every setting from the current plugin lives in exactly one step:

| Step | Settings |
| --- | --- |
| Reels | The widget's reels in page order (drag, or keyboard: Space, arrows, Space); preview and remove per reel; library search, Load more, Add reel |
| Layout | Template; shape (Rectangle, Circle); alignment; reel width; gap; space above and below. Carousel: arrows inside or outside. Marquee: speed, direction, pause on hover. Stacked: depth, offset, scale. Popup: trigger (on load, after a delay, after scrolling), corner, show on mobile, show again (next page, next visit, 1, 7 or 30 days). Title: position (left, centre, right, hidden), size, colour, space above and below |
| Look | Title over video, below, or hidden; overlay shade and opacity; title colour; preview before play (off, on hover, when visible); hover effect (zoom in, zoom out, lift); play button (on/off, size, colour and hover colour); view count (on/off, text and icon colour); border width, colour and radius; shadow; background; carousel arrow colours (normal and hover) |
| Player | Slide direction (horizontal, vertical feed); play with sound; loop; seek bar; volume control; navigation button colours |
| Product card | Style (Modern: compact row; Classic: image above); ratings; Add to cart with button text; Direct Checkout (turning one on turns the other off) |
| Advanced | Lazy load videos; CSS class |
| Place it | The widget shortcode with copy; how to add the ProductReels block; how to add the Elementor widget; the single-reel shortcode format |

- Settings that differ by device show a small device icon next to their section title; they edit whichever device the stage shows.
- Leaving with unsaved changes asks: "Leave without saving? Your changes to Homepage stories will be lost." with "Keep editing" and "Leave".

## Reels library

- `PageHeader` (search, Add reel), `FilterChips` (All, Tagged products, With a button, Not in a widget), grid or list toggle, then `ReelCard`s eight across.
- Clicking a card's title opens the reel sheet; the play button previews it in the player; `more` holds Preview, Edit and Delete.
- Selecting any card shows the bulk `FloatingBar` ("3 reels selected", Clear, Delete selected). Deleting confirms with the consequence: "They'll be removed from every widget they're in."
- Paging: "Load more" at the bottom, with "Showing 24 of 61".

## Add or edit a reel

A wide `Dialog`. Left: the reel in `ReelPlayer` on `studio`, updating live. Right, top to bottom:

1. **Video**: `SourcePicker` (Upload, YouTube Shorts, Vimeo, Video link), then `VideoList` with progress, reorder and remove.
2. **Title**.
3. **Cover**: `Filmstrip`, Upload image, Use first frame. Cross-site videos explain why frames can't be captured.
4. **Shop this reel**: `ShopLinks` opens `ProductPicker` (Tag products) or `LinkForm` (Add a button).

The footer note says what's missing ("Add a video and a product or button to save this reel.") instead of a silently disabled Save.

## Statistics

`PageHeader` with back, the widget's shortcode and Edit widget; `MetricBand` (Views, Clicks, Click rate); Reels table ranked by views with `BarCell`; Buttons table (text, campaign, link, clicks). Before any views: an `EmptyState` saying numbers appear once the widget is on a page and visitors watch.

## Settings

A section list on the left (View tracking, Public API, Performance, Data) and `SettingsCard`s on the right. Changes raise the save `FloatingBar` ("You have unsaved changes", Discard, Save settings). The Data card uses the danger tone and its toggle turns `danger` when on.

## Every list has four states

Empty (`EmptyState` with the first action), loading (skeleton rows or cards in `surface-sunken`), no results (`EmptyState` naming the query, "Clear search"), and error (danger `Notice` with what failed and "Try again").
