# Part 11 — Settings

**Depends on:** 03. **Changes code:** yes (Settings screen). **Data:** same option names and sanitising as 1.0.0.

## Goal

Rebuild Settings with section links, setting cards, and a save bar that appears only when something changed.

## Look at

- `design/screens/ScreenSettings.png`
- `design/components/SettingsCard.png`, `Toggle.png`, `TextField.png`, `FloatingBar.png`, `Notice.png`
- `design/reference/screens.jsx` → `ScreenSettings`

## Do

1. **Header**: "Settings", "How views are counted, who can read your widgets, caching, and what happens on uninstall."
2. **Section links** on the left (View tracking, Public API, Performance, Data), sticky, highlighting the section in view; anchors work by keyboard.
3. **View tracking**: Views per visitor; Time window (min); a summary line that reads the values back in words. Build it from translatable pieces: "A visitor adds at most %1$s to each reel %2$s." where %1$s is `_n( '%d view', '%d views' )` and %2$s is "every minute" / "every %d minutes" / "every hour" / "every %d hours" / "every day", chosen from the number of minutes. End it with "IPs are hashed and never stored."
4. **Public API**: "Allow public fetch" with the endpoint path in `.pr-t-code` and the plain-language description from the PNG.
5. **Performance**: "Cache widgets" and "Cache lifetime" (min), validated 1–10080 with the error "Use a number from 1 to 10,080 minutes (7 days)." Cache lifetime is disabled while caching is off.
6. **Data**: danger-tone card. "Delete all data on uninstall" uses the danger Switch, with "Removes every reel, widget and statistic when you delete ProductReels from Plugins. This can't be undone." Turning it on asks for confirmation.
7. **Save bar**: when any value differs from the saved one, the FloatingBar shows "You have unsaved changes" with Discard and "Save settings". Save → toast "Settings saved"; server errors appear inline on the field, plus an error toast. The unsaved guard covers leaving the page.

## Don't

- Change option names, defaults or the server-side sanitize/validate callbacks (you may add validation that 1.0.0 lacked if it can't reject a value 1.0.0 accepted).

## Done when

- [ ] Matches `ScreenSettings.png`.
- [ ] Saving and reloading keeps every value; existing values from 1.0.0 show correctly after the update.
- [ ] The summary sentence is right for 1, 5, 60, 90 and 1440 minutes, and translatable.

## Hand-off

Commit `1.1.0 part 11: settings`.
