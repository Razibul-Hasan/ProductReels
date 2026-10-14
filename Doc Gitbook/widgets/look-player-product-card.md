---
description: Style the thumbnails, the full-screen player and the product cards.
---

# Look, player and product card

These steps control everything shoppers see, from the thumbnail on the page to the product card inside the player.

## Look

The **Look** step styles each reel thumbnail on the page.

| Section | Settings |
| --- | --- |
| **Title** | Show the reel title **over the video**, **below** it, or **hidden**. Set the title colour. |
| **Overlay** | A shade over the thumbnail so white text stays readable. Set the shade colour and opacity. |
| **Preview before play** | **Off** (still cover), **On hover** (plays silently when the pointer is over it), or **When visible** (plays silently as it scrolls into view) |
| **Hover effect** | None, Zoom in, Zoom out or Lift |
| **Play button** | On or off, size, colour and hover colour |
| **View count** | On or off, text and icon colour, background |
| **Border and shadow** | Border width, border colour, corner radius, shadow and background |
| **Carousel arrows** | Background and icon colours, normal and on hover, plus corner radius |

{% hint style="success" %}
**Recipe for a premium look:** title **below**, preview **On hover**, hover effect **Lift**, no border, corner radius 16, shadow on. Simple and clean, and the video does the selling.
{% endhint %}

{% hint style="info" %}
**On a busy page?** Use **On hover** rather than **When visible**. Fewer videos play at once, which keeps the page calm and light.
{% endhint %}

## Player

The **Player** step controls the full-screen view that opens when a shopper taps a reel.

| Setting | Description |
| --- | --- |
| **Slide direction** | **Horizontal** (swipe left and right) or **Vertical** (swipe up and down, like a social media feed) |
| **Play with sound** | Start reels with sound on. Browsers may still start muted until the shopper interacts. |
| **Loop** | Replay the reel when it ends |
| **Seek bar** | Show a progress bar the shopper can drag |
| **Volume control** | Show a volume slider |
| **Over the video** | What sits on top of the video: **Products**, **Title only** or **Nothing** |
| **Navigation buttons** | Background and icon colours, normal and on hover, plus corner radius |

**Example:** a beauty brand targeting mobile shoppers picks **Vertical** slide direction, so the player feels like the social apps their customers already use.

## Product card

The **Product card** step controls how tagged WooCommerce products appear in the player.

| Setting | Description |
| --- | --- |
| **Style** | **Modern** (a compact row) or **Classic** (image above the details) |
| **Show ratings** | Show the product's star rating |
| **Buy button** | **Add to cart** (adds the product and keeps the shopper watching) or **Direct Checkout** (adds the product and goes straight to checkout) |
| **Button text** | Your own wording, for example `Add to bag` |
| **Button look** | Show the button as an **Icon** or as **Text** |

Turning on Add to cart turns off Direct Checkout, and the other way round. Only one can be active.

{% tabs %}
{% tab title="Add to cart" %}
**Use when:** shoppers often buy more than one item.

**Example:** a skincare store with routines of three or four products. Shoppers add the cleanser, serum and moisturiser while watching, then check out once. Your theme's mini-cart updates as they go.
{% endtab %}

{% tab title="Direct Checkout" %}
**Use when:** you sell one hero product or run a flash sale.

**Example:** a gadget store launching one new product. The fewer steps between the video and the order, the better.
{% endtab %}
{% endtabs %}

## Advanced

| Setting | Description |
| --- | --- |
| **Lazy load videos** | Load each video only when it's about to come into view. Keep this **on** unless the widget is at the very top of the page. |
| **CSS class** | Adds your own class to the widget, for custom styling. See [Styling with custom CSS](../developers/custom-css.md). |
