---
description: Find, filter, preview, edit and delete reels.
---

# Manage your reel library

**ProductReels → Reels** is your video library. Every reel you create lives here, whether or not it's in a widget.

## Find reels

* **Search** by title from the search box in the page header.
* **Filter** with the chips under the header:

| Filter | Shows |
| --- | --- |
| **All** | Every reel |
| **Tagged products** | Reels with at least one WooCommerce product |
| **With a button** | Reels with at least one custom button |
| **Not in a widget** | Reels that don't appear in any widget yet |

* **Switch view:** use the grid/list toggle to see reels as cards or rows.
* **Load more:** reels load in pages. The footer shows progress, for example *"Showing 24 of 61"*.

{% hint style="success" %}
**Tip:** check **Not in a widget** from time to time. These are videos you've already prepared but that nobody can see yet.
{% endhint %}

## Preview, edit and delete a reel

On any reel card:

* Click the **play button** to preview it in the player.
* Click the **title** to open the reel sheet and edit it.
* Open the **more** menu (⋯) for **Preview**, **Edit** and **Delete**.

Changes to a reel appear everywhere it's used. If the reel is in three widgets, all three update.

## Find a reel's ID

Each reel has a numeric ID, shown on the Reels screen. You need it for the single-reel shortcode:

```
[productreels_reel id="7"]
```

See [Shortcodes](../placing-widgets/shortcodes.md#single-reel-shortcode).

## Delete several reels at once

1. Select the checkbox on each reel card.
2. A bar appears at the bottom, for example *"3 reels selected"*.
3. Click **Delete selected** and confirm.

{% hint style="danger" %}
Deleting a reel removes it **from every widget it's in**. This can't be undone. If you only want to hide a reel from one widget, remove it in that widget's [Reels step](../widgets/widget-editor.md#reels) instead.
{% endhint %}

## Example: seasonal clean-up

At the end of summer, a swimwear store wants to retire its summer campaign:

1. Search `summer`.
2. Select the eight summer reels.
3. Click **Delete selected**.

Every widget that used those reels now shows only the remaining videos. No pages need editing.
