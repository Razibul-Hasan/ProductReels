# Components

Every component in the design, in the order the parts build them. Each has a screenshot in `design/components/<Name>.png` and an export of the same name in `design/reference/components.jsx`. Class names in the reference are final: `pr-*` for admin, `prs-*` for storefront, `pr-t-*` for type.

## Foundations

### Icon

Screenshot: `design/components/Icon.png`

Every icon in ProductReels: Lucide outlines on a 24px grid, drawn at 1.75 stroke in `currentColor`.

Pass `name` (one of the names below), and optionally `size` (16 in dense rows and badges, 18 in buttons and fields, 20 in the editor rail) and `label` when the icon stands alone and means something. Without `label` it is hidden from screen readers, which is right whenever text sits next to it.

- Do colour icons through the parent's `color`: `ink-muted` at rest, `ink` on hover, `brand` when selected.
- Do fill `play` and `star` (`fill="currentColor"`); everything else stays an outline.
- Don't mix in another icon set or emoji.

## Actions

### Button

Screenshot: `design/components/Button.png`

Buttons say exactly what happens: a verb and the thing it acts on ("Create widget", "Save reel", "Delete widget").

Props: `variant` (`primary` · `secondary` · `ghost` · `danger` · `ink` · `on-ink` · `studio`), `size` (`sm` 32px · `md` 40px · `lg` 48px), `icon` / `iconRight` (an Icon name), `block`, plus any native button attribute. Children are the label.

- One `primary` per view: the action the screen exists for. Everything else is `secondary` or `ghost`.
- `danger` appears only inside a confirmation, never as the first click.
- `lg` is for the editor's Save and first-run actions only.
- `ink` and `on-ink` live on dark fills (the bulk-action bar, toasts); `studio` lives on the editor's preview stage.
- Keep the label when a toast confirms it: "Save widget" produces "Widget saved".

### IconButton

Screenshot: `design/components/IconButton.png`

A square button holding one icon, for repeated row actions and toolbars where a text label would crowd the layout.

Props: `icon`, `label` (required: it becomes the accessible name and the tooltip), `size` (`sm` 32px · `md` 40px), `variant` (`outline` · `danger` · `studio`).

- Use it only where the icon is unambiguous next to its neighbours: edit, delete, more, close, reorder.
- `danger` only tints on hover; the delete still goes through a confirmation.
- Prefer a labelled Button for the one action a row is for ("Edit"), and put the rest behind `more`.

### ShortcodeChip

Screenshot: `design/components/ShortcodeChip.png`

The shortcode as a copy button: the whole chip copies, the icon turns to a check in `ok` for two seconds.

Props: `code` (the exact shortcode text), `copied` (initial state, for mockups).

- Show it wherever a merchant might need to place a widget: the widgets table, the editor header after the first save, the Place it step.
- Single reels use `[productreels_reel id="X"]`; widgets use `[productreels id="X"]`.
- Set in `code`; it is the only monospace text in the product.

## Status

### Badge

Screenshot: `design/components/Badge.png`

A short, non-interactive label: a layout type, a stock state, a source, an unsaved-changes flag.

Props: `tone` (`neutral` · `brand` · `ok` · `warn` · `danger` · `spark` · `outline`), `icon`, `dot`. Children are one to three words in sentence case.

- Every status tone carries a word, never colour alone ("Out of stock", not a red dot).
- `spark` with `dot` means "live or unsaved"; use it once per screen.
- Badges never sit inside buttons and are never clickable. Filters use FilterChips.

### LayoutBadge

Screenshot: `design/components/LayoutBadge.png`

The layout type of a widget as a neutral Badge with its layout icon.

Props: `layout` (`grid` · `carousel` · `marquee` · `stacked` · `popup`).

- Shown under the widget name in the widgets table and in the editor's Layout step header.
- The icon and the word always travel together; the five icons are not used for anything else.

### Notice

Screenshot: `design/components/Notice.png`

An inline message inside a panel or dialog that explains a state and, when there is one, the way out.

Props: `tone` (`info` · `ok` · `warn` · `danger`), `title`, `actions` (Buttons), `icon` (overrides the tone's icon). Children are one or two plain sentences.

- Say what happened and what to do, in the interface's voice: "Product tags need WooCommerce. Turn it on, or add a button with any link instead."
- Errors don't apologise and are never vague.
- Use a Toast instead for confirmations of something the person just did.

### Toast

Screenshot: `design/components/Toast.png`

A brief confirmation, bottom-centre, for something the person just did. Disappears after five seconds; stays while hovered or focused.

Props: `icon` (default `success`), `action` (one short verb, usually "Undo"). Children are the message.

- Name the result with the same words as the button that caused it: "Widget saved", "Shortcode copied", "3 reels deleted".
- Offer Undo for deletions instead of a second confirmation where the data can come back.
- Never put errors that need action in a toast: they belong in a Notice next to the problem.

### FloatingBar

Screenshot: `design/components/FloatingBar.png`

A pill-shaped ink bar that floats at the bottom of the page while there is a pending decision: unsaved settings or a bulk selection.

Props: `text`, `dot` (adds the spark dot for unsaved changes). Children are its buttons, `on-ink` for the secondary choice and `primary` or `danger` for the main one.

- Appears only while the state exists and disappears once it is resolved.
- One at a time. It never covers the last row of content: give the page bottom padding while it shows.

## Navigation

### AppHeader

Screenshot: `design/components/AppHeader.png`

The ProductReels bar under the WP admin bar: wordmark, version, the three sections and the docs link.

Props: `current` (`widgets` · `reels` · `settings`), `version`.

- The current section is an `ink` pill; the others are muted until hovered.
- Sections are named for what people manage: Widgets, Reels, Settings. "All" is implied.
- The widget editor replaces this bar with its own header (StudioHeader).

### PageHeader

Screenshot: `design/components/PageHeader.png`

The top of a list or settings page: the page title in `display`, an optional count, one sentence saying what lives here, and the page's actions on the right.

Props: `title`, `count`, `description`, `back` (label for a back button, for sub-pages like Statistics), `actions` (search and Buttons).

- The description explains the concept in a line, not the feature list: "Styled sets of reels you can place on any page."
- Put search first and the primary action last, rightmost.

### FilterChips

Screenshot: `design/components/FilterChips.png`

Single-choice filters above a list, each with its count.

Props: `items` (`{ id, label, count }`), `value`, `onChange`.

- The selected chip is an `ink` pill, matching the app's nav.
- Counts update with the search query; a filter with zero results stays visible with "0".

### Tabs

Screenshot: `design/components/Tabs.png`

Switches between views of the same object inside a dialog or panel, such as the two halves of the link dialog.

Props: `items` (`{ id, label, icon }`), `value`.

- Use Segmented instead when the choice is a setting's value; tabs change what you're looking at, not what gets saved.

### Segmented

Screenshot: `design/components/Segmented.png`

A small set of mutually exclusive values shown side by side: shape, alignment, slide direction, preview device.

Props: `options` (`{ value, label, icon }`), `value` / `defaultValue`, `onChange`, `block` (fills its container), `iconOnly` (labels become tooltips), `variant` (`studio` on the dark stage), `label` (the group's accessible name).

- Two to four options. More than that is a select or an option list (TemplatePicker).
- Icon-only only when the icons are standard (alignment, devices).

### Menu

Screenshot: `design/components/Menu.png`

The overflow menu behind a `more` IconButton, holding a row's secondary actions.

Props: `items`: `{ icon, label, hint, danger }`, or `'-'` for a separator.

- Order: frequent and safe first, the destructive action last, after a separator, in `danger`.
- Labels repeat the object when it helps: "Delete widget", not "Delete".

## Forms

### TextField

Screenshot: `design/components/TextField.png`

A labelled text input with help text and an error state.

Props: `label`, `help`, `error` (replaces help and marks the field invalid), `icon` (leading), `suffix` (a unit like "min" or "px"), `multiline`, plus native input attributes.

- Labels are nouns in sentence case ("Button text"); help says why or what format, in one line.
- Error text names the fix: "Add https:// to the start of the link."
- Validate on blur and on save, never on every keystroke.

### SearchField

Screenshot: `design/components/SearchField.png`

Search for a list, with a leading search icon. Filters as you type; no submit button.

Props: `placeholder` (say what is searched: "Search reels", "Search products by name or SKU"), `width`, plus native input attributes.

### Checkbox

Screenshot: `design/components/Checkbox.png`

Selects items for a bulk action or for a multi-select picker.

Props: `label` (optional; without it the box is labelled "Select"), `checked` / `defaultChecked`, `onChange`.

- On reel cards it appears on hover and stays once checked; selecting any card shows the bulk bar.
- For a single on/off setting use Toggle, not Checkbox.

### Toggle

Screenshot: `design/components/Toggle.png`

An on/off setting that takes effect when saved, with a label and a one-line description of what "on" does.

Props: `label`, `description`, `defaultChecked` / `checked`, `tone` (`danger` for settings that destroy data), `onChange`. The bare switch is also exported as `Switch`.

- The label states the "on" behaviour ("Play with sound", "Delete all data on uninstall"), never a question.
- `danger` turns the on-state red; pair it with a description of what is lost.

### ColorField

Screenshot: `design/components/ColorField.png`

A colour value with its swatch, hex and, when the setting allows transparency, the opacity.

Props: `label`, `value` (hex), `alpha` (0–100, omit when the setting is opaque), `help`.

- The swatch sits on a checkerboard so transparency is visible.
- Opens the WordPress colour picker; recently used colours from this widget appear first.

### RangeField

Screenshot: `design/components/RangeField.png`

A slider with its live value, for sizes, gaps, speeds and radii that are easier to judge by eye in the preview.

Props: `label`, `value`, `min`, `max`, `unit`, `help`.

- The preview updates while dragging.
- Arrow keys step by 1; Shift+arrow by 10.

### SettingsCard

Screenshot: `design/components/SettingsCard.png`

A titled group of settings rows on the Settings page. Each row is a `SettingRow`: the setting's name and what it does on the left, its control on the right.

Props (SettingsCard): `title`, `description`, `tone` (`danger` for the data section), `id` (for the page's section links). SettingRow: `title`, `description`, `below` (puts the control under the text, for wide controls), children = the control.

- One card per topic: View tracking, Public API, Performance, Data.
- When two numbers work together, add a summary line that reads the current values back as a sentence.

### TemplatePicker

Screenshot: `design/components/TemplatePicker.png`

Choose a widget's layout by its shape: five options, each with a small diagram of how reels sit on the page.

Props: `value` (`grid` · `carousel` · `marquee` · `stacked` · `popup`), `layouts` (to show a subset), `variant` (`list` in the editor panel · `tile` in the Create widget dialog), `columns`.

- The diagram uses `brand` for the selected option and `line-strong` otherwise; never photos.
- Descriptions say what the visitor experiences: "One row people swipe through".
- Changing layout keeps reels and styles; settings that only apply to one layout (marquee speed, popup trigger) appear below the picker.

## Data

### MetricBand

Screenshot: `design/components/MetricBand.png`

The totals that matter, in one band: big `metric` numbers with a plain label and a one-line hint.

Props: `items`: `{ label, value, hint, icon }`. Pass values already formatted ("12,480", "8.3%").

- One band per page, at the top. Three or four cells; never decorative stats.
- Labels use plain words: "Click rate" rather than "CTR".
- When nothing has been counted yet, show "0" and a hint that says how numbers start.

### WidgetTable

Screenshot: `design/components/WidgetTable.png`

The widgets list: each row shows the widget's reels, layout, shortcode and performance, with Edit as the one visible action.

Props: `widgets` (`{ id, name, layout, shape, reels: [reelIds], views, clicks, created }`), `menuOpenFor` (a widget id, for mockups).

- The whole name is a link to the editor; Edit repeats it as a button for clarity.
- Statistics, Duplicate, Copy shortcode and Delete live in the row's `more` menu.
- Numbers right-align in tabular figures; empty rates show "—".
- Default sort is newest first; the sorted column header is `ink`, the rest `ink-muted`.

### BarCell

Screenshot: `design/components/BarCell.png`

A number with a bar showing its share of the column's largest value, for ranking reels and buttons in Statistics.

Props: `value`, `max`, `label` (formatted text, defaults to the value).

- Bars are `brand` on a `brand-soft` track and never carry meaning without their number.

### ReelStack

Screenshot: `design/components/ReelStack.png`

Up to three of a widget's reels, overlapped, as its thumbnail in lists.

Props: `posters` (poster images or PosterArt kinds, in widget order), `round` (for circle-shaped widgets), `max`.

- Shows the first reels in the widget's own order, so reordering in the editor changes it.

## Library

### ReelCard

Screenshot: `design/components/ReelCard.png`

One reel in the library: its cover at 9:16, view count, title, what it sells and where it's used.

Props: `reel` (`{ title, poster, views, source, products, buttons, widgets }`), `selected`.

- Hover shows the selection checkbox and a play button that previews the reel; once any card is selected, all checkboxes stay visible.
- Non-upload sources show their icon top-right (YouTube Shorts, Vimeo, link).
- "Not in a widget" tells merchants which reels aren't working for them yet.
- Delete asks for confirmation and says the reel will leave every widget it's in.

### EmptyState

Screenshot: `design/components/EmptyState.png`

What a list shows when there's nothing in it: what belongs here and the first action to take.

Props: `title`, `description`, `actions`, `icon`, `panel` (draws it on a surface card).

- Every list has four non-content states: empty, loading, no results, error. Empty and no-results use this; loading uses skeleton rows; errors use a danger Notice with "Try again".
- No-results names the query and offers to clear it: "No reels match “serum”."

### StepGuide

Screenshot: `design/components/StepGuide.png`

First-run guidance on the Widgets page: the three steps from nothing to a live widget, with progress.

Props: `done` (0–3: how many steps are complete), `title`, `description`.

- Steps tick themselves off from real data: a reel exists, a widget exists, a widget has views.
- Only the current step's button is primary; later steps are visible but disabled, so the path is clear.
- Once a widget has views the guide is replaced by the metric band and table.

## Widget editor

### StudioHeader

Screenshot: `design/components/StudioHeader.png`

The widget editor's header, replacing the app bar: back to Widgets, the widget's name (click to rename), unsaved state, shortcode, and Save.

Props: `name`, `dirty` (shows the spark "Unsaved changes" badge), `id` (shows the shortcode once the widget exists).

- Save is the only primary button in the editor. Its label is "Save widget"; the toast says "Widget saved".
- Discard asks first if there are changes. Duplicate and Delete live in `more`.
- Leaving with unsaved changes asks: "Leave without saving? Your changes to Homepage stories will be lost."

### StudioRail

Screenshot: `design/components/StudioRail.png`

The editor's steps, top to bottom in the order most people work: Reels, Layout, Look, Player, Product card, Advanced, then Place it.

Props: `current` (a step id), `reels` (count shown on the Reels step).

- Steps are not a wizard: any step can be opened any time, and the preview always shows everything.
- "Look" holds thumbnail appearance (title display, overlay, hover, play button, view badge, border, shadow).

### ReelRow

Screenshot: `design/components/ReelRow.png`

A reel inside the widget being edited: drag to reorder, preview, or remove it from this widget (it stays in the library).

Props: `reel`, `dragging` (lifted state while being dragged).

- The order here is the order on the page.
- The second line says what the reel sells, so merchants can spot reels without links.
- The grip is keyboard operable: Space to lift, arrows to move, Space to drop.

### ReelPicker

Screenshot: `design/components/ReelPicker.png`

The library inside the editor's Reels step: tap a reel to add it to the widget, tap again to remove it.

Props: `reels`, `added` (ids already in the widget).

- Added reels get a `brand` outline and a check; they stay visible here so it's clear what's in.
- A search field and "Add reel" sit above it, so merchants can create a reel without leaving the editor.

### Stage

Screenshot: `design/components/Stage.png`

The editor's preview: a dark studio stage with the device switch, holding a DeviceFrame that shows the widget on a page exactly as visitors will see it.

Props (Stage): `device` (`desktop` · `tablet` · `mobile`), `note`. Children: a `DeviceFrame` (`device`, `url`, `context` adds placeholder page text around the widget) wrapping the widget.

- The preview runs the real storefront components; nothing is simulated.
- Responsive settings (size, gap, alignment) edit the device that's selected; a small device icon next to such a setting says so.
- The stage is the one place `studio` is used in the admin.

## Reel editor

### SourcePicker

Screenshot: `design/components/SourcePicker.png`

Where a reel's video comes from: upload, YouTube Shorts, Vimeo, or a direct MP4/WebM link.

Props: `value` (`upload` · `youtube` · `vimeo` · `url`), `state` (`empty` · `over` while dragging a file · `error`).

- Links are pasted one per line, so several videos can be added at once.
- Validation is per line and says which line is wrong and what a valid link looks like.
- Uploaded files show progress in VideoList; the dialog can be closed while they finish.

### VideoList

Screenshot: `design/components/VideoList.png`

The videos added to a reel, in play order, with upload progress, reorder and remove.

Props: `items`: `{ name, poster, frame, meta, progress }` (`progress` 0–100 while uploading).

- Move up and down are buttons, not drag only, so ordering works by keyboard.

### Filmstrip

Screenshot: `design/components/Filmstrip.png`

Pick a reel's cover by scrubbing through its frames, or upload an image.

Props: `kind` (poster), `position` (0–1 along the video), `time` (label at the playhead), `crossDomain` (shows why frames can't be captured).

- The cover is what shoppers see before they press play, so it previews at full size beside the strip.
- Videos hosted on sites that block frame capture explain this in a warn Notice and offer upload.

### ShopLinks

Screenshot: `design/components/ShopLinks.png`

What a reel sells: tagged WooCommerce products and custom buttons, shown over the video in the player.

Props: `items`: `{ type: 'product', product }` or `{ type: 'button', text, url, campaign }`.

- A reel needs at least one product or button to save; the dialog footer says so instead of disabling Save silently.
- Products open the ProductPicker; buttons open the LinkForm.

### ProductPicker

Screenshot: `design/components/ProductPicker.png`

Search and tag WooCommerce products on a reel; several at once.

Props: `selected` (product ids), `query`, `wooActive` (false shows the WooCommerce notice instead).

- Rows show name, price and SKU so similar products can be told apart.
- Out-of-stock products can still be tagged; the badge warns that the card will say so in the player.
- The confirm button counts the selection: "Tag 2 products".

### LinkForm

Screenshot: `design/components/LinkForm.png`

The fields for a custom button on a reel.

Props: `error` (shows the invalid-link state).

- Campaign groups clicks in Statistics, so merchants can compare promotions across reels.
- CSS class is optional and stays last.

### Dialog

Screenshot: `design/components/Dialog.png`

A modal for focused tasks (adding a reel, tagging products) and for confirming destructive actions (`ConfirmDialog`).

Props (Dialog): `title`, `description`, `size` (`md` 640 · `wide` 1040; default 520), `footer` (Buttons, primary last), `note` and `noteTone` (a line at the start of the footer, e.g. what's missing before saving). ConfirmDialog: `title`, children (the consequence), `confirm` (the danger button's label).

- Confirm titles are questions naming the object; the body states the consequence, not "Are you sure?".
- Escape and the close button cancel; focus starts on the first field, or on Cancel in a confirmation.

## Page builders

### BuilderPlaceholder

Screenshot: `design/components/BuilderPlaceholder.png`

What the ProductReels block (Gutenberg) and widget (Elementor) show before a widget is chosen.

Props: `builder` (the editor's name for the hint line).

- Once a widget is chosen, the block renders the live widget; its sidebar keeps the picker plus "Edit widget" and "Open ProductReels".
- If the chosen widget was deleted, the block shows a danger Notice: "This widget was deleted. Choose another or create one."

## Storefront

### ReelTile

Screenshot: `design/components/ReelTile.png`

One reel as visitors see it on the page: 9:16 or circle, with optional view count, play button, overlay title or product card. Clicking opens the player.

Props: `reel`, `shape` (`rect` · `circle`), `titleMode` (`overlay` · `title` below · `none`), `showViews`, `showPlay`, `showProduct`, `hover` (`zoom-in` · `zoom-out` · `lift`), `width`, `ring` (circle ring colour).

- A reel tagged with a product shows the product card instead of its title.
- Storefront text inherits the theme's font; ProductReels supplies colour, radius and spacing only.
- Overlay text sits on `reel-scrim` so it stays readable on any frame.

### ProductCard

Screenshot: `design/components/ProductCard.png`

A tagged product as shoppers see it on a reel and in the player.

Props: `product` (`{ name, price, regular, poster, rating, reviews }`), `variant` (`modern`: a compact row · `classic`: image above details), `addToCart`, `ratings`, `buttonText`, `checkout` (Direct Checkout: replaces Add to cart with Buy now).

- Sale prices show the regular price struck through in `ink-muted` and the sale price in `spark`.
- Add to cart updates the theme's mini-cart without leaving the player.
- Add to cart and Direct Checkout are exclusive; the setting that turns one on turns the other off.

### ReelsWidget

Screenshot: `design/components/ReelsWidget.png`

A whole widget on the storefront: an optional title and its reels in one of five layouts.

Props: `layout` (`grid` · `carousel` · `marquee` · `stacked` · `popup`), `reels`, `shape`, `title`, `align`, `arrows` (carousel: `outside` · `inside`), `tileWidth`, `gap`, `titleMode`, `showProduct`, `hover`, `popupSide`, `speed` (marquee seconds per loop).

- Carousel arrows sit outside the row on wide layouts and inside on narrow containers.
- Marquee pauses on hover and stops entirely under `prefers-reduced-motion`.
- Popup remembers its dismissal for the period the merchant chose.

### ReelPlayer

Screenshot: `design/components/ReelPlayer.png`

The fullscreen player a reel opens into: video, view count, sound and close, the reel's buttons and product cards, and a seek bar.

Props: `reel`, `compact` (no close button or time, for previews), `progress` (0–1), `muted`, `checkout`. On desktop it sits in `PlayerTheater` (`index`, `total`, `reels`) with the neighbouring reels dimmed either side.

- Swipe, arrow keys, mouse wheel and the browser's Back button all move between reels or close.
- Focus is trapped inside while open and returns to the tile on close; page scroll is locked.
- All controls sit on `reel-badge` or `reel-scrim` so they read on any frame.

### PlayerTheater

Screenshot: `design/components/PlayerTheater.png`

The desktop player: the current reel centred on `studio`, its neighbours dimmed either side, with previous/next and close.

Props: `index`, `total`, `reels` (`[previous, current, next]`).

## Mock content

### PosterArt

Screenshot: `design/components/PosterArt.png`

Placeholder product stills for mockups and empty previews. Not shipped in the plugin: real reels use the video's cover image.

Props: `kind` (`serum` · `cream` · `lip` · `tote` · `tube` · `pouch` · `oil` · `perfume`), `frame` (0–9: a slightly shifted frame, for the Filmstrip).
