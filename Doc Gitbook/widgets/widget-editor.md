---
description: A tour of the visual editor and its seven steps.
---

# The widget editor

The widget editor is where you build and style a widget. It has three areas:

* **Header** (top): back to Widgets, the widget name, the shortcode once saved, **Discard**, a **more** menu and **Save widget**.
* **Step rail and panel** (left): the settings, grouped into seven steps.
* **Stage** (right): a live preview of the widget on a dark background, with a device switcher for **desktop**, **tablet** and **mobile**.

The preview uses the same code as your live store, so what you see is what shoppers get.

## The seven steps

| Step | What you set there |
| --- | --- |
| [**Reels**](#reels) | Which reels are in the widget, and their order |
| [**Layout**](layouts.md) | Layout type, shape, size, spacing, alignment and widget title |
| [**Look**](look-player-product-card.md#look) | How each reel thumbnail looks |
| [**Player**](look-player-product-card.md#player) | How the full-screen player behaves |
| [**Product card**](look-player-product-card.md#product-card) | How tagged products appear in the player |
| [**Advanced**](look-player-product-card.md#advanced) | Lazy loading and a custom CSS class |
| [**Place it**](#place-it) | The shortcode and how to add the widget to a page |

{% hint style="info" %}
**Need more room for the preview?** Click the active step on the rail again to collapse the panel, so the stage fills the width. Click any step to bring the panel back.
{% endhint %}

## Reels

The Reels step has two parts.

**The widget's reels (top)** are in the order they'll appear on the page. For each reel you can preview it or remove it from this widget. Removing a reel here doesn't delete it from your library.

**Your library (below)** lists every reel. Click a reel to add it, search by title, click **Load more** to see more, or click **Add reel** to create one without leaving the editor.

### Reorder reels

* **Mouse:** drag a reel to a new position.
* **Keyboard:** focus a reel, press **Space** to pick it up, use the **arrow keys** to move it, then press **Space** to drop it. Screen readers announce each move, for example *"Morning routine moved to position 2 of 6."*

## Settings per device

Some settings, such as reel width and gap, can differ between desktop, tablet and mobile. These show a small **device icon** next to their section title. They edit whichever device the stage is showing.

**Example:** set the reel width to `180` on desktop, switch the stage to **mobile**, then set it to `140`. Desktop keeps 180.

## Place it

The last step shows how to put the widget on your site:

* **Shortcode** with a copy button, for example `[productreels id="3"]`
* **Block editor:** add the ProductReels block and choose this widget
* **Elementor:** drag the ProductReels widget onto the page and choose this widget
* **Single reels:** the format for showing one reel on its own

Before the first save there's nothing to place yet, so this step offers a **Save widget** button instead.

See [Shortcodes](../placing-widgets/shortcodes.md), [Block editor](../placing-widgets/block-editor.md) and [Elementor](../placing-widgets/elementor.md).

## Saving and discarding

* **Unsaved changes** appears in the header whenever you've changed something.
* **Save widget** saves your changes and updates the widget everywhere it's placed. The cache is cleared straight away.
* **Discard** returns the widget to its last saved state.
* If you try to leave with unsaved changes, you're asked to confirm: **Keep editing** or **Leave**.

## Rename, duplicate or delete

* **Rename:** click the widget name in the header.
* **Duplicate** or **Delete widget:** use the **more** menu (⋯) in the header.
