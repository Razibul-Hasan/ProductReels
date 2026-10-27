---
description: Answers to the questions store owners ask most.
---

# FAQ

## General

<details>

<summary>Is ProductReels really free?</summary>

Yes. Every feature is free. There's no Pro version, no licence key and no locked features.

</details>

<details>

<summary>Do I need WooCommerce?</summary>

No. Without WooCommerce you can still create reels and widgets, add custom buttons and see statistics. Product tagging and Add to cart need WooCommerce.

</details>

<details>

<summary>What's the difference between a reel and a widget?</summary>

A **reel** is one video and what it sells. A **widget** is a group of reels with a layout and style, placed on a page. One reel can be used in many widgets. See [Key concepts](../getting-started/key-concepts.md).

</details>

<details>

<summary>How many reels can a widget have?</summary>

There's no fixed limit. For carousels, 4–12 reels usually work best. For grids on landing pages, more is fine because videos are lazy-loaded.

</details>

## Videos

<details>

<summary>Which video sources are supported?</summary>

* WordPress Media Library uploads
* Direct MP4 and WebM links
* YouTube Shorts
* Vimeo

</details>

<details>

<summary>Can I use TikTok or Instagram videos?</summary>

There's no direct TikTok or Instagram import. If you own the original video, download it and upload the MP4 to your Media Library. This is also faster and more private for your visitors.

</details>

<details>

<summary>What video format and size should I use?</summary>

**MP4 with H.264 video and AAC audio**, vertical **9:16** (for example 1080 × 1920), 15–60 seconds long. Compress large files before uploading.

</details>

<details>

<summary>Can one reel contain several clips?</summary>

Yes. Add several videos in the reel sheet and arrange them with **Move up** and **Move down**. They play in order.

</details>

## Shopping

<details>

<summary>Can shoppers buy without leaving the video?</summary>

Yes, for simple products. With **Add to cart** turned on in the widget's Product card step, the product is added while the video keeps playing. With **Direct Checkout**, the shopper goes straight to checkout.

</details>

<details>

<summary>Can I link a reel to a page that isn't a product?</summary>

Yes. Use **Add a button** in the reel sheet and enter any link, such as a collection, blog post, booking page or external site.

</details>

<details>

<summary>Can I see how much my reels sell?</summary>

Yes. With WooCommerce, a widget's **Statistics** show **Orders** and **Revenue** for each reel: paid orders with a product added to the cart from that reel. See [How a sale is counted](../widgets/statistics.md#how-a-sale-is-counted).

</details>

## Placement

<details>

<summary>Can I show different reels on different product pages?</summary>

Yes, with a single widget. Set its **Reels to show** to **Current product's reels** and turn on **Show on product pages**. Each product page then shows the reels tagged with that product. See [Product pages](../placing-widgets/product-pages.md) and the [Product page carousel](../recipes/product-page-carousel.md) recipe.

You can still create one widget per product and paste its shortcode into that product's description, if you'd rather hand-pick each one.

</details>

<details>

<summary>Can I add reels to product pages without a shortcode?</summary>

Yes. In the widget's **Place it** step, turn on **Show on product pages** and choose where it goes: above the product, under Add to cart, above or below the tabs, or at the end of the page.

</details>

<details>

<summary>Does it work with my page builder?</summary>

There's a native **block** for the WordPress editor and a native **Elementor** widget. For other builders, use the shortcode in a text or shortcode element.

</details>

## Data and privacy

<details>

<summary>Does ProductReels store personal data?</summary>

No IP addresses are stored. A salted hash of the IP is kept temporarily for view rate limiting, and the visitor's browser remembers counted reels and closed popups. Sales tracking stores only which reel an order line came from, alongside the order WooCommerce already keeps. See [Privacy and performance](../configuration/privacy-and-performance.md).

</details>

<details>

<summary>Will I lose my reels if I deactivate or delete the plugin?</summary>

Deactivating never removes anything. Deleting keeps your data too, unless you turned on **Delete all data on uninstall** in Settings.

</details>

<details>

<summary>Will updating from 1.0 to 1.1 change my widgets?</summary>

No. Your reels, widgets, statistics and settings are kept, and existing shortcodes, blocks and Elementor widgets keep working. Styles you already saved keep their values. Only new widgets start from the refreshed defaults.

</details>

<details>

<summary>What changes when I update to 1.1.1?</summary>

Nothing you've set up changes. Existing widgets keep showing the reels you picked and don't appear on product pages until you turn that on. The update adds two database tables, for daily numbers and sales from reels, and starts counting both from the day you update.

</details>
