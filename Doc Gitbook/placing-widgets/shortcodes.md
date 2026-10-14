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

**Where to copy it:**

* **Widgets** screen → ⋯ menu → **Copy shortcode**
* Widget editor → header, or the **Place it** step

### Example: classic editor or text widget

```
Watch our customers' favourite routines:

[productreels id="3"]
```

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

To show a widget on every WooCommerce product page without editing templates, add this to your child theme's `functions.php` or a code snippets plugin:

```php
add_action( 'woocommerce_after_single_product_summary', function () {
	echo do_shortcode( '[productreels id="5"]' );
}, 15 );
```

## What if the ID is wrong?

* **Visitors** see nothing. The page doesn't break.
* **Administrators** see a short note on the page, for example *"ProductReels: widget #99 was not found."*, so it's easy to spot and fix.

{% hint style="info" %}
**Performance:** ProductReels loads its scripts and styles only on pages that contain one of its shortcodes, blocks or Elementor widgets. Pages without reels load nothing extra.
{% endhint %}
