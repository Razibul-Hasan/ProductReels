# WooReels — build prompts

`../BUILD PROMPT.md` is the full specification. It is too long to paste every session.
This folder splits it into short, numbered prompts — one per build phase.

## How to use

1. Open a fresh Claude Code session with the working directory set to `wooreels/`.
2. Paste **`00-context.md`** first. It is the shared contract every phase depends on.
3. Paste the phase file you are working on (`01…11`), in order.
4. Finish and verify a phase before starting the next one.

Each phase file links back to the section of `BUILD PROMPT.md` that holds the full
detail — open it when a phase file says "full spec §N".

## Files

| # | File | Phase |
| --- | --- | --- |
| 00 | [00-context.md](00-context.md) | Shared contract — paste first, every session |
| 01 | [01-foundation.md](01-foundation.md) | Plugin header, constants, schema, activator, uninstall |
| 02 | [02-data-layer.md](02-data-layer.md) | Repositories, settings, validator |
| 03 | [03-rest-api.md](03-rest-api.md) | Every `wooreels/v1` route |
| 04 | [04-admin-shell.md](04-admin-shell.md) | Menu, router, app chrome, design tokens, control primitives |
| 05 | [05-reels-library.md](05-reels-library.md) | Reels list + reel editor + links dialog |
| 06 | [06-shared-render-core.md](06-shared-render-core.md) | `src/shared/` — thumbnail, templates, player, providers |
| 07 | [07-widget-editor.md](07-widget-editor.md) | Three-pane editor, live preview, style panel |
| 08 | [08-public-frontend.md](08-public-frontend.md) | Shortcodes, mounting, tracking, add to cart |
| 09 | [09-stats-settings.md](09-stats-settings.md) | Statistics + Settings screens |
| 10 | [10-integrations.md](10-integrations.md) | Gutenberg block + Elementor widget |
| 11 | [11-polish.md](11-polish.md) | i18n, RTL, a11y, performance, caching, readme |

## Reference appendices

- Full style JSON defaults — `BUILD PROMPT.md` §8.1
- String bank (use these exact strings) — `BUILD PROMPT.md` Appendix A
- Reference implementation notes — `BUILD PROMPT.md` Appendix B
