# Start here: ProductReels 1.1.0 redesign kit

This kit lets Claude Code update your existing ProductReels plugin (1.0.0, already on WordPress.org) to **1.1.0**, with the new admin flow and layout and a refreshed storefront. The work is split into **16 parts**. You run one part per Claude Code session, check it, and move on. Your data, shortcodes, block and Elementor widget keep working throughout.

## 1. Before you start (about 10 minutes)

1. **Save a safe copy** of the plugin in git:
   ```bash
   cd path/to/productreels          # your plugin folder
   git add -A && git commit -m "1.0.0 before redesign"
   git tag v1.0.0
   git checkout -b release/1.1.0
   ```
   Keep the 1.0.0 zip somewhere too; part 15 uses it to test the upgrade.
2. **Unzip this kit into the plugin folder**, so you have `productreels/redesign-kit/` next to your main plugin file.
3. **Tell Claude Code about it.** Add the text from `redesign-kit/claude/CLAUDE-snippet.md` to the end of `CLAUDE.md` in the plugin folder (create the file if you don't have one).
4. **Optional shortcut:** copy `redesign-kit/claude/commands/pr-part.md` to `.claude/commands/pr-part.md` in the plugin folder. Then `/pr-part 03` runs part 03.
5. **Keep the kit out of releases:** add `redesign-kit` to `.distignore` (or whatever your zip script excludes). Part 15 double-checks this.
6. **Have a test site ready**: a local WordPress (wp-env, Local, or a staging copy) with WooCommerce, some products, and ProductReels 1.0.0 with a few reels and widgets on pages. Don't run the parts against your live store.

## 2. Run the parts

Open a terminal in the plugin folder and start Claude Code (`claude`). For each part:

1. Start a fresh conversation (`/clear`), so every part begins clean.
2. Paste the prompt from the table below, or use `/pr-part NN`.
3. Let it work. For the bigger parts (06–09, 12), you can add "Show me your plan before you edit files." to the prompt.
4. When it finishes it updates `redesign-kit/PROGRESS.md`, commits, and tells you what to check. Open your test site and check it.
5. Happy? Go to the next part. Not happy? Tell Claude Code what's wrong in the same session before moving on.

| Part | Paste this | What you check afterwards |
| --- | --- | --- |
| 00 | `Read redesign-kit/CONTEXT.md, then run redesign-kit/parts/00-audit.md.` | Read `redesign-kit/AUDIT.md`. **Answer its questions** in the same session. No code changes yet. |
| 01 | `Read redesign-kit/CONTEXT.md, then run redesign-kit/parts/01-foundations.md.` | Old screens still work, now with the new colours and font. The font doesn't load outside ProductReels. |
| 02 | `… run redesign-kit/parts/02-shared-components.md.` | Toasts and dialogs have the new look. |
| 03 | `… run redesign-kit/parts/03-app-shell.md.` | New top bar; menu says Widgets, Reels, Settings; old bookmarks still work. |
| 04 | `… run redesign-kit/parts/04-widgets-home.md.` | Widgets screen matches `design/screens/ScreenWidgets.png`; numbers equal 1.0.0's. |
| 05 | `… run redesign-kit/parts/05-reels-library.md.` | Reels grid, filters, bulk delete, load more. |
| 06 | `… run redesign-kit/parts/06-reel-editor.md.` | Add and edit a reel end to end; cover strip; product tagging. |
| 07 | `… run redesign-kit/parts/07-create-widget-and-editor-shell.md.` | Create widget dialog; new editor frame; every old setting still reachable. |
| 08 | `… run redesign-kit/parts/08-editor-reels-and-layout.md.` | Reels and Layout steps; drag and keyboard reordering. |
| 09 | `… run redesign-kit/parts/09-editor-look-player-card-place.md.` | Look, Player, Product card, Advanced, Place it. Old widgets look unchanged on the store. |
| 10 | `… run redesign-kit/parts/10-statistics.md.` | Statistics page; numbers equal 1.0.0's. |
| 11 | `… run redesign-kit/parts/11-settings.md.` | Settings and the save bar; values kept. |
| 12 | `… run redesign-kit/parts/12-storefront.md.` | Your product pages: new look, your saved styles kept, player works. |
| 13 | `… run redesign-kit/parts/13-page-builders.md.` | Block and Elementor: placeholder, picking a widget, old pages fine. |
| 14 | `… run redesign-kit/parts/14-quality-pass.md.` | Keyboard, right-to-left, translations, small screens, removed old code. |
| 15 | `… run redesign-kit/parts/15-release-1.1.0.md.` | Version 1.1.0, Plugin Check clean, upgrade test passed, release zip built, `RELEASE.md` written. |

(`…` = `Read redesign-kit/CONTEXT.md, then run`.)

Parts run in order. 10 and 11 only need 03, so you can do them earlier if you like.

## 3. If something goes wrong

- **Undo the last part:** `git log --oneline` to find it, then `git revert <commit>` (safe), or ask Claude Code "Revert the part 05 commit."
- **A session got cut off mid-part:** start a new one with `Read redesign-kit/CONTEXT.md and redesign-kit/PROGRESS.md, then continue part 06 from where it stopped.`
- **Claude Code drifts from the design:** "Compare your result with redesign-kit/design/screens/ScreenReels.png and match it." It can read the images.
- **It wants to change saved data or a REST response:** say no. CONTEXT.md forbids it; ask it to find an additive way.

## 4. Releasing to WordPress.org

Only after part 15. Test the update on a staging copy of your real store first (install 1.0.0 data, then upload the 1.1.0 zip over it). Then follow `redesign-kit/RELEASE.md` for SVN: update `trunk`, copy to `tags/1.1.0`, add new screenshots to `assets`, and commit once. Don't commit to SVN after each part.

## What's in the kit

```
redesign-kit/
├── START-HERE.md        this guide (for you)
├── CONTEXT.md           rules every part follows (for Claude Code)
├── AUDIT.md             filled in by part 00
├── PROGRESS.md          updated after every part
├── parts/               00-audit.md … 15-release-1.1.0.md
├── design/              screens, components, docs, reference code, CSS, fonts (see design/README.md)
├── checklists/          WordPress.org compliance; 1.0 → 1.1 regression
├── templates/           upgrade routine and readme.txt changelog drafts
└── claude/              CLAUDE.md snippet and the optional /pr-part command
```
