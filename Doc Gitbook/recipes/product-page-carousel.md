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

## 2. Create a widget for the product

1. **Create widget** → name it `Product – Trailhead 30L`.
2. **Layout:** Carousel. **Shape:** Rectangle.
3. Add the reels.

**Layout step:** reel width **140** desktop / **120** mobile, alignment **Left**, so it lines up with the product description.

**Product card step:** **Add to cart**. The shopper is already on the product page, so let them add the upsell without leaving.

Save the widget.

## 3. Add it to the product page

Choose the method that matches your setup:

{% tabs %}
{% tab title="Product description" %}
Edit the product and paste the shortcode at the end of the **Product description**:

```
[productreels id="8"]
```

Best when only a few products have videos.
{% endtab %}

{% tab title="Block theme template" %}
**Appearance → Editor → Templates → Single Product.** Add the **ProductReels** block where you want it.

Note that this shows the **same** widget on every product. Use it for brand-wide videos, such as *"How we make our bags"*.
{% endtab %}

{% tab title="Code snippet" %}
Show a widget only on specific products, by product ID:

```php
add_action( 'woocommerce_after_single_product_summary', function () {
	$map = array(
		101 => 8,  // Trailhead 30L   → widget 8
		102 => 9,  // Summit 45L      → widget 9
	);

	$product_id = get_the_ID();

	if ( isset( $map[ $product_id ] ) ) {
		echo do_shortcode( sprintf( '[productreels id="%d"]', $map[ $product_id ] ) );
	}
}, 15 );
```
{% endtab %}
{% endtabs %}

## Result

Under the product summary, shoppers see a short row of real-use videos. They can watch the backpack being packed, then add it or the dry bag set to their cart from the player.

{% hint style="success" %}
**Tip:** product pages are where buying decisions happen. Short, practical clips like sizing, fit, "how it works" and "what's in the box" usually beat polished brand ads here.
{% endhint %}
