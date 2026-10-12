# Part 12 — Storefront refresh

**Depends on:** 01 (tokens, `prs` roots). Best after 09 so the editor preview shows the result. **Changes code:** yes (storefront components and CSS).

## Goal

Bring what shoppers see up to the design (tiles, product cards, the five layouts and the player) without changing any widget's saved settings, and while still fitting any theme.

## Look at

- `design/screens/ScreenStorefront.png`, `ScreenLayouts.png`, `ScreenPlayer.png`
- `design/components/ReelTile.png`, `ProductCard.png`, `ReelsWidget.png`, `ReelPlayer.png`, `PlayerTheater.png`
- `design/reference/components.jsx` → `ReelTile`, `ProductCard`, `Price`, `Stars`, `ReelsWidget`, `ReelPlayer`, `PlayerTheater`
- `design/css/prs-storefront.css`
- `design/docs/storefront.md`
- AUDIT.md section 8

## Do

1. **Markup and classes**: port the `prs-*` structure into the storefront components (whatever renders them today: React, server HTML, or both). Keep the outer wrapper and any data attributes other code relies on.
2. **Merchant settings win.** Map each style setting to a custom property on the widget root (`--prs-tile-w`, `--prs-gap`, `--prs-ring`, `--pr-radius-reel`, `--pr-reel-scrim`, and so on) or to the class that implements it. A stored value always overrides the design default. Never write to stored settings.
3. **Tile**: rect 9:16 or circle with ring; overlay title on `--pr-reel-scrim`, title below, or none; view count pill; play button; tagged product shows a ProductCard (no add button on the tile); the three hover effects; the whole tile is one button that opens the player.
4. **Product card**: Modern and Classic; regular price struck in `--pr-ink-muted` and sale price in `--pr-spark`; under 160px wide show only the sale price (container query); ratings; Add to cart (keep 1.0.0's mini-cart sync) or Direct Checkout.
5. **Layouts**: Grid; Carousel with scroll snap, arrows outside or inside, arrows hidden when every reel fits; Marquee (pauses on hover, static under `prefers-reduced-motion`, duplicated items `aria-hidden` and not focusable); Stacked (only the front reel shows badges and card); Popup (corner, trigger, close button labelled "Close", remembered dismissal exactly as 1.0.0 stores it).
6. **Player**: mobile fullscreen and desktop theatre (current reel centred on `--pr-studio`, neighbours dimmed); top: views, sound, close; bottom on scrim: title, CTA pills, product cards, seek bar, time. Keep every 1.0.0 behaviour: swipe direction setting, keyboard, wheel, Back button, focus trap, scroll lock, YouTube/Vimeo/MP4/WebM playback.
7. **Theme fit**: storefront text inherits the theme font (never load Archivo here). Check in Twenty Twenty-Five, Astra and one WooCommerce-focused theme (the user's test site uses Botiga), in light pages and on a dark section.
8. **Weight**: no new JS libraries; storefront CSS stays roughly the 1.0.0 size or smaller (report both); assets load only on pages with a widget.
9. **No credits**: nothing like "Powered by ProductReels" anywhere a shopper can see.

## Don't

- Migrate or rewrite saved widget settings.
- Add requests to any external service.

## Done when

- [ ] Fresh widgets match `ScreenStorefront.png`, `ScreenLayouts.png` and `ScreenPlayer.png`.
- [ ] A widget created in 1.0.0 with custom colours, radius and sizes keeps those values in 1.1.0 (compare before/after screenshots and list any intended differences in PROGRESS.md).
- [ ] Keyboard: tab to a tile, Enter opens the player, arrows move, Escape closes and focus returns to the tile.
- [ ] RTL and reduced motion behave.
- [ ] Shortcode, block and Elementor output all get the new look.

## Hand-off

Commit `1.1.0 part 12: storefront refresh`. Ask the user to check one real product page on their test store.
