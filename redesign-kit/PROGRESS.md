# PROGRESS — ProductReels 1.1.0

Claude Code updates this at the end of every part. Newest notes at the bottom of each section.

## Parts

- [x] 00 Audit (no code changes)
- [ ] 01 Foundations: tokens, fonts, type, icons, roots
- [ ] 02 Shared admin components
- [ ] 03 App shell, navigation and routes
- [ ] 04 Widgets home and first run
- [ ] 05 Reels library
- [ ] 06 Add / edit reel sheet
- [ ] 07 Create widget flow and editor shell
- [ ] 08 Editor steps: Reels and Layout
- [ ] 09 Editor steps: Look, Player, Product card, Advanced, Place it
- [ ] 10 Widget statistics
- [ ] 11 Settings
- [ ] 12 Storefront refresh
- [ ] 13 Block editor and Elementor
- [ ] 14 Accessibility, RTL, translations, responsive, clean-up
- [ ] 15 Release 1.1.0

## Log
<!-- Part NN — date — files changed — what to check -->
- Part 00 — 2026-10-12 — `redesign-kit/AUDIT.md` (filled in), `redesign-kit/PROGRESS.md`. No plugin code changed. Check: read AUDIT.md and answer the 8 questions in section 14. Setup also added `CLAUDE.md` (kit snippet) and `.claude/commands/pr-part.md`.

## Decisions
<!-- Question → answer (who decided) -->
- Release exclusion of `redesign-kit/` → no `.distignore` needed: `npm run zip` packs only `package.json` → `files`, which doesn't list the kit (Claude, setup).
- Open: AUDIT.md §14 questions 1–8 (git setup, test site, home totals, dropped settings + play-button hover colour, logo, upgrade runner, Tested up to, upload progress). Awaiting user.

## Follow-ups and removal candidates
<!-- Things later parts must handle -->
- Part 01: new font folder must be added to `package.json` → `files` (allowlist), or it won't ship.
- Part 15: `THIRD-PARTY-NOTICES.txt` is listed in `package.json` → `files` but doesn't exist; create it (Lucide ISC, Archivo OFL, dnd-kit MIT) or drop the entry.
- Part 15: use the existing `Productreels_Migrations` runner (`PRODUCTREELS_DB_VERSION` / `productreels_db_version`) and `Productreels_Render_Cache::bump()` (pending question 6).
- Parts 07–09: keep the 1.0.0 settings the design omits reachable (AUDIT §12 list); UI slider ranges must not clamp stored values outside them.
- Part 13: block attribute `widgetId` stays a string.
- Part 14 candidates: `admin/src/components/icons/index.js`, `ui/*` primitives and `wr-*` admin styles once fully replaced; `PosterCapture.js` once Filmstrip lands.
- Tooling: no PHP/phpcs/WP-CLI on this terminal's PATH; `lint:php`, `make-pot` and Plugin Check need Local's site shell.

## REST and data changes (all additive)
<!-- Route / param / field / table change — part — permission -->
- Proposed only (part 00, not built): `GET /overview` (admin_permission); `widget_count` field and `filter` arg on `GET /reels`; `GET /reels/counts` (admin_permission). See AUDIT §13.
