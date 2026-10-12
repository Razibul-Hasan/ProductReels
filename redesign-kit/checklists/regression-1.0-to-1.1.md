# Regression checklist: a site upgraded from 1.0.0 to 1.1.0

Set up the site on 1.0.0 with real-looking data first (part 15, step 6), then update to 1.1.0 and check each line.

## Data survives
- [ ] Every reel is listed with its title, cover, videos (upload, YouTube Shorts, Vimeo, link), tagged products and buttons.
- [ ] Every widget opens in the editor with its reels in the same order and every setting unchanged.
- [ ] Statistics totals and per-reel / per-button numbers equal the 1.0.0 numbers.
- [ ] Settings values (view limit, time window, public fetch, cache on/off, cache lifetime, delete on uninstall) are unchanged.

## Everything that displays reels
- [ ] `[productreels id="X"]` on a page renders the widget, in the new look, with the merchant's saved colours, sizes and radius.
- [ ] `[productreels_reel id="X"]` renders a single reel.
- [ ] Posts with the 1.0.0 block open in the block editor without a validation error and render.
- [ ] Elementor pages with the widget render in the editor and on the front end.
- [ ] All five layouts: Grid, Carousel (arrows), Marquee (moves, pauses on hover, static with reduced motion), Stacked, Popup (trigger, corner, close, remembered dismissal, mobile setting).
- [ ] Player: opens from a tile; swipe/keys/wheel/Back; sound; seek; volume; loop; product cards; Add to cart updates the mini-cart; Direct Checkout goes to checkout; Escape closes and returns focus.
- [ ] Hover preview and autoplay-when-visible behave as configured; lazy load still defers videos.

## Platform
- [ ] Public render endpoint: answers when "Allow public fetch" is on, refuses when off.
- [ ] View tracking: refreshes beyond the limit don't add views.
- [ ] Cache: editing a widget, reel or video shows immediately on the storefront.
- [ ] WooCommerce deactivated: no errors anywhere; product tagging shows the notice.
- [ ] Old admin bookmarks (All Widgets, All Reels, Create Widget, Settings) land in the right place.
- [ ] No PHP notices with `WP_DEBUG` on; no console errors.
- [ ] Deactivate and reactivate: nothing lost. Uninstall with "Delete all data" off: data stays.
