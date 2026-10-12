# WordPress.org compliance checklist for 1.1.0

Run through every line in part 15, and keep these in mind in every part. "Guideline N" refers to the WordPress.org Detailed Plugin Guidelines.

## Licensing and credits
- [ ] Everything in the plugin is GPLv2-or-later or GPL-compatible (Guideline 1). New in 1.1.0: Lucide icons (ISC), Archivo fonts (SIL OFL 1.1, with `OFL.txt` shipped beside the font files).
- [ ] readme.txt credits third-party assets and their licences.
- [ ] Built/minified JS has its human-readable source in the plugin, or readme.txt links the public repository (Guideline 4).

## No remote anything
- [ ] No fonts, scripts, styles or images load from a CDN or third-party host (Guideline 8). Search the built files for `https://` and check each hit.
- [ ] No tracking, telemetry or external requests without consent (Guideline 7). View tracking stays on the site; IPs are hashed and not stored.
- [ ] YouTube and Vimeo are contacted only to play videos the merchant added: no extra calls.

## WordPress-shipped libraries
- [ ] React, ReactDOM, `@wordpress/*`, lodash, jQuery and moment are externals, not bundled (Guideline 13). Check `*.asset.php` dependencies and the built JS.
- [ ] No second copy of any library WordPress ships.

## Admin behaviour
- [ ] Scripts, styles and fonts load only on ProductReels screens (`hook_suffix` checks), the block editor (block assets only) and storefront pages that render a widget (Guideline 11).
- [ ] No admin notices outside ProductReels screens; any notice is dismissible; no nags, upsells or "rate us" prompts.
- [ ] No dashboard widgets, no changes to other menus.
- [ ] No "Powered by" or credit links on the storefront (Guideline 10).

## Code safety
- [ ] Every PHP file starts with `defined( 'ABSPATH' ) || exit;`.
- [ ] Every REST route has a `permission_callback`; write routes check the same capability as 1.0.0; public read routes are deliberate.
- [ ] Every request arg is sanitised (`sanitize_text_field`, `absint`, `esc_url_raw`, `rest_sanitize_boolean`…) and validated.
- [ ] All output is escaped (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`).
- [ ] All SQL with variables uses `$wpdb->prepare()`; table changes use `dbDelta()`.
- [ ] No `eval`, `base64_decode` of code, `create_function`, `extract`, obfuscation, or `ALLOW_UNFILTERED_UPLOADS`.
- [ ] Global functions, classes, constants, options, transients, hooks and handles are prefixed.
- [ ] Uninstall deletes data only when the "Delete all data on uninstall" setting is on, and `uninstall.php` checks `WP_UNINSTALL_PLUGIN`.

## Internationalisation
- [ ] Text domain equals the plugin slug in the header, PHP and JS.
- [ ] Every user-facing string is translatable; counts use `_n()`; placeholders have translator comments.
- [ ] `wp_set_script_translations()` for each script with strings.

## Versioning and readme
- [ ] Header `Version`, version constant and readme `Stable tag` are all 1.1.0 (Guideline 15).
- [ ] `Requires at least`, `Requires PHP` unchanged (or deliberately raised and noted).
- [ ] `Tested up to` is the WordPress version actually tested.
- [ ] Changelog and Upgrade Notice for 1.1.0.
- [ ] Screenshots section captions match `assets/screenshot-N.png` in SVN.
- [ ] No keyword stuffing, competitor names or spam in readme (Guideline 12).

## Tools
- [ ] Plugin Check: no errors; warnings fixed or explained.
- [ ] PHPCS (WordPress standard) clean on changed files.
- [ ] Production build; zip excludes `redesign-kit/`, `node_modules/`, dot-files and dev files.

## SVN (the user does this)
- [ ] One commit for the release, not many small ones (Guideline 14).
- [ ] `tags/1.1.0/` matches `trunk/`.
