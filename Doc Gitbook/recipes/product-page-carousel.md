---
description: Show product demos and customer videos on WooCommerce product pages.
---

# Product page carousel

**Scenario:** *Northwind Outdoors* sells hiking backpacks. Shoppers keep asking *"How big is it really?"* The store wants short videos of the **Trailhead 30L** backpack being packed and worn, right under the product photos.

**Time:** about 15 minutes. **You'll use:** the Carousel layout, with small tiles.

## 1. Create focused reels

Make three to five reels about **this product only**:

* `Packing the Trailhead 30L for a weekend`
* `Trailhead 30L on a 5'4" and a 6'1" hiker`
* `Rain cover in 10 seconds`

Tag **Trailhead 30L** on each one. On the packing video, also tag the **Dry Bag Set**. That's a natural upsell.

## 2. Create one widget for all product pages

1. **Create widget** → name it `Product videos`.
2. **Layout:** Carousel. **Shape:** Rectangle.
3. **Reels step:** under **Reels to show**, choose **Current product's reels**. Each product page will show the reels tagged with that product.
4. Still in the Reels step, pick one or two brand videos, such as *"How we test our packs"*. They show on products that don't have their own videos yet. If you'd rather show nothing there, leave the list empty.

**Layout step:** reel width **140** desktop / **120** mobile, alignment **Left**, so it lines up with the product description.

**Product card step:** **Add to cart**. The shopper is already on the product page, so let them add the upsell without leaving.

## 3. Show it on every product page

**Place it step:** turn on **Show on product pages** and choose **Below the product, above the tabs**. Click **Save widget**.

That's it. The Trailhead 30L page shows its three videos, the Summit 45L page shows its own, and every new video you tag with a product appears on that product's page. See [Product pages](../placing-widgets/product-pages.md) for all positions.

### Other ways to place it

{% tabs %}
{% tab title="Product description" %}
Edit the product and paste the shortcode at the end of the **Product description**:

```
[productreels id="8"]
```

Best when only a few products have videos, or when one product needs its own hand-picked widget.
{% endtab %}

{% tab title="Block theme template" %}
**Appearance → Editor → Templates → Single Product.** Add the **ProductReels** block where you want it, and choose the `Product videos` widget.

Use this when you want a spot that **Show on product pages** doesn't offer. The widget still shows each product's own reels.
{% endtab %}
{% endtabs %}

## Result

Under the product summary, shoppers see a short row of real-use videos. They can watch the backpack being packed, then add it or the dry bag set to their cart from the player.

Because the packing video also tags the **Dry Bag Set**, it shows on the dry bag's page too. A month later, the widget's [Statistics](../widgets/statistics.md) show which videos led to orders and how much revenue each one brought in.

{% hint style="success" %}
**Tip:** product pages are where buying decisions happen. Short, practical clips like sizing, fit, "how it works" and "what's in the box" usually beat polished brand ads here.
{% endhint %}
