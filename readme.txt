=== ProductReels ===
Contributors: bestwpexpert,razibulhasan
Tags: woocommerce, video, reels, shoppable video, stories, ugc video reels
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Turn product videos and customer UGC into shoppable Instagram-style reels with a fullscreen player, product tagging and built-in analytics.

== Description ==

ProductReels lets a store owner group short vertical videos into reusable **widgets**, style every widget from a live visual editor, tag WooCommerce products or custom call-to-action buttons inside each reel, and place the widget anywhere with a shortcode, a block or an Elementor widget.

Visitors tap a thumbnail, a fullscreen swipeable player opens, and they can add to cart without leaving the page. Views and button clicks are tracked and reported per widget.

**Everything ships unlocked.** There is no free/pro split, no license key and no telemetry. The only third-party services involved are the video hosts you choose to embed — see *External services* below.

= Layouts =

* **Grid** — responsive columns that fit the container.
* **Carousel** — a snapping rail with previous/next buttons and drag to scroll.
* **Marquee** — an endless auto-scrolling rail that pauses on hover and respects reduced-motion settings.
* **Stacked** — a card deck; swipe or click through it.
* **Popup** — a floating bubble in a corner, shown on load, after a delay or after scrolling.

= The editor =

Three panes: a reel picker, a live preview that uses the very same components as the frontend, and a style panel with every control — shape, size and gap per device, borders, shadows, play icon, view badge, widget title, player behaviour, navigation colours, product card style and more. Drag to reorder reels, with full keyboard support.

= The player =

* Fullscreen portal with swipe (horizontal or vertical), keyboard, mouse-wheel and back-button navigation.
* Seekbar and volume control that are real, keyboard-operable sliders.
* Native MP4/WebM, Vimeo and YouTube Shorts — provider SDKs load only when a reel from that provider is opened.
* Custom CTA buttons and product cards (modern or classic) stacked at the bottom of the frame.
* Add to cart through the WooCommerce Store API, with the theme's mini-cart kept in sync.
* Focus is trapped while the player is open and returned to the thumbnail on close; the page behind it cannot scroll.

= Analytics =

Every widget reports total views, total clicks and CTR, with a per-reel table and a per-button table. Views are rate limited per visitor and per reel; visitor IP addresses are hashed with WordPress's own salts before use and are never stored.

= Performance =

* The public bundle is only loaded on pages that actually contain a widget.
* The player is a separate chunk, downloaded on first open.
* Widget payloads are cached and served with public cache headers; any edit invalidates them immediately.
* Videos are lazy-loaded as they enter the viewport.

= Works without WooCommerce =

Reels, widgets, custom links and analytics all work on a plain WordPress site. Product tagging and add to cart appear once WooCommerce is active.

= External services =

ProductReels sends nothing about your site or your visitors anywhere. It contacts a third party only when you choose to embed a video hosted there:

* **Vimeo** — when an administrator pastes a Vimeo link in the reel editor, the plugin asks Vimeo's public oEmbed endpoint (`https://vimeo.com/api/oembed.json`) for the video's poster image and duration. Only the pasted URL is sent. On the front end, opening a Vimeo reel loads Vimeo's Player SDK (`https://player.vimeo.com/api/player.js`) in the visitor's browser, with Do Not Track enabled. [Terms of service](https://vimeo.com/terms) · [Privacy policy](https://vimeo.com/privacy)
* **YouTube** — a YouTube reel's poster is the thumbnail YouTube publishes for that video (`https://img.youtube.com/vi/…`). Opening a YouTube reel loads the YouTube IFrame Player API (`https://www.youtube.com/iframe_api`) in the visitor's browser. [Terms of service](https://www.youtube.com/t/terms) · [Privacy policy](https://policies.google.com/privacy)

Neither SDK is loaded on a page until a visitor actually opens a reel from that provider. Reels from your media library or a self-hosted URL involve no third party at all. The `productreels_allow_provider_lookup` filter turns the Vimeo oEmbed lookup off entirely.

= Source code and build instructions =

The readable JavaScript, JSX and SCSS source is included in `admin/src`, `public/src`, `block/src` and `src/shared`. See `README.md` for the build commands and `THIRD-PARTY-NOTICES.txt` for bundled dependency licenses.

== Installation ==

1. Upload the `productreels` folder to `/wp-content/plugins/`, or install it from the Plugins screen.
2. Activate the plugin. The database tables are created on activation.
3. Go to **ProductReels → All Reels** and add your first reel from the media library, Vimeo, YouTube Shorts or a hosted MP4 URL.
4. Go to **ProductReels → Create Widget**, pick reels, style the widget and save.
5. Place it with `[productreels id="1"]`, the **ProductReels** block, or the **ProductReels** Elementor widget.

== Frequently Asked Questions ==

= Does deleting a widget delete its reels? =

No. Reels are reusable and live independently. Deleting a widget removes only that widget and its click statistics.

= Which video formats play everywhere? =

MP4 with H.264 video and AAC audio plays reliably in every browser, including Safari on iOS and macOS. The reel editor warns you when a selected file is a different format.

= How are views counted? =

A view is counted after about one second of actual playback, at most a configurable number of times per visitor per reel within a configurable interval (default: 2 views per minute). Bots are ignored.

= Is any personal data stored? =

No. The rate limiter keys on a salted hash of the visitor's IP address, which is kept only in a short-lived transient. Nothing about a visitor is written to the ProductReels tables. The browser remembers which reels it has already counted and which popups it has closed in its own session or local storage; nothing else is stored client-side.

= What happens on uninstall? =

By default, nothing is deleted. Turn on **Delete all plugin data on uninstall** under ProductReels → Settings to have the tables and options removed when the plugin is deleted.

= Does it work with Elementor? =

Yes. When Elementor is active a **ProductReels** widget appears under the General category of the Elementor panel.

== Screenshots ==

1. All Widgets — every widget with its shortcode, views and clicks.
2. The widget editor — reel picker, live preview and the style panel.
3. The reels library.
4. The fullscreen player with a product card.
5. Statistics for one widget.
6. Settings.

== Changelog ==

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
