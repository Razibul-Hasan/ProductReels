# Part 10 — Widget statistics

**Depends on:** 04 (and 03 for routing). **Changes code:** yes (Statistics screen).

## Goal

Rebuild a widget's Statistics page: totals, reels ranked, buttons ranked.

## Look at

- `design/screens/ScreenStatistics.png`
- `design/components/MetricBand.png`, `BarCell.png`, `Badge.png`, `EmptyState.png`, `PageHeader.png`
- `design/reference/screens.jsx` → `ScreenStatistics`
- `design/docs/flows.md` → "Statistics"

## Do

1. **Header**: back button ("Back to widgets"), title "Statistics", description "%s, all time." with the widget name, the widget's ShortcodeChip and "Edit widget".
2. **MetricBand**: Views ("Counted after one second of playback"), Clicks ("Buttons and product cards"), Click rate ("Clicks per view"). Same numbers as 1.0.0.
3. **Reels table**, titled "Reels", "Sorted by views": cover, title (opens the reel editor), Views with `BarCell` (bar relative to the top reel), Clicks, Click rate.
4. **Buttons table**, titled "Buttons", "Custom buttons across this widget's reels": Button text, Campaign as a brand Badge ("No campaign" in muted text if empty), Link (shortened, full URL in `title`), Clicks with `BarCell`.
5. **Empty**: before any views, EmptyState "No stats yet" with "Place the widget on a page. Numbers appear once visitors watch and tap." and buttons "Place it" (opens that editor step) and "Edit widget". A widget with reels but no buttons hides the Buttons table and shows one muted line instead.
6. **States**: skeleton band and rows; error Notice with "Try again".

## Done when

- [ ] Matches `ScreenStatistics.png` at 1440px.
- [ ] Numbers match 1.0.0 for the same widget.
- [ ] Empty, loading and error states render.

## Hand-off

Commit `1.1.0 part 10: statistics`.
