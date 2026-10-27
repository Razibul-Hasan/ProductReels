---
description: See which reels get watched, clicked and bought from.
---

# Statistics

ProductReels counts views, clicks and sales on your own site. No data is sent to outside services. See [Privacy and performance](../configuration/privacy-and-performance.md).

## Where to find your numbers

* **ProductReels → Widgets** shows totals across all widgets and your **Top reels**.
* **Statistics** for one widget: in the Widgets table, open the ⋯ menu on a row and choose **Statistics**.

## What's measured

| Metric | Meaning |
| --- | --- |
| **Views** | A reel was watched for about one second or more |
| **Clicks** | A shopper clicked a product or button in the player |
| **Click rate** | Clicks ÷ views. 50 clicks from 1,000 views is a 5% click rate. |
| **Orders** | Paid orders with a product added to the cart from one of the widget's reels (WooCommerce only) |
| **Revenue** | The total of those products' order lines, before tax (WooCommerce only) |
| **Reels in use** | How many of your reels appear in at least one widget |

## A widget's Statistics screen

* **Date range:** **All time**, or the last **90**, **30** or **7 days**.
* **Totals:** Views, Clicks and Click rate for this widget, plus Orders and Revenue with WooCommerce.
* **Trend chart** (day ranges only): one bar per day. Switch it between **Views**, **Clicks**, **Orders** and **Revenue**, and point at a bar to see that day's number.
* **Reels table:** each reel ranked by views, with a bar so you can compare them at a glance. With WooCommerce it also shows each reel's orders and revenue. Sort by any column.
* **Buttons table:** each button's text, campaign, link and clicks. It always shows all-time clicks, because clicks per button aren't counted by day.

Before the widget has any views, the screen explains that numbers appear once the widget is on a page and visitors watch.

### All time and day ranges

The two count views slightly differently:

* **All time** shows each reel's lifetime views, counted in every widget that shows it (the same numbers as before 1.1.1).
* **A day range** shows only the views and clicks in **this widget** on those days.

Daily numbers start on the day you installed 1.1.1. If a range reaches back before that, the screen says when daily counting began. All-time numbers go back to the beginning.

## How a sale is counted

1. A shopper opens a reel and clicks **Add to cart** (or **Buy now**) on a tagged product.
2. ProductReels remembers that the product came from that reel and widget, for as long as it stays in the shopper's cart.
3. At checkout, the order line is labelled with the reel. This works with both the classic and the block checkout.
4. When the order is **paid** (Processing or Completed), it counts towards **Orders** and **Revenue**.

* **Cancelled**, **refunded** and **failed** orders are taken back out, and so are deleted orders.
* **Revenue** is the line total of the products added from reels, after discounts and before tax and shipping. Other products in the same order aren't counted.
* **One order is one order.** If a shopper adds products from two reels, each reel shows one order, and the widget's total still counts one.
* Products added to the cart from the shop page, or in the editor preview, aren't counted as sales from a reel.

{% hint style="info" %}
Partial refunds don't lower the revenue shown. A fully refunded order is removed.
{% endhint %}

## Reading the numbers: a real example

Luma Skincare checks its **Homepage stories** widget with the range set to **30 days**:

| Reel | Views | Clicks | Click rate | Orders | Revenue |
| --- | --- | --- | --- | --- | --- |
| Morning routine with Vitamin C serum | 2,140 | 171 | 8.0% | 38 | $1,292.00 |
| Real review: Night Repair Cream | 1,380 | 41 | 3.0% | 6 | $252.00 |
| Unboxing the Travel Kit | 620 | 50 | 8.1% | 19 | $1,045.00 |

**What the owner learns:**

* **Morning routine** gets lots of views, clicks *and* orders, so it stays first.
* **Unboxing** has few views, but it earns almost as much as the morning routine, since the Travel Kit is a bigger basket. It moves from position 6 to position 2 to get more attention.
* **Night Repair Cream** gets watched but rarely clicked or bought. Maybe the product isn't clear in the video. They try a different cover and add a **Shop the night routine** button.

They switch the chart to **Orders** and see a jump on the day of their newsletter. Next time they'll link the newsletter straight to the page with this widget.

## Why numbers may look low

* **Rate limiting.** By default, each visitor can add at most **2 views per reel per minute**, so refreshing the page doesn't inflate your numbers. You can change this in [Settings](../configuration/settings.md#view-tracking).
* **Bots are ignored.** Obvious crawlers aren't counted.
* **The video has to actually play.** Scrolling past a thumbnail isn't a view.
* **Day ranges start at the update.** Days before you installed 1.1.1 show as zero in the chart.

## Why orders may look low

* **Only paid orders count.** Orders that are still **Pending payment** or **On hold** appear once they move to **Processing** or **Completed**.
* **The product has to be added from the reel.** A shopper who watches a reel, then adds the product from the product page, isn't counted as a sale from the reel.
* **Orders before 1.1.1 aren't counted.** Sales tracking starts with the update.
