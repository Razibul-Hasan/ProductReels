---
description: A small video that floats in the corner while shoppers browse.
---

# Floating popup reel

**Scenario:** *Brewline Coffee* is launching a new espresso machine. It wants a small video of the machine pulling a shot to float in the corner of every page during launch week, without annoying regular visitors.

**Time:** about 10 minutes. **You'll use:** the Popup layout.

## 1. Create the reel

* **Title:** `Meet the Brewline One`
* **Video:** a 15-second vertical clip of the machine in action
* **Shop this reel:** tag **Brewline One Espresso Machine**

## 2. Create the widget

1. **Create widget** → name it `Launch popup – Brewline One`.
2. **Layout:** Popup. **Reel shape:** Rectangle.
3. Add the reel.

**Layout step → Popup**

| Setting | Value | Why |
| --- | --- | --- |
| Trigger | **After scrolling** | Visitors see the page first and the popup appears once they're engaged |
| Corner | **Bottom right** | Out of the way of menus and headings |
| Show on mobile | **On** | Most visitors are on phones |
| Show again | **After 7 days** | A visitor who closes it won't see it again for a week |

Set the reel width to around **110** so it stays small.

**Look step:** preview before play **When visible**, so the popup plays silently and catches the eye.

**Product card step:** **Direct Checkout** with button text `Buy now`. For a one-product launch, fewer steps means more orders.

Save the widget.

## 3. Place it on every page

A popup floats in the corner wherever it's placed, so you only need to add it once to something that appears on every page.

{% tabs %}
{% tab title="Block theme" %}
**Appearance → Editor → Patterns → Footer** (or **Template Parts → Footer**). Insert the **ProductReels** block and choose the popup widget. Save.
{% endtab %}

{% tab title="Classic theme" %}
**Appearance → Widgets.** Add a **Shortcode** widget to the footer area with:

```
[productreels id="12"]
```
{% endtab %}

{% tab title="Code snippet" %}
```php
add_action( 'wp_footer', function () {
	echo do_shortcode( '[productreels id="12"]' );
}, 5 );
```
{% endtab %}
{% endtabs %}

## Result

After scrolling down a little, a small autoplaying video of the espresso machine appears in the bottom-right corner. Tapping it opens the player with the product card and a **Buy now** button. Closing it hides it for seven days.

## When the launch ends

Remove the block, shortcode widget or snippet. You can keep the widget for next time.

{% hint style="warning" %}
**Use one popup per page.** Two floating videos competing for attention feels like spam to shoppers.
{% endhint %}
