---
description: The handful of words you'll see throughout ProductReels.
---

# Key concepts

ProductReels uses a small set of terms. Once you know them, the rest of the plugin is easy to follow.

## Reel

A **reel** is a single vertical video plus what it sells. It holds:

* one or more video clips, which play in order
* a title
* a cover image
* tagged WooCommerce products and/or custom buttons

**Example:** *"Unboxing the Travel Kit"*, a 30-second video tagged with the Travel Kit product.

Reels live in your **Reels** library and don't appear on your site by themselves. You show them by adding them to a widget.

## Widget

A **widget** is a collection of reels plus all the settings for how they look and behave on a page. Each widget has its own shortcode, for example `[productreels id="3"]`.

**Example:** *"Homepage stories"*, a carousel of six reels with round thumbnails.

{% hint style="info" %}
**Reels and widgets are independent.** The same reel can appear in many widgets. Editing a reel updates it everywhere it's used. Deleting a widget never deletes its reels.
{% endhint %}

## Layout

The **layout** decides how a widget arranges its reels on the page: **Grid**, **Carousel**, **Marquee**, **Stacked cards** or **Floating popup**. See [Layouts](../widgets/layouts.md).

## Shape

Each widget shows its reels as **Rectangles** (classic 9:16 video tiles) or **Circles** (story-style bubbles, like social media stories).

## Look

The **Look** step controls how each reel thumbnail appears: title placement, overlay, hover effect, play button, view count, border and shadow.

## Player

The **player** is the full-screen view that opens when a shopper taps a reel. Shoppers can swipe, scroll or use the keyboard to move between reels. See [The shopper's experience](../configuration/shopper-experience.md).

## Product card

The **product card** shows a tagged product inside the player, with its image, price, rating and an **Add to cart** or **Direct Checkout** button.

## Tag products

**Tag products** connects WooCommerce products to a reel, so their product cards appear in the player.

## Button

A **button** is a custom call to action on a reel, for example *"Shop the look"* linking to a collection page. Buttons work with or without WooCommerce.

## Place it

**Place it** is the last step of the widget editor. It shows the widget's shortcode and how to add it with the block editor or Elementor. With WooCommerce, you can also turn on **Show on product pages** to add the widget to every product page. See [Product pages](../placing-widgets/product-pages.md).

## Current product's reels

A widget usually shows the reels you pick for it. Set its **Reels to show** to **Current product's reels**, and on a product page it shows the reels tagged with that product instead. One widget can then cover your whole catalogue.

## Views, clicks and click rate

* **Views:** how many times reels were watched (counted after about one second of playback).
* **Clicks:** how many times shoppers clicked a product card or button.
* **Click rate:** clicks divided by views. A click rate of 8% means 8 clicks for every 100 views.
* **Orders and revenue:** paid WooCommerce orders with a product added to the cart from a reel, and those products' order lines before tax.

## How it fits together

```
Reels library                Widget: "Homepage stories"         Your page
─────────────                ──────────────────────────         ─────────
Morning routine   ─┐         Layout: Carousel
Unboxing kit      ─┼──────▶  Shape: Circle             ──▶  [productreels id="3"]
Night cream demo  ─┘         Look, Player, Product card
```
