# Changelog

All notable changes to WooReels are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-09-11

### Added

- Reels: media library, Vimeo, YouTube Shorts and hosted MP4/WebM sources, multiple files per reel, poster capture from a video frame.
- Links: custom CTA buttons (text, URL, campaign, new tab, custom class) and WooCommerce product tags, several per reel.
- Widgets: named, styled, ordered collections of reels with a persistent drag-to-reorder order.
- Widget editor: reel picker, live preview through the shared render core, device toggle, and the full style panel (layout, thumbnail, player, product card, widget title, advanced).
- Templates: grid, carousel, marquee, stacked and popup.
- Player: fullscreen portal with swipe, keyboard, wheel and back-button navigation, seekbar and volume sliders, lazy provider SDKs, focus trap and scroll lock.
- Product cards in modern and classic styles; add to cart through the WooCommerce Store API with mini-cart refresh.
- Placement: `[wooreels id]` and `[wooreels_reel id]` shortcodes, the `wooreels/reels` block, and an Elementor widget.
- Analytics: per-widget views, clicks and CTR with per-reel and per-button tables; hashed-IP rate limiting; atomic click upserts.
- REST API under `wooreels/v1` for widgets, reels, files, products, tracking, render and settings.
- Settings: view limit and interval, public fetch, render caching and TTL, delete data on uninstall.
- Render payload caching with generation-based invalidation and public cache headers.
- Conditional asset loading: the public bundle is enqueued only on pages that print a widget, and the player is a separate chunk.
- Full RTL support, `prefers-reduced-motion` support, and translation-ready strings with a generated POT file.
