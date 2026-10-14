---
description: Install and activate ProductReels on your WordPress site.
---

# Installation

## Install from your dashboard (recommended)

1. In WordPress, go to **Plugins → Add New Plugin**.
2. Search for **ProductReels**.
3. Click **Install Now**, then **Activate**.

A new **ProductReels** menu appears in your admin sidebar. It has three sections: **Widgets**, **Reels** and **Settings**.

## Install manually

Use this if your host blocks dashboard installs, or if you have a `productreels.zip` file.

{% tabs %}
{% tab title="Upload the zip" %}
1. Go to **Plugins → Add New Plugin → Upload Plugin**.
2. Choose `productreels.zip` and click **Install Now**.
3. Click **Activate Plugin**.
{% endtab %}

{% tab title="FTP / SFTP" %}
1. Unzip `productreels.zip` on your computer.
2. Upload the `productreels` folder to `/wp-content/plugins/`.
3. Go to **Plugins** and click **Activate** under ProductReels.
{% endtab %}
{% endtabs %}

## Before you start

* **WooCommerce.** If you want to tag products and let shoppers add them to their cart, install and activate WooCommerce first. Without it you can still use reels with custom buttons.
* **Elementor.** If you build pages with Elementor, the **ProductReels** widget appears in Elementor automatically once both plugins are active.
* **Your videos.** Short vertical clips (9:16) look best. For the widest browser support, use **MP4 with H.264 video and AAC audio**.

{% hint style="info" %}
**Who can use ProductReels?** Managing reels, widgets and settings needs an administrator account (the `manage_options` capability). Editors and authors (`edit_posts`) can place existing widgets with the block or Elementor, but can't change them.
{% endhint %}

## Updating from 1.0

Update ProductReels like any other plugin. Version 1.1 has a redesigned admin and a refreshed look on your store, and **all your reels, widgets, statistics and settings are kept**:

* Existing shortcodes, blocks and Elementor widgets keep working without changes.
* Styles you already saved keep their values. Only new widgets start from the new defaults.

## Next step

Continue to the [Quick start](quick-start.md) to publish your first reel.
