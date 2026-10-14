---
description: View tracking, public API, caching and what happens on uninstall.
---

# Settings

Go to **ProductReels → Settings**. The page has four sections: **View tracking**, **Public API**, **Performance** and **Data**.

When you change something, a bar appears at the bottom with **Discard** and **Save settings**. Nothing is saved until you click **Save settings**.

## View tracking

Each visitor can add only a limited number of views to a reel in a time window, so page refreshes don't inflate your numbers.

| Setting | Default | Range | Description |
| --- | --- | --- | --- |
| **Views per visitor** | 2 | 1–100 | How many views one visitor can add to each reel inside the time window |
| **Time window** | 1 min | 1–1440 min | How long the limit lasts |

The **What this means** line sums up your choice in plain words, for example: *"A visitor adds at most 2 views to each reel every minute."*

**Examples:**

* **Default (2 per minute):** good for most stores.
* **1 per 1440 minutes (one day):** counts roughly *unique daily viewers per reel*. Useful if you report numbers to brand partners.

{% hint style="info" %}
Visitor IP addresses are hashed and never stored. See [Privacy and performance](privacy-and-performance.md).
{% endhint %}

## Public API

| Setting | Default | Description |
| --- | --- | --- |
| **Allow public fetch** | On | Lets other sites and apps read a widget from the REST API |

**Your own pages always work**, whatever this setting says. It only decides whether *other* sites and apps can read widget data directly.

When it's on, the public endpoint returns reel titles, video and cover links, view counts and product links. It never returns anything about your visitors or orders.

**Turn it off if** you don't use your reels outside your own site and prefer to keep the endpoint private.

**Keep it on if** you show your widgets in a headless front end, a mobile app or another site.

## Performance

| Setting | Default | Range | Description |
| --- | --- | --- | --- |
| **Cache widgets** | On | – | Widgets are assembled once and reused until something changes |
| **Cache lifetime** | 720 min (12 hours) | 1 min – 7 days | How long a cached widget is kept |

Editing a widget, reel or video **clears its cache straight away**, so you never need to clear it by hand after making changes.

{% hint style="success" %}
**Leave caching on.** The only reason to turn it off is while you're troubleshooting with a developer.
{% endhint %}

## Data

| Setting | Default | Description |
| --- | --- | --- |
| **Delete all data on uninstall** | Off | Removes every reel, widget and statistic when you delete ProductReels from **Plugins** |

* **Deactivating** ProductReels never removes anything.
* **Deleting** the plugin keeps your data unless this setting is on.

{% hint style="danger" %}
With this setting on, deleting the plugin permanently removes all reels, widgets and statistics. This can't be undone. You're asked to confirm when you turn it on.
{% endhint %}

**When to turn it on:** only when you're sure you'll never use ProductReels on this site again, for example when cleaning up a staging site.
