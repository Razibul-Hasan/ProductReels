---
description: Show a widget on every WooCommerce product page, with no shortcode.
---

# Product pages

You can put a widget on **every product page** of your store from the widget editor. You don't need a shortcode, a block or a template change. Pair it with **Current product's reels**, and one widget shows each product its own videos across your whole catalogue.

{% hint style="info" %}
These options appear only when WooCommerce is active.
{% endhint %}

## Show a widget on every product page

1. Open the widget in the editor and go to the **Place it** step.
2. Turn on **Show on product pages**.
3. Choose a **Position**:

| Position | Where it appears |
| --- | --- |
| **Above the product** | Above the product photos and summary |
| **Under Add to cart** | In the summary column, below the Add to cart button |
| **Below the product, above the tabs** | Full width, between the product and the Description/Reviews tabs (default) |
| **Below the tabs** | Full width, after the tabs and before related products |
| **At the end of the page** | After everything else on the product page |

4. Click **Save widget**. The position applies once the widget is saved.

{% hint style="success" %}
**Tip:** **Under Add to cart** sits in the narrow summary column, so the Carousel layout with small tiles suits it best. The full-width positions work with any layout.
{% endhint %}

## Show each product's own reels

By default, a widget shows the reels you pick for it, on every page where it's placed. To show the reels tagged with the product being viewed instead:

1. Go to the widget's **Reels** step.
2. Under **Reels to show**, choose **Current product's reels**.

Now each product page shows the reels that [tag that product](../reels/tag-products-and-buttons.md), newest first.

**The reels you pick are the fallback.** They show on products that have no reels tagged, and on pages that aren't product pages. If you pick no reels, the widget stays hidden where a product has none.

## Example: one widget for the whole catalogue

*Northwind Outdoors* has 60 products and short videos for about 20 of them.

1. They create one widget, **Product videos**, with the **Carousel** layout.
2. **Reels step:** they choose **Current product's reels**, and pick two brand videos (*"How we test our gear"*, *"Our repair promise"*) as the fallback.
3. **Place it step:** they turn on **Show on product pages**, with the position **Below the product, above the tabs**.

The **Trailhead 30L** page shows its packing and sizing videos. A product without videos shows the two brand videos. When they tag a new video with a product, it appears on that product's page straight away. There's nothing else to edit.

## Using it with themes and builders

* **Classic themes** that use WooCommerce's standard product template show the widget at the position you chose.
* **Block themes** work too, as long as the Single Product template keeps WooCommerce's standard product blocks. If you've rebuilt the template from scratch, add the [ProductReels block](block-editor.md) where you want it instead.
* **Page builders** that replace the product template (for example an Elementor Pro single product template) may skip WooCommerce's positions. Place the [Elementor widget](elementor.md) in the template instead. A widget set to **Current product's reels** still shows the right reels for each product.

## Current product's reels elsewhere

A widget set to **Current product's reels** knows which product to use:

* on a **product page**, wherever it's placed: shortcode, block, Elementor or **Show on product pages**;
* anywhere else, when the shortcode names the product: `[productreels id="5" product="101"]`. See [Shortcodes](shortcodes.md#show-a-products-reels-anywhere).
