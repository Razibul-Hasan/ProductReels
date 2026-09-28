# Changelog

All notable changes to ProductReels are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-09-11

### Added

- Reels: media library, Vimeo, YouTube Shorts and hosted MP4/WebM sources, multiple files per reel, poster capture from a video frame.
- Links: custom CTA buttons (text, URL, campaign, new tab, custom class) and WooCommerce product tags, several per reel.
- Widgets: named, styled, ordered collections of reels with a persistent drag-to-reorder order.
- Widget editor: reel picker, live preview through the shared render core, device toggle, and the full style panel (layout, thumbnail, player, product card, advanced).
- Templates: grid, carousel, marquee, stacked and popup.
- Player: fullscreen portal with swipe, keyboard, wheel and back-button navigation, seekbar and volume sliders, lazy provider SDKs, focus trap and scroll lock.
- Product cards in modern and classic styles; add to cart through the WooCommerce Store API with mini-cart refresh, or Direct Checkout — the same add, then straight to the checkout page — with its own button text. The two are exclusive: switching one on switches the other off.
- Placement: `[productreels id]` and `[productreels_reel id]` shortcodes, the `productreels/reels` block, and an Elementor widget.
- Analytics: per-widget views, clicks and CTR with per-reel and per-button tables; hashed-IP rate limiting; atomic click upserts.
- REST API under `productreels/v1` for widgets, reels, products, tracking, render and settings. Widget reads are open to anyone who can edit posts, so the block and the Elementor widget work for editors; writes need `manage_options`. Click tracking accepts only ids and records the button's own labels.
- Settings: view limit and interval, public fetch, render caching and TTL, delete data on uninstall.
- Render payload caching — one transient per widget, stamped with a site-wide generation so any edit invalidates every cached payload at once — and public cache headers while public fetch is on.
- Conditional asset loading: the public bundle is enqueued only on pages that print a widget, and the player is a separate chunk.
- Full RTL support, `prefers-reduced-motion` support, and translation-ready strings with a generated POT file.
- Widget editor conveniences: breadcrumb, discard unsaved changes, a header toggle that folds the style panel away on desktop, "Add Reel" inside the reel picker (the new reel joins the widget immediately), "Load more" in the picker, section icons, and Normal/Hover colour tabs for the carousel and player navigation buttons.
- All Widgets redesign: an app bar with the ProductReels brand, section tabs and a Documentation link on every list screen; an overview strip (widgets, views, clicks, CTR); rows with a fanned poster stack, template badge and id; a CTR column; sortable headers; an Add Reel action next to Create Widget; and a three-step first-run guide instead of an empty table.
- Widget title dialog: the title's position (or hidden), size, colour and spacing (the air above and below it, in pixels) are set from a small button inside the name field in the app bar, with a live preview of the name, instead of a section in the style panel.
- Popup template redesign: the bubble is a white card with a hairline edge and a layered soft shadow, slides in from the corner it is pinned to with a slight spring (and back out on close), pulses once after landing, lifts on hover, and carries a frosted close disc inside the card. The editor preview stands in for the page and shows the bubble in its actual corner, replaying the entrance when the corner changes.
- Storefront redesign: thumbnails carry a two-part shadow (contact line plus soft ambient) cut from the owner's shadow setting, an eased scrim instead of a straight ramp, a frosted play disc, glass or hairline product cards and a glass views badge; a widget's cards rise into place with a short stagger the first time it scrolls into view; carousel and marquee rails dissolve at the edge they can still travel to; nav buttons lean in under the pointer and give under a press. The player opens as one motion — the room dims, the stage lands, the chrome fades in, the product card rises — and fades out on close instead of cutting; the paused mark is a frosted disc, the buy button ticks when the product is added, and skeletons sweep instead of blink. The page holds still underneath: the scroll lock pads for the scrollbar it removes and keeps the admin bar's offset, so nothing shifts on open or close. A vertical player stacks its up and down buttons in one column at the stage's centre, on the end side. Everything respects `prefers-reduced-motion`.
- Reel editor redesign: a hero dropzone with the four sources as tiles, a live 9:16 preview of the lead video with a reorderable file list and provider badges, a portrait thumbnail card, two equal link actions (Add Custom Link / Tag Products) that open the right tab, and a selection count on the product picker.
- Reel editor: a reel needs at least one video and at least one link before it can be saved. The missing piece is named in the footer and Save stays disabled until it is added; the REST API refuses the same on create and update.
- Admin screens fill the window to the bottom edge: the room WordPress reserves for the footer line the plugin hides, and the top margin on `.wrap`, no longer show as a grey band under the app. Toasts appear at the bottom centre.
- Stacked template choreography: a step no longer swaps the deck in place. The cards that stay ease one place forward or back with a short ripple, the front card is thrown off to the side it was swiped towards (tilting as it goes) while a new one surfaces at the back, and going back returns the card from the same side while the last one sinks away. The front card follows the finger while held and eases home when let go short of a step; a throw starts from wherever it was released. The caption rises with whichever card takes the front, and the deck rises as one on first view instead of card by card. A drag no longer counts as a tap.
