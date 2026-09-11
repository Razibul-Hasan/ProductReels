=== WooReels — Shoppable Video Reels for WooCommerce ===
Contributors: razibulhasan
Donate link: https://bestwebexpert.com/
Tags: woocommerce, video, reels, shoppable video, stories
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Turn product videos and customer UGC into shoppable Instagram-style reels with a fullscreen player, product tagging and built-in analytics.

== Description ==

WooReels lets a store owner group short vertical videos into reusable **widgets**, style every widget from a live visual editor, tag WooCommerce products or custom call-to-action buttons inside each reel, and place the widget anywhere with a shortcode, a block or an Elementor widget.

Visitors tap a thumbnail, a fullscreen swipeable player opens, and they can add to cart without leaving the page. Views and button clicks are tracked and reported per widget.

**Everything ships unlocked.** There is no free/pro split, no license key, no telemetry and no external requests from your server.

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

== Installation ==

1. Upload the `wooreels` folder to `/wp-content/plugins/`, or install it from the Plugins screen.
2. Activate the plugin. The database tables are created on activation.
3. Go to **WooReels → All Reels** and add your first reel from the media library, Vimeo, YouTube Shorts or a hosted MP4 URL.
4. Go to **WooReels → Create Widget**, pick reels, style the widget and save.
5. Place it with `[wooreels id="1"]`, the **WooReels** block, or the **WooReels** Elementor widget.

== Frequently Asked Questions ==

= Does deleting a widget delete its reels? =

No. Reels are reusable and live independently. Deleting a widget removes only that widget and its click statistics.

= Which video formats play everywhere? =

MP4 with H.264 video and AAC audio plays reliably in every browser, including Safari on iOS and macOS. The reel editor warns you when a selected file is a different format.

= How are views counted? =

A view is counted after about one second of actual playback, at most a configurable number of times per visitor per reel within a configurable interval (default: 2 views per minute). Bots are ignored.

= Is any personal data stored? =

No. The rate limiter keys on a salted hash of the visitor's IP address, which is kept only in a short-lived transient. Nothing about a visitor is written to the WooReels tables.

= What happens on uninstall? =

By default, nothing is deleted. Turn on **Delete all plugin data on uninstall** under WooReels → Settings to have the tables and options removed when the plugin is deleted.

= Does it work with Elementor? =

Yes. When Elementor is active a **WooReels** widget appears under the General category of the Elementor panel.

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
