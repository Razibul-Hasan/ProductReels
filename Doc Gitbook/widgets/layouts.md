---
description: Grid, Carousel, Marquee, Stacked and Popup, and when to use each.
---

# Layouts

The **Layout** step decides how a widget arranges its reels on the page. Every layout works with both the **Rectangle** and **Circle** shapes.

## Settings shared by every layout

| Setting | Description |
| --- | --- |
| **Shape** | Rectangle (9:16 tiles) or Circle (story bubbles) |
| **Alignment** | Left, Center or Right |
| **Reel width** | Width of each reel in pixels. Can differ per device. |
| **Gap** | Space between reels. Can differ per device. |
| **Space above and below** | Padding around the whole widget. The same on every device. |

**Default sizes for new widgets:** reel width 180 px on desktop, 150 px on tablet and 140 px on mobile, with a 16 px gap.

### Widget title

The **Title** section can show the widget's name as a heading above the reels. It's **Hidden** by default. Choose a position to show it.

| Setting | Options |
| --- | --- |
| **Position** | Left, Center, Right or Hidden |
| **Size** | Font size of the heading |
| **Colour** | Heading colour |
| **Space above / Space below** | Space around the heading |

**Example:** for a section titled *"Watch & Shop"*, name the widget `Watch & Shop`, set the title position to **Center**, and match the colour to your theme's headings.

---

## Grid

Reels in responsive columns that wrap onto new rows and adapt to the space available.

**Best for:** landing pages, "As seen on customers" pages, video galleries.

**Example:** a fitness brand builds a *"#LumaMoves community"* page with 24 customer workout videos in a grid.

---

## Carousel

A horizontal row of reels that shoppers scroll through. It has arrow buttons, drag-to-scroll and snapping.

**Best for:** homepage sections, product pages, category stories.

| Setting | Options |
| --- | --- |
| **Carousel arrows** | **Inside** the row (over the reels) or **Outside** it (beside the row) |

Arrow colours are set in the [Look step](look-player-product-card.md#look).

**Example:** a jewellery store adds a carousel of styling videos under the hero banner. Shoppers swipe on mobile and click the arrows on desktop.

---

## Marquee

A rail of reels that scrolls by itself, in a continuous loop.

**Best for:** promotional strips, new-arrival highlights, brand storytelling.

| Setting | Description |
| --- | --- |
| **Speed** | How fast the rail moves |
| **Direction** | Left or Right |
| **Pause on hover** | Stops the rail when the pointer is over it, so shoppers can click |

{% hint style="info" %}
For visitors who have asked their device to reduce motion, the marquee doesn't scroll by itself.
{% endhint %}

**Example:** a sneaker store runs a marquee of *"New drops this week"* across the top of its shop page.

---

## Stacked

Reels shown as a deck of cards, one on top of the other, that visitors browse through.

**Best for:** compact spaces, sidebars, a playful "flip through" feel.

| Setting | Description |
| --- | --- |
| **Depth** | How many cards are visible behind the front card |
| **Offset** | How far each card behind is shifted |
| **Scale** | How much smaller each card behind is |

**Example:** a candle shop puts a stack of three scent-of-the-month videos beside its newsletter sign-up.

---

## Popup

A small floating reel in a corner of the screen that stays visible while the visitor browses.

**Best for:** product pages, limited-time offers, a "watch it in action" prompt.

| Setting | Options |
| --- | --- |
| **Trigger** | **On page load**, **After a delay** (set the delay) or **After scrolling** (set the scroll distance) |
| **Corner** | Top left, Top right, Bottom left or Bottom right |
| **Show on mobile** | Turn off to show the popup on larger screens only |
| **Show again** | After a visitor closes it, show it again on the **Next page**, **Next visit**, or **After 1 day**, **After 7 days** or **After 30 days** |

{% hint style="success" %}
**Tip:** for product pages, use **After scrolling** so the popup appears once the shopper has looked at the product photos, and **After 1 day** for *Show again* so returning visitors aren't interrupted on every page.
{% endhint %}

See the full setup in [Floating popup reel](../recipes/floating-popup.md).
