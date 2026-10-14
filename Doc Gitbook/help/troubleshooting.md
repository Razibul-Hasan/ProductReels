---
description: Fixes for the most common problems.
---

# Troubleshooting

## The widget doesn't appear on my page

1. **Check the ID.** Log in as an administrator and view the page. If the ID is wrong, you'll see a note such as *"ProductReels: widget #99 was not found."* Copy the correct shortcode from **ProductReels → Widgets**.
2. **Check the widget has reels.** Open it in the editor. The **Reels** step should list at least one reel.
3. **Clear your page cache.** If you use a caching plugin or host-level cache, purge it after adding a widget.
4. **Check for JavaScript errors.** Open your browser's developer tools (F12) and look at the **Console** tab. An error from another plugin can stop scripts from running. Try temporarily switching to a default theme, such as Twenty Twenty-Five, to rule out conflicts.

## Changes in the editor don't show on the site

ProductReels clears its own cache when you save. If the old version still shows:

* Make sure you clicked **Save widget**. The header shows **Unsaved changes** until you do.
* Purge your **page cache** or **CDN cache**.
* Hard-refresh the page (**Ctrl + Shift + R** on Windows, **Cmd + Shift + R** on Mac).

## A video won't play

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Black screen in Safari or on iPhone | Video codec isn't supported (for example HEVC or VP9 in MP4) | Re-export as **MP4, H.264 + AAC** |
| Works in the admin, not on the site | The video link is blocked by hotlink protection or CORS | Upload the file to your Media Library instead |
| YouTube reel shows "Video unavailable" | The video is private or embedding is disabled | Make the video **Public** or **Unlisted** and allow embedding in YouTube Studio |
| Vimeo reel won't play | Privacy is set to block embedding on your domain | In Vimeo, allow embedding on your site's domain |

## I can't capture a cover frame

Browsers block frame capture for videos hosted on another site (YouTube, Vimeo, external links). Use **Upload image** to add a cover, or upload the video to your Media Library.

## I can't save a reel

Read the note in the footer of the reel sheet. A reel needs:

* at least one **video**, and
* at least one **tagged product** or **button**.

If an upload is still running, wait for it to finish.

## "Tag products" says WooCommerce is turned off

Product tagging needs WooCommerce. Activate it under **Plugins**, or use **Add a button** instead.

## Add to cart sends shoppers to the product page

This is expected for **variable**, **grouped** and **external** products. The shopper needs to choose options on the product page. Simple products are added straight from the player.

## The cart count doesn't update after Add to cart

ProductReels syncs supported mini-carts automatically. If your theme uses a custom cart widget, the count may only update on the next page load. Ask your theme developer to listen for WooCommerce cart updates, or reload the fragment on `added_to_cart`.

## View counts seem low

* Views are counted after about **one second of playback**, not when a thumbnail appears.
* Each visitor can add only a limited number of views per reel in a time window (default: **2 per minute**). See [Settings → View tracking](../configuration/settings.md#view-tracking).
* Bots and crawlers aren't counted.
* Views you make while testing count like anyone else's, within the same limits.

## The popup doesn't show

* Check the **Trigger**. With **After scrolling**, the page must be long enough to scroll.
* Check **Show on mobile** if you're testing on a phone.
* If you closed the popup earlier, it stays hidden until the **Show again** period ends. Test in a private/incognito window.

## Editors can't change widgets

That's by design. Managing reels, widgets and settings needs the **Administrator** role (`manage_options`). Editors and authors can still **place** existing widgets with the block or Elementor.

## Still stuck?

Open a topic on the [ProductReels support forum](https://wordpress.org/support/plugin/productreels/) and include:

* your WordPress, WooCommerce and ProductReels versions
* your theme and page builder
* the page URL and what you expected to happen
* any errors from the browser console
