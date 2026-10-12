# How the design maps onto WordPress

- **Scopes.** Tokens are declared on `.pr-app` (the admin root), `.prs` (every storefront widget root) and `.pr-portal` (anything rendered outside those, such as dialogs and menus). Nothing is declared on `:root`, so themes and other plugins are never affected.
- **Names.** Tokens are `--pr-<name>`; component-local variables are `--prs-tile-w`, `--prs-gap`, `--prs-speed`, `--prs-ring`, `--pr-fill`; type classes are `.pr-t-<style>`; admin classes `pr-*`; storefront classes `prs-*`.
- **Fonts.** The two Archivo files ship inside the plugin, renamed "ProductReels Archivo" and "ProductReels Archivo Expanded" so a theme's own Archivo never clashes. They load on ProductReels admin screens only. The storefront always uses the theme's font. Admin text in scripts Archivo doesn't cover (Arabic, Hebrew, CJK) falls back to the system UI font.
- **React.** The reference components import from `@wordpress/element`. With `@wordpress/scripts`, React stays external and comes from WordPress.
- **RTL.** The CSS uses logical properties (`inset-inline-start`, `padding-inline-end`), so `dir="rtl"` mirrors layouts.
- **WordPress services.** Use `wp.media` for the Media Library, the colour picker the plugin already uses inside `ColorField`, and `apiFetch` with the REST nonce for requests.
- **Block editor.** The block uses core `Placeholder` and controls before a widget is chosen, then renders the live widget with the storefront components. Archivo and admin CSS never load in the editor canvas.
- **Translations.** Every string in the reference is English placeholder copy. Wrap each one with `@wordpress/i18n` and the plugin's text domain when porting.
