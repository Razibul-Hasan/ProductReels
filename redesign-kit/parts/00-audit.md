# Part 00 — Audit the 1.0.0 codebase (no code changes)

**Depends on:** nothing. **Changes code:** no. **Writes:** `redesign-kit/AUDIT.md`, `redesign-kit/PROGRESS.md`.

## Goal

Map the existing plugin so every later part uses real file paths, names and stored keys instead of guesses. This is the most important part: take your time and read the code.

## Look at

- `redesign-kit/CONTEXT.md`
- `redesign-kit/design/docs/flows.md` (the target structure, especially the editor settings table)
- `redesign-kit/design/screens/*.png` (skim all 13)
- `redesign-kit/AUDIT.md` (the template you fill in)

## Do

Fill in every section of `redesign-kit/AUDIT.md`. Quote real paths, function names, option keys and route paths. Where something doesn't exist, write "none".

1. **Identity.** Main plugin file; header values (Plugin Name, Version, Requires at least, Requires PHP, Tested up to, Text Domain, License); the plugin slug and folder; the PHP prefix and/or namespace; the version constant; any stored version option.
2. **Build.** `package.json` scripts and key dependencies (is it `@wordpress/scripts`? which version?); webpack config; every entry point (admin app, block, storefront, Elementor) and its output; how built assets are enqueued (`*.asset.php`?); whether React is externalised; whether `build/` is committed; lint/format/test commands; PHPCS config.
3. **Admin app.** Root element and where it mounts; the router (hash, query args, custom); every screen file in `admin/src/screens/`; shared components; how data is fetched (`apiFetch`? custom client?); toast system; unsaved-changes guard; how dialogs/modals are built (custom or `@wordpress/components`); drag-and-drop library; colour picker; media library usage; icon library.
4. **Styles.** SCSS/CSS structure; `admin/src/styles/_tokens.scss` contents; how styles are imported; how they're scoped; class naming convention today.
5. **Admin menu.** Every `add_menu_page`/`add_submenu_page`: title, slug, capability, callback. The `hook_suffix` values used to load assets.
6. **REST API.** Every route: namespace, path, methods, `permission_callback`, args, and the response shape (list the fields). Mark the public render endpoint.
7. **Data model.** How reels, widgets, links/products, stats and settings are stored (CPTs, custom tables with columns, options, meta). The full list of widget setting keys and how defaults are merged (are all values saved, or only changed ones?). The settings option name(s) and keys. View-tracking storage. Render-cache storage and how it's cleared. Uninstall cleanup.
8. **Storefront.** How a shortcode becomes markup (server HTML? React hydration? JSON payload + client render?); storefront JS/CSS entry points and when they're enqueued; the player implementation; how each layout is built; how the admin preview reuses storefront components; popup dismissal storage; add-to-cart / mini-cart sync; direct checkout.
9. **Integrations.** Block: `block.json` (name, version, attributes, editor script, render). Elementor widget: class, `get_name()`, controls. Shortcode registrations.
10. **i18n.** Text domain everywhere it's used; `wp_set_script_translations` calls; `languages/` folder; .pot generation.
11. **Local environment.** How to run WordPress locally for this plugin (wp-env config? ask the user if none). Whether Playwright or another browser tool is available for screenshots.
12. **Design → code map.**
    - For each design component in `design/docs/components.md`: the existing equivalent file, or NEW.
    - For each screen PNG: the existing screen file it replaces.
    - For every row of the editor settings table in `flows.md`: the stored key(s) that hold that setting today. Flag any setting in the design that has no stored key, and any 1.0.0 setting missing from the design.
13. **Data the design needs.** Check each and say "exists: <where>" or "missing: <proposed additive change>":
    - total views, clicks, click rate across all widgets
    - number of reels in use (in at least one widget) and total reels
    - top six reels by lifetime views, with clicks
    - per reel: number of widgets it's in, number of tagged products, number of buttons, video source type
    - reel list filters with counts: tagged products, with a button, not in a widget
    - paging info for reels ("Showing 24 of 61")
    - per-widget reel posters in order (for the stacked thumbnail)
14. **Risks and questions.** Anything that could break existing sites, anything ambiguous, and the questions you need the user to answer before part 01. Typical ones: does the plugin ship its logo mark in the repo; which local WordPress to test on; which WordPress version they test with for `Tested up to`.

## Don't

- Change any code, config or dependency.
- Run anything that writes to a database other than a disposable local one.

## Done when

- [ ] Every section of AUDIT.md is filled in with real paths and names.
- [ ] The editor settings map covers every 1.0.0 setting, with its stored key.
- [ ] The "data the design needs" list is complete, with an additive proposal for each missing item.
- [ ] Questions for the user are listed at the end of AUDIT.md.
- [ ] PROGRESS.md marks part 00 done.

## Hand-off

Commit `redesign-kit/AUDIT.md` and `PROGRESS.md` as `1.1.0 part 00: audit`. Then show the user the questions and wait for answers before part 01.
