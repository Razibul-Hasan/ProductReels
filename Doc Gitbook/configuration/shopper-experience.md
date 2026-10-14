---
description: What your customers see and can do when they watch a reel.
---

# The shopper's experience

This page describes ProductReels from your customer's side. It's useful when you plan content or answer customer questions.

## On the page

Shoppers see your widget as tiles, circles, a scrolling rail, a stack of cards or a floating video, depending on the [layout](../widgets/layouts.md). Depending on your [Look settings](../widgets/look-player-product-card.md#look), a tile can show a silent preview, a play button, a title and a view count.

## In the full-screen player

Tapping a reel opens it full screen. From there a shopper can:

* **Move between reels** by swiping, scrolling the mouse wheel, using the arrow buttons or using the keyboard
* **Use the browser's Back button** to close the player and return to the same spot on the page
* **Seek and change volume**, if those controls are turned on
* **See product cards** for tagged products, with price and rating
* **Add to cart** without leaving the video, or **Buy now** to go straight to checkout
* **Tap buttons** you added, for example *"Shop the look"*

While the player is open, the page behind it doesn't scroll.

## Keyboard controls

| Key | Action |
| --- | --- |
| **Space** or **K** | Play / pause |
| **M** | Mute / unmute |
| **← →** | Previous / next reel (horizontal player) |
| **↑ ↓** | Previous / next reel (vertical player) |
| **Esc** | Close the player |
| **Tab** | Move between buttons. Focus stays inside the player while it's open. |

On right-to-left sites, the left and right arrows are swapped to match the reading direction.

## Accessibility

* Every control can be reached and used with a keyboard, with a visible focus ring.
* Icon-only buttons have labels for screen readers.
* When the player closes, focus returns to the reel the shopper opened.
* For visitors who prefer reduced motion, auto-scrolling and animations are toned down.
* Layouts work in right-to-left languages.

## The cart

With **Add to cart**, products are added through WooCommerce's own Store API. ProductReels keeps supported theme mini-carts in sync, so the cart count in your header updates straight away.

{% hint style="info" %}
**Simple products** are added straight from the player. **Variable products** (with options such as size or colour), **grouped products** and **external products** need their own page, so the button takes the shopper to the product page to finish.
{% endhint %}
