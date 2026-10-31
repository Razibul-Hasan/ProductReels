---
description: What's new in each version of ProductReels.
---

# Changelog

## 1.1.2

A small admin update. Your reels, widgets, statistics and settings are kept, and nothing changes on your store.

### New

* **Hire an expert.** A link in the ProductReels bar, next to **Documentation**, for custom website work by the ProductReels team. It opens in a new tab.
* A Halloween notice on the **Widgets** screen, shown only to administrators until October 31, 2026. Close it with **×** and it won't come back for you.

## 1.1.1

Reels on every product page, sales tracked from reels, and date ranges in Statistics. Your reels, widgets, statistics and settings are kept.

### New

* **Show on product pages.** Add a widget to every WooCommerce product page from its **Place it** step, with no shortcode. Choose where: above the product, under Add to cart, above or below the tabs, or at the end of the page. See [Product pages](../placing-widgets/product-pages.md).
* **Current product's reels.** A widget can show the reels tagged with the product being viewed, so one widget covers the whole catalogue. The reels you pick show where a product has none.
* The `[productreels]` shortcode accepts `product="ID"` to show a product's reels on any page.
* **Sales from reels.** When a shopper adds a product to the cart from a reel and the order is paid, Statistics shows the **Orders** and **Revenue** for that reel and widget. Cancelled, refunded and failed orders are taken back out. See [How a sale is counted](../widgets/statistics.md#how-a-sale-is-counted).
* **Date ranges in Statistics.** All time, or the last 7, 30 or 90 days, with a day-by-day chart of views, clicks, orders or revenue.

### Fixed

* Views and clicks are now counted for reels a widget shows from the current product.

{% hint style="info" %}
**About the update:** 1.1.1 adds two database tables, for daily numbers and for sales from reels. Both start counting on the day you update, so day ranges and orders begin there. All-time views and clicks are unchanged.
{% endhint %}

## 1.1.0

A redesigned admin and a refreshed look on your store. Your reels, widgets, statistics and settings are kept.

### New

* Redesigned admin. Widgets, Reels and Settings are clearer, and every list has helpful empty, loading and error states.
* The widget editor is organised into steps (Reels, Layout, Look, Player, Product card, Advanced, Place it) beside a live preview for desktop, tablet and mobile.
* Create a widget by choosing its name, layout and reel shape first.
* Pick a reel's cover by scrubbing through its frames.
* Videos dropped on the reel sheet upload in place, with progress.
* Filter reels by tagged products, buttons, or reels not used in any widget, and delete several reels at once.
* Top reels and "Reels in use" on the Widgets screen.
* Search products by name or SKU when tagging a reel.
* The block shows the live widget in the block editor.

### Improved

* Refreshed reels, product cards and player on your store. Styles you've already saved keep their values. New widgets start from the refreshed defaults.
* Keyboard access, focus states, screen reader announcements, right-to-left layouts and reduced-motion support throughout.
* Clearer wording across the plugin, for example "Click rate" instead of "CTR".

### Fixed

* Translations of the full-screen player's labels now load.
* The Stacked layout fits narrow phone screens.

{% hint style="info" %}
**Where did things move in 1.1?**

| In 1.0 | In 1.1 |
| --- | --- |
| Five icon buttons on each widget row | **Edit** plus a ⋯ menu (Statistics, Duplicate, Copy shortcode, Delete) |
| Thumbnail / Player tabs | Steps on the editor rail |
| Title appearance dialog | **Layout** step → **Title** |
| "Capture frame" dialog | Filmstrip in the reel's **Cover** section |
| "CTR" | **Click rate** |
{% endhint %}

## 1.0.0

* Initial release.
