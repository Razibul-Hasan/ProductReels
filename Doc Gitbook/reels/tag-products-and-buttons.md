---
description: Make a reel shoppable with WooCommerce products or custom buttons.
---

# Tag products and add buttons

The **Shop this reel** section of the reel sheet turns a video into something a shopper can act on. You can use products, buttons, or both on the same reel.

## Tag products (WooCommerce)

1. In the reel sheet, under **Shop this reel**, click **Tag products**.
2. Search by **product name or SKU**.
3. Select one or more products. Out-of-stock products are labelled **Out of stock**.
4. Close the picker. The tagged products appear in the list and in the live preview.

In the player, each tagged product shows as a **product card** with its image, name and price, plus a rating and **Add to cart** button if the widget has them turned on.

{% hint style="info" %}
**"WooCommerce is turned off"?** Product tagging needs WooCommerce to be active. Click **Open Plugins** in the message to activate it, or use a button instead.
{% endhint %}

**Example:** a fashion store films a model wearing a full outfit. Tag the **Linen Shirt**, **Wide-leg Trousers** and **Canvas Tote**. Shoppers can add each piece to their cart from the video.

### Add to cart vs Direct Checkout

How the product card button behaves is a **widget** setting, so the same reel can act differently in different widgets. See [Product card](../widgets/look-player-product-card.md#product-card).

## Add a button

Buttons link a reel anywhere: a collection, a landing page, a booking form or another website.

1. Under **Shop this reel**, click **Add a button**.
2. Fill in the fields:

| Field | Description | Example |
| --- | --- | --- |
| **Button text** | What the button says | `Shop the look` |
| **Link** | Where it goes. Must start with `https://` | `https://lumaskin.com/collections/glow` |
| **Campaign** | Optional label, shown in [Statistics](../widgets/statistics.md) so you can compare buttons | `October sale` |
| **Open in a new tab** | Opens the link in a new browser tab | On, for external sites |
| **CSS class** | Optional class name for custom styling | `luma-cta-gold` |

3. Save the reel.

{% hint style="success" %}
**Tip: use Campaign to measure promotions.** Give every button in a sale the same campaign name, for example `Black Friday`. The Buttons table in Statistics then shows how many clicks that campaign earned.
{% endhint %}

## Products and buttons together

You can combine both. For example, a recipe video for a coffee roaster:

* **Tagged product:** *Ethiopia Yirgacheffe, 250 g* (shoppers can add it to their cart)
* **Button:** `Get the full brew guide` → `https://example-coffee.com/brew-guide`

## Without WooCommerce

On a WordPress site without WooCommerce, use buttons only. Common examples:

* A course creator links each reel to `Enroll now`.
* A restaurant links reels to `Book a table`.
* A travel blog links reels to the full article with `Read the guide`.
