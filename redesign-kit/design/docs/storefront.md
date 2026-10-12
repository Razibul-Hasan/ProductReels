# Storefront

What shoppers see is built to sit inside any theme. ProductReels brings shape, spacing, overlays and the player; the theme brings the typeface and the page around it.

## Rules

- **Inherit the theme's font.** Storefront components (`prs-*`) set `font-family: inherit`; type tokens there supply size and weight only.
- **Scope everything.** Every storefront style sits under `.prs` and every variable a merchant can change is set on the widget's own element, so two widgets on one page can look different and nothing leaks into the theme.
- **Overlays stay legible on any frame.** Text over video sits on `reel-scrim` (a bottom gradient) or `reel-badge` pills, in `on-reel`. Product cards use `reel-glass` with `ink` text.
- **Sale prices**: regular price struck through in `ink-muted`, sale price in `spark`. On tiles narrower than 160px only the sale price shows.
- **Reels are 9:16 with `radius-reel`** or circles with a `ring` (default `ink`, 2px, with a 3px gap in the page colour).
- **One tap target per reel.** The whole tile opens the player; the product card on a tile is a preview, not a second button. Add to cart lives in the player.

## Layouts

| Layout | Behaviour |
| --- | --- |
| Grid | Wraps to fill the row at the chosen reel width; gap applies both ways |
| Carousel | One row with drag and scroll snap; arrows outside on wide containers, inside on narrow ones, hidden when every reel fits |
| Marquee | Scrolls by itself at the chosen speed and direction; pauses on hover; stops under `prefers-reduced-motion` |
| Stacked | A fanned deck; only the front reel shows its badges and card |
| Popup | One reel in a corner after the chosen trigger; the close button remembers the dismissal for the chosen period; optional on mobile |

## Player

- Opens fullscreen on phones and as a theatre on desktop (`PlayerTheater`): the current reel centred on `studio`, neighbours dimmed either side.
- Moves between reels by swipe (horizontal or vertical, per widget), arrow keys, mouse wheel and the Back button; Escape closes.
- Top: view count, sound, close. Bottom: title, the reel's buttons (white pills), product cards, seek bar.
- Add to cart updates the theme's mini-cart without leaving the player. Direct Checkout replaces it with "Buy now".
- Focus is trapped while open and returns to the tile on close; the page doesn't scroll behind it.
- Starts muted until the shopper turns sound on, unless the merchant chose "Play with sound" and the browser allows it.

## Defaults a merchant can change

| Setting | Default | Token |
| --- | --- | --- |
| Overlay shade | 80% | `reel-scrim` |
| Title colour | white | `on-reel` |
| View count pill | 60% shade, white text | `reel-badge`, `on-reel` |
| Corner radius | 16px | `radius-reel` |
| Shadow | soft drop | `shadow-reel` |
| Circle ring | 2px | `ink` |
| Arrows | white disc | `surface`, `ink`, `shadow-md` |
| Gap | 16px | `space-4` |
