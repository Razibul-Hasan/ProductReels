---
description: Show a widget or a single reel anywhere shortcodes work.
---

# Shortcodes

Shortcodes work in pages, posts, text widgets, most page builders and theme files.

## Widget shortcode

```
[productreels id="3"]
```

| Attribute | Required | Description |
| --- | --- | --- |
| `id` | Yes | The widget's ID. You'll find it in the Widgets table, the editor header and the **Place it** step. |
| `product` | No | A WooCommerce product ID. Only used by a widget set to **Current product's reels**: it shows that product's reels. See [below](#show-a-products-reels-anywhere). |

**Where to copy it:**

* **Widgets** screen → ⋯ menu → **Copy shortcode**
* Widget editor → header, or the **Place it** step

### Example: classic editor or text widget

```
Watch our customers' favourite routines:

[productreels id="3"]
```

### Show a product's reels anywhere

A widget set to **Current product's reels** (in its [Reels step](../widgets/widget-editor.md#reels-to-show)) picks up the product automatically on a product page. To use it somewhere else, such as a landing page or a blog post, name the product:

```
[productreels id="5" product="101"]
```

**Example:** a *"Summer hiking guide"* post shows the reels tagged with the **Trailhead 30L** (product 101) under the paragraph about day packs. When you tag a new video with the backpack, the post shows it too.

## Single-reel shortcode

Show **one reel on its own**, without a widget around it. This is useful inside blog posts and tutorials.

```
[productreels_reel id="7"]
```

| Attribute | Required | Description |
| --- | --- | --- |
| `id` | Yes | The reel's ID, from **ProductReels → Reels** |

**Example:** a blog post titled *"5 ways to style a linen shirt"* embeds a different reel under each tip:

```
## 1. Tucked with wide-leg trousers
[productreels_reel id="12"]

## 2. Open over a white tee
[productreels_reel id="13"]
```

## Using a shortcode in a theme template

For developers who want to add a widget to a template file, such as below the product summary in a child theme:

```php
<?php echo do_shortcode( '[productreels id="3"]' ); ?>
```

{% hint style="info" %}
**To show a widget on every WooCommerce product page**, you don't need code. Turn on **Show on product pages** in the widget's **Place it** step. See [Product pages](product-pages.md).
{% endhint %}

## What if the ID is wrong?

* **Visitors** see nothing. The page doesn't break.
* **Administrators** see a short note on the page, for example *"ProductReels: widget #99 was not found."*, so it's easy to spot and fix.

{% hint style="info" %}
**Performance:** ProductReels loads its scripts and styles only on pages that contain one of its shortcodes, blocks or Elementor widgets. Pages without reels load nothing extra.
{% endhint %}
