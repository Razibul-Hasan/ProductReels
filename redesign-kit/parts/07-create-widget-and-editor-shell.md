# Part 07 — Create widget flow and the editor shell

**Depends on:** 06. **Changes code:** yes (create dialog, editor frame).

## Goal

Start new widgets from their layout, and give the widget editor its new frame: header, step rail, settings panel and the dark preview stage. The steps' contents come in parts 08 and 09; this part moves the existing 1.0.0 controls into the right steps so nothing is lost meanwhile.

## Look at

- `design/screens/ScreenCreateWidget.png`, `ScreenStudioLayout.png`
- `design/components/StudioHeader.png`, `StudioRail.png`, `Stage.png`, `TemplatePicker.png`, `Segmented.png`
- `design/reference/components.jsx` → `StudioShell`, `StudioHeader`, `StudioRail`, `StudioPanel`, `PanelSection`, `Stage`, `DeviceSwitch`, `DeviceFrame`, `TemplatePicker`
- `design/docs/flows.md` → "Create widget", "Widget editor"
- AUDIT.md section 12 (editor settings map)

## Do

1. **Create widget dialog**: wide Dialog "Create widget" with Widget name (help "Only you see this."), `TemplatePicker` as five tiles, Reel shape (Rectangle / Circle), and "Choose reels". It opens the editor on the Reels step with those values set and the widget **unsaved** (no database record until Save), unless AUDIT.md shows 1.0.0 relies on creating a draft first. In that case, follow 1.0.0 and note it.
2. **StudioHeader**: back to Widgets (through the unsaved guard), crumb, the name as a button that becomes an inline text field (Enter saves, Escape cancels), the spark "Unsaved changes" badge when dirty, the ShortcodeChip once saved, Discard (asks first when dirty), `more` menu (Duplicate, Delete widget with ConfirmDialog), and primary **Save widget** (`lg`). Ctrl/Cmd+S saves. The first save toasts "Widget saved" with the action "Place it", which opens that step.
3. **StudioRail**: Reels (with count), Layout, Look, Player, Product card, Advanced, then Place it after a separator. `aria-current="step"` on the active one. Clicking the active step again collapses the panel so the stage fills the width; clicking any step reopens it. Remember the last step per widget for the session.
4. **StudioPanel** for each step: title and one-line description from the PNGs; body built from `PanelSection`s.
5. **Stage**: `--pr-studio` background; bar with the live dot and "Live preview", `DeviceSwitch` (Desktop, Tablet, Mobile) and the width caption; the widget renders inside `DeviceFrame` using the real storefront components, with a placeholder page around it. Desktop renders the page at 1280px and scales to fit; tablet 768px; mobile 390px. Settings that differ per device edit the selected device (part 08 adds the indicator).
6. **Interim step contents**: move each existing 1.0.0 control into the step `flows.md` assigns it, keeping its current component, so the editor stays fully functional between parts. Remove the separate "Title appearance" header button: its controls go into the Layout step.
7. **Layout**: the shell fills the content area under the WP admin bar; panels scroll independently; below 1100px the stage narrows first; below 960px the rail becomes a horizontal strip above the panel and the stage moves below.

## Don't

- Change any stored setting key or the save payload.
- Leave any 1.0.0 setting unreachable.

## Done when

- [ ] Create widget → Choose reels → add reels → Save creates exactly one widget with the chosen layout and shape.
- [ ] The editor frame matches `ScreenStudioLayout.png` (panel contents may still be 1.0.0 controls).
- [ ] Every 1.0.0 setting is reachable in its new step (tick them off against AUDIT.md).
- [ ] Device switch, panel collapse, rename, discard, duplicate, delete, Ctrl/Cmd+S and the unsaved guard all work.

## Hand-off

Commit `1.1.0 part 07: create flow and editor shell`.
