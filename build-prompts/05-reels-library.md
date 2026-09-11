# 05 — Reels library & reel editor

**Deliverable:** reels list with multi-select delete, and the reel editor with all four upload
sources, the links dialog (custom + product tabs), and poster capture.

Full spec: `BUILD PROMPT.md` §10.4, §10.5, §8.2.

## Reels library (§10.4)

- Header: search, **Add Reel** button, and — when any card is selected — **Delete Selected (n)**.
- Responsive card grid. Each card: 9:16 poster, hover-play preview, title, view count badge,
  a link/product count chip, and a multi-select checkbox.
- Hover actions: Preview (opens the player modal) · Edit · Delete.
- Bulk delete confirm *"Are you sure you want to remove %d reels?"*, reports
  *"%d reels deleted successfully!"* / *"%d reels failed to delete."*
- Empty: *"You don't have any reels yet."* + Add Reel CTA.

## Reel editor (§10.5) — left = media, right = metadata

### Upload sources — a source picker popover, all four working

1. **Media Library** — `wp.media` frame, video mime types only, multi-select.
2. **Vimeo** — paste one or more `vimeo.com/…` URLs, validated via `POST /reels/validate-url`;
   pull poster + duration from oEmbed; preview thumbnail per URL; bad rows show
   *"Enter a valid Vimeo video URL."*
3. **YouTube Shorts** — same flow for `youtube.com/shorts/…` and `youtu.be/…`.
4. **Hosted / custom URL** — direct `.mp4`/`.webm` from a CDN or object store. Helper:
   *"For smooth playback across all browsers, use MP4 video URLs."*

Also support drag-and-drop onto the media zone — *"Click or drag and drop files here"*.

**Codec warning:** after selection, if any file is not H.264/AAC MP4 or WebM, show a
non-blocking warning — *"%d video(s) may not play reliably on iOS/macOS Safari. Recommended
format: MP4 (H.264/AAC)."*

**Poster / thumbnail:** choose from the media library, **or** capture a frame from the video at
a chosen timestamp with a `<canvas>` and upload the result to the media library.

### Metadata panel

- Reel title, placeholder *"Enter reel title"*.
- **Links** section, "Add link" opens a two-tab dialog:
  - **Custom link** — Button Text (required, *e.g Buy Now*), URL (required, validated,
    *e.g https://example.com*), Campaign Name (required, *e.g Summer sale*), Open in new tab,
    Custom class. Inline errors: *"Button text is required!"*, *"A valid url is required!"*,
    *"Campaign name is required!"*
  - **Products** — debounced search against `GET /products`, multi-select results with thumbnail
    + name + price, *"Select Products"* confirm. Disabled with an explanatory note when
    WooCommerce is inactive. Empty: *"No products are available to add."*
  - Added links render as a **sortable** list of chips with edit and remove actions.

## Link shape (§8.2) — write exactly this

```jsonc
[
  { "btn_type": "custom",  "btn_uuid": "…", "buttonText": "Buy Now",
    "buttonUrl": "https://example.com/product", "openInNewTab": true,
    "campaignName": "Summer sale", "customClass": "" },
  { "btn_type": "product", "btn_uuid": "…", "product_id": 421,
    "buttonText": "Denim Jacket" }   // snapshot of the product name at tag time
]
```

`btn_uuid` is generated client-side as uuid v4 and is **stable forever** — it is the
click-tracking key. Multiple links per reel are supported and shipped.

## Save

`POST /reels` or `PUT /reels/:id` in one transaction. Toasts *"Reel created successfully!"* /
*"Reel updated successfully!"*

## Done when

A reel can be created from each of the four sources, given a captured poster, tagged with both
a custom link and a product, saved, reopened, and edited without losing a `btn_uuid`. Multi-select
delete works. Report what you checked in the browser.
