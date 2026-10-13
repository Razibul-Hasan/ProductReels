# Releasing ProductReels 1.1.0

Everything in the plugin is ready for 1.1.0: version numbers, the upgrade routine, readme.txt and the release zip. This page covers the two things left for you: **the upgrade test** and **the SVN release**. Do them in that order. Don't commit to SVN until the test passes.

## The files

| File | What it is |
| --- | --- |
| `productreels.zip` (plugin folder) | The 1.1.0 release, built with `npm run zip`. 190 files, 628 KB. |
| `redesign-kit/release/productreels-1.0.0.zip` | 1.0.0, packed from commit `5fe2583`, for the upgrade test. If you kept the zip you released to WordPress.org, use that one instead. |

Both are git-ignored (`*.zip`). Rebuild the 1.1.0 zip any time with `npm run zip`.

## 1. Upgrade test (about 30 minutes)

Use a throwaway site, not your dev site or your store: a new Local site, or a staging copy. It needs WooCommerce with a few simple products (one on sale), and a variable product.

1. **Install 1.0.0.** Plugins → Add New → Upload Plugin → `productreels-1.0.0.zip` → Activate.
2. **Make real-looking data in 1.0.0:**
   - Reels: one uploaded MP4, one YouTube Shorts link, one Vimeo link, one hosted MP4 URL. Tag products on some and add a custom button with a campaign on another.
   - Widgets: one of each layout (grid, carousel, marquee, stacked, popup). Change several styles on each (size, border, colours, play button, title), and use a circle shape on one.
   - Settings: change every value (views per visitor, time window, public API off and on again, cache lifetime, leave "Delete all data" off).
   - Place them: one page with `[productreels id="…"]`, one with `[productreels_reel id="…"]`, one post with the ProductReels block, and one Elementor page if Elementor is installed.
   - Open the pages logged out, play some reels and click some buttons, so there are views and clicks.
   - Write down (or screenshot) the Widgets totals, one widget's Statistics, and the Settings values.
3. **Install 1.1.0 over it.** Plugins → Add New → Upload Plugin → `productreels.zip` → **Replace current with uploaded**. Don't deactivate or delete 1.0.0 first.
4. **Run `redesign-kit/checklists/regression-1.0-to-1.1.md`, every line.** The numbers must equal what you wrote down.
5. **Fresh install:** on a second throwaway site (or after deleting the plugin with "Delete all data" on), install `productreels.zip` alone, add a reel and a widget, and place it.
6. **Without WooCommerce:** deactivate WooCommerce. Every ProductReels screen opens, Tag products shows its notice, widgets still render.
7. **Debug on:** set `WP_DEBUG`, `WP_DEBUG_LOG` and `SCRIPT_DEBUG` to `true` in `wp-config.php` for the test, and check `wp-content/debug.log` stays free of ProductReels lines.

Tell Claude what failed, if anything, before going on.

What already passed on the dev site: the upgrade routine run from 1.0.0 against real data (every ProductReels table and the settings unchanged byte for byte; only the render-cache counter moved; a second run did nothing), Plugin Check on the zip (no errors or warnings, low severity included), PHPCS with the project ruleset, and the part 14 browser checks. Elementor has never been installed on the dev site, so check it in a real Elementor editor during this test.

## 2. SVN release

WordPress.org wants few, meaningful commits, so this is **one commit**. Commands are for the command line; TortoiseSVN has the same actions in its right-click menu (SVN Update, Add, Delete, Branch/tag, Commit).

1. **Get the SVN copy** (or `svn up` an existing one):
   ```sh
   svn co https://plugins.svn.wordpress.org/productreels productreels-svn
   cd productreels-svn
   ```
2. **Replace `trunk/` with the release.** Unzip `productreels.zip` somewhere, then copy the **contents** of its `productreels/` folder over `trunk/`, after emptying `trunk/` (keep any `.svn` folder).
   ```sh
   svn status trunk
   ```
   - Files marked `?` are new: `svn add` them (`svn add --force trunk` adds them all).
   - Files marked `!` were removed in 1.1.0: `svn rm` each one.
   - Expect many `M` files and new ones under `admin/src/components/pr/`, `admin/src/screens/editor/`, `admin/fonts/`, `src/shared/`, plus `THIRD-PARTY-NOTICES.txt`. Expect removals under `admin/src/components/ui/`, `admin/src/components/icons/` and old screen files.
   - Make sure nothing from `redesign-kit/`, `node_modules/` or any `*.map` file is there (the zip excludes them).
3. **Tag it** from trunk:
   ```sh
   svn cp trunk tags/1.1.0
   ```
4. **Screenshots in `assets/`.** readme.txt now has eight captions. Add `assets/screenshot-1.png` … `screenshot-8.png` taken from **your real store**, in this order (1440 px wide admin screens work well; PNG or JPG):
   1. Widgets (with totals, top reels and the table)
   2. The widget editor on a layout step with the live preview
   3. Reels (library with filters)
   4. Add / edit reel sheet
   5. Statistics for one widget
   6. Settings
   7. Reels on a product page
   8. The player on mobile and desktop

   The old `screenshot-1.png` … `screenshot-4.png` (storefront shots) are replaced by the new 1–4. Leave the banner and icon as they are. `svn add` any new images.
5. **Check, then commit once:**
   ```sh
   svn status
   svn ci -m "Release 1.1.0: redesigned admin, refreshed storefront"
   ```
   `trunk/readme.txt` says `Stable tag: 1.1.0`, and `tags/1.1.0/` exists in the same commit, so the update goes out to sites as soon as WordPress.org processes it (usually within minutes; the zip on the plugin page can take a little longer).
6. **After it's live:** update one real site from Dashboard → Updates and repeat a short version of the regression checklist (a widget renders, the editor opens with its settings, statistics match).

## Notes

- **Tested up to: 7.1** (you tested on WordPress 7.1.3). Requires at least 6.6 and Requires PHP 7.4 are unchanged.
- **Line endings.** This Windows checkout has `core.autocrlf` on, so files git hasn't rewritten are CRLF in the working tree and in the zip, and files Claude rewrote are LF. PHP and WordPress don't care, and Plugin Check passes; PHPCS's line-ending sniff flags the CRLF files. For an all-LF zip, add a `.gitattributes` with `* text=auto eol=lf`, run `git add --renormalize .` and re-checkout, then `npm run zip`. That touches every file, so it's your call.
- **Translations.** `languages/productreels.pot` is regenerated (604 strings). WordPress.org builds its own template and language packs from the released code, including the player chunk's strings, which 1.1.0 now loads with the public script.
- **Source.** The readable source (`admin/src`, `public/src`, `block/src`, `src/shared`), `webpack.config.js`, `package.json` and `README.md` ship in the zip, so no repository link is needed.
