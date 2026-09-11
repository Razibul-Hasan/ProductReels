# 02 — Data layer

**Deliverable:** `Wooreels_Repository` base + five repositories, `Wooreels_Settings`,
`Wooreels_Validator`. Unit-check via WP-CLI `eval`.

Full spec: `BUILD PROMPT.md` §7, §8.1, §8.2.

## Repository base — `includes/data/class-wooreels-repository.php`

```php
abstract class Wooreels_Repository {
    const CAST_INT = 'int'; const CAST_STRING = 'string';
    const CAST_BOOL = 'bool'; const CAST_JSON = 'json';
    const CAST_DATETIME = 'datetime';

    abstract protected function table_key();   // e.g. 'widgets'
    abstract protected function casts();       // column => cast

    protected function db() { global $wpdb; return $wpdb; }
    protected function table() { return Wooreels_Schema::table( $this->table_key() ); }
    // cast_row(), cast_rows(), fillable(), paginate(), find(), delete()...
}
```

The cast map is the security boundary: an unexpected key in a request payload can never reach
the database. Every method returns typed PHP arrays — ints as `int`, JSON columns already
decoded, booleans as `bool`. `global $wpdb` lives here and nowhere else.

## Repositories

- `class-wooreels-widgets.php` — list/paginate with search + allowlisted orderby, find with
  hydrated ordered reels, create (unique slug, auto-name `Untitled widget N`), update (replaces
  pivot, writes `sort_order` from array index), duplicate (styles + pivot + order, **not** click
  counters), delete (widget + pivot + click rows, reels untouched), stats aggregate.
- `class-wooreels-reels.php` — list/paginate with `search` and `exclude_widget`, find with files
  + links, create/update reel + files in one transaction, delete (reel + files + pivot),
  bulk delete, `increment_view()`.
- `class-wooreels-files.php` — per-reel file rows, replace-wholesale on reel update, delete one.
- `class-wooreels-clicks.php` — atomic upsert
  `INSERT … ON DUPLICATE KEY UPDATE click_count = click_count + 1`, per-widget click report.
- `class-wooreels-settings.php` — wraps `get_option`/`update_option` with merged defaults, plus
  `default_styles()` returning the style object from spec §8.1 verbatim.

**Hydration rule:** loading a widget's reels is **three** queries total (reels, files, clicks)
joined in PHP. Never one query per reel.

**Transactions:** create reel + files, and save widget + pivot, run inside
`START TRANSACTION` / `COMMIT` with `ROLLBACK` on any throwable.

## `includes/support/class-wooreels-validator.php`

- Colors (hex + alpha), URLs, ints with clamping, enums against fixed vocabularies.
- `validate_styles( $input )` against the §8.1 schema: unknown keys **dropped**, out-of-range
  numbers **clamped**, wrong types coerced or rejected. Never trust the client.
- `validate_links( $input )` against §8.2: `btn_type` is `custom` or `product`; `custom` needs
  `buttonText`, `buttonUrl`, `campaignName`; `product` needs `product_id`. `btn_uuid` is a v4
  uuid and is preserved exactly — it is the click-tracking key and must be stable forever.

## Done when

- WP-CLI `eval` round-trips a widget: create → add reels → reorder → read back in `sort_order`.
- A payload with a junk key and an out-of-range number saves clean and clamped.
- Two widgets sharing one reel record clicks separately.
- Show me the `wp eval` snippets and their output.
