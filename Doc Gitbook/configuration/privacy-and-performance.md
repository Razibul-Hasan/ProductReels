---
description: What ProductReels stores, what it shares, and how it keeps pages fast.
---

# Privacy and performance

## Privacy

ProductReels **doesn't send any information about your site or visitors to ProductReels servers**. There's no tracking, no telemetry and no account to create.

### What's stored on your site

| Data | Where | Details |
| --- | --- | --- |
| View and click counts | Your WordPress database | Totals per reel, widget and button. No personal data. |
| A hash of the visitor's IP | A temporary WordPress transient | Used only for view rate limiting, salted with your site's keys and deleted when the time window ends. Raw IP addresses are never stored. |
| Counted reels, closed popups | The visitor's browser storage | Remembers which reels were already counted and whether a popup was closed |

### Third-party video services

Outside services are contacted **only when you use videos hosted by them**:

| Service | When | What |
| --- | --- | --- |
| **YouTube** | A visitor sees or opens a YouTube reel | Thumbnails from `img.youtube.com`. The YouTube IFrame Player API loads only when the reel is opened. |
| **Vimeo** | You add a Vimeo link | Vimeo's oEmbed service is asked for the poster image and duration. Only the link you entered is sent. |
| **Vimeo** | A visitor opens a Vimeo reel | Vimeo's Player SDK loads, with Do Not Track turned on where supported |

Videos uploaded to your Media Library, or linked from your own storage, don't contact any third party.

{% hint style="info" %}
**For your privacy policy:** if you use YouTube or Vimeo reels, mention that those providers may set cookies when a visitor plays a video. Link to [YouTube's terms](https://www.youtube.com/t/terms), [Google's privacy policy](https://policies.google.com/privacy), [Vimeo's terms](https://vimeo.com/terms) and [Vimeo's privacy policy](https://vimeo.com/privacy) as needed.
{% endhint %}

## Performance

ProductReels is built to add as little weight as possible to your pages.

* **Loads only where used:** scripts and styles load only on pages that contain a ProductReels widget.
* **Player on demand:** the full-screen player loads the first time a shopper opens a reel.
* **Lazy-loaded videos:** videos load as they come into view (Advanced → **Lazy load videos**).
* **Cached widgets:** widget data is cached and refreshed automatically when you edit it.
* **Provider scripts on demand:** YouTube and Vimeo players load only when a reel from that provider is opened.
* **Built on WordPress:** uses the React that ships with WordPress, so no second copy is downloaded.

### Tips for fast reels

1. **Compress your videos.** A 30-second 1080 × 1920 clip at about 3–5 Mbps is plenty for phones.
2. **Use MP4 (H.264 + AAC)** for the best compatibility.
3. **Keep Lazy load videos on**, except for a widget at the very top of the page.
4. **Use "On hover" preview** rather than "When visible" on pages with many reels.
5. **Offload large libraries** to a CDN and add them with **Video link** if you have hundreds of videos.

**Example:** a store with 40 reels on one landing page uses a Grid with preview **On hover** and lazy loading **on**. Only the videos a shopper actually points at or opens are downloaded.
