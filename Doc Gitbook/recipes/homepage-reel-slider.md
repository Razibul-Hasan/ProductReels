---
description: A scrollable row of shoppable videos for your homepage.
---

# Homepage reel slider

**Scenario:** *Luma Skincare* wants a "See it on real skin" section on the homepage. It should be a row of six customer videos that shoppers can swipe through, each linked to the product it shows.

**Time:** about 15 minutes. **You'll use:** the Carousel layout.

## 1. Prepare the reels

Create six reels under **ProductReels → Reels → Add reel**. For each one:

| Reel title | Video | Tagged product |
| --- | --- | --- |
| Morning routine with Vitamin C serum | `morning-routine.mp4` | Vitamin C Serum |
| Real review: Night Repair Cream | `night-cream.mp4` | Night Repair Cream |
| Unboxing the Travel Kit | YouTube Shorts link | Travel Kit |
| 60-second cleanse | `cleanse.mp4` | Gentle Cleanser |
| SPF that doesn't feel like SPF | `spf.mp4` | Daily SPF 50 |
| What's in my bag | Vimeo link | Lip Balm, Hand Cream |

Pick a cover for each one where the product is clearly visible.

## 2. Create the widget

1. **ProductReels → Widgets → Create widget**.
2. **Widget name:** `Homepage – real skin`.
3. **Layout:** Carousel. **Reel shape:** Rectangle.
4. **Choose reels** → add all six. Drag the strongest video, *Morning routine*, to first place.

## 3. Style it

**Layout step**

* Alignment: **Center**
* Reel width: **200** on desktop, **160** on tablet, **140** on mobile
* Gap: **16**
* Carousel arrows: **Outside**
* Title: Position **Center**, text taken from the widget name. Rename the widget to `See it on real skin` so the heading reads well.

**Look step**

* Title: **Below**
* Preview before play: **On hover**
* Hover effect: **Lift**
* View count: **On**, so the numbers act as social proof

**Player step**

* Slide direction: **Vertical**
* Seek bar: **On**
* Over the video: **Products**

**Product card step**

* Style: **Modern**
* Show ratings: **On**
* Buy button: **Add to cart**, with button text `Add to bag`

Click **Save widget**.

## 4. Place it

Open **Place it**, copy the shortcode (for example `[productreels id="4"]`) and add it to the homepage, or insert the **ProductReels** block and choose the widget.

## Result

Visitors see a centred heading and a row of six vertical videos. Hovering a video plays a silent preview. Tapping it opens the full-screen player, where shoppers swipe up for the next video and add products to their bag as they watch.

## Make it better over time

After two weeks, open the widget's **Statistics**. Move reels with a high click rate closer to the front, and replace videos that get views but no clicks.
