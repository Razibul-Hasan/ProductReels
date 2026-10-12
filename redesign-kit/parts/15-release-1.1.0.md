# Part 15 — Release 1.1.0

**Depends on:** 14. **Changes code:** version numbers, upgrade routine, readme.txt, packaging.

## Goal

Ship 1.1.0 as a safe in-place update for sites running 1.0.0, passing WordPress.org's rules and Plugin Check.

## Look at

- `templates/upgrade-routine.php.txt`
- `templates/readme-1.1.0.txt`
- `checklists/wporg-compliance.md`, `checklists/regression-1.0-to-1.1.md`
- AUDIT.md sections 1, 2, 7, 9

## Do

1. **Version 1.1.0 everywhere 1.0.0 appears as the plugin's version**: plugin header `Version`, the version constant, readme.txt `Stable tag`, `package.json` `version`, `block.json` `version`, and any hard-coded asset version. Leave `Requires at least` and `Requires PHP` alone unless something now needs a newer version: if so, stop and ask the user.
2. **Upgrade routine**, adapted from `templates/upgrade-routine.php.txt` to the plugin's prefix and existing code. It runs on every load, but does work only when the stored version is older than 1.1.0. It is idempotent: running twice changes nothing. It never deletes or rewrites user data. It runs any `dbDelta()` changes from parts 04–05, adds defaults only for new options with `add_option()`, clears the render cache, and stores the new version. (Activation hooks don't run on updates, so this must not live only in the activation hook.) Multisite: per-site options, so it runs on each site as it loads.
3. **readme.txt**: changelog and upgrade notice from `templates/readme-1.1.0.txt` (edit to match what actually shipped). Update `Tested up to` to the WordPress version the user tested on: ask them. Update the Screenshots captions to the new screens. Add third-party credits: Archivo (SIL Open Font License 1.1) and Lucide icons (ISC). If built JS is minified and the source isn't in the plugin, make sure readme.txt links the public source repository.
4. **Packaging**: produce the release zip the way the project already does (`npm run plugin-zip`, `.distignore`, or a script). It must exclude `redesign-kit/`, `node_modules/`, tests, dot-files, and anything else not needed at runtime. It must include built assets, the fonts and their `OFL.txt`, the languages folder and source (if the project ships source). List the zip's contents in PROGRESS.md.
5. **Checks** (fix everything that fails, re-run until clean):
   - Plugin Check (`wp plugin check <slug>` or Tools → Plugin Check), all categories.
   - PHPCS with the project's ruleset (WordPress Coding Standards) if configured.
   - JS and CSS lint, production build.
   - `checklists/wporg-compliance.md`, every line.
6. **Upgrade test**, on a disposable site: install the 1.0.0 zip, create reels (upload, YouTube Shorts, Vimeo, link), widgets of all five layouts with custom styles, statistics, and changed settings; put them on pages via shortcode, block and Elementor. Then install the 1.1.0 zip over it ("Replace current with uploaded") and run `checklists/regression-1.0-to-1.1.md`. Also test a fresh 1.1.0 install. With WooCommerce deactivated, nothing errors.
7. **Release notes for the user**: write `redesign-kit/RELEASE.md` with the SVN steps (they run them, you don't): update `trunk/`, copy to `tags/1.1.0/`, update `assets/` screenshots (`screenshot-1.png`… matching the readme captions, from real screens of their site), and commit once. WordPress.org asks for few, meaningful SVN commits, so don't commit work-in-progress.

## Don't

- Push to SVN or publish anything yourself.
- Change `Requires at least` or `Requires PHP` without asking.

## Done when

- [ ] Every version string reads 1.1.0, and `Stable tag` matches the header.
- [ ] Plugin Check, PHPCS and lint are clean (or remaining items are explained in PROGRESS.md and accepted by the user).
- [ ] The 1.0.0 → 1.1.0 upgrade test passes the regression checklist with no data loss.
- [ ] The release zip is built and its contents are listed.
- [ ] RELEASE.md is written.

## Hand-off

Commit `1.1.0 part 15: release`. Don't tag or push. Tell the user the zip's path and that RELEASE.md has the SVN steps.
