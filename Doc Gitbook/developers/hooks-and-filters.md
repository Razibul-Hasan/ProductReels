---
description: Actions and filters for extending ProductReels.
---

# Hooks and filters

ProductReels fires WordPress actions when data changes, so you can connect it to other systems. Add your code to a child theme's `functions.php`, a custom plugin or a code snippets plugin.

## Filters

### `productreels_allow_provider_lookup`

Controls whether ProductReels may ask a video provider for metadata (poster image and duration) when an administrator adds a link. Return `false` to block the lookup.

| Parameter | Type | Description |
| --- | --- | --- |
| `$allow` | `bool` | Whether the lookup is allowed. Default `true`. |
| `$provider` | `string` | The provider, for example `'vimeo'` |

**Example: turn off Vimeo metadata lookups**

```php
add_filter( 'productreels_allow_provider_lookup', function ( $allow, $provider ) {
	if ( 'vimeo' === $provider ) {
		return false;
	}
	return $allow;
}, 10, 2 );
```

## Actions

### Reels

| Action | Arguments | Fires when |
| --- | --- | --- |
| `productreels_reel_created` | `int $reel_id` | A reel is created |
| `productreels_reel_updated` | `int $reel_id` | A reel is saved |
| `productreels_reel_deleted` | `int $reel_id` | A reel is deleted |

### Widgets

| Action | Arguments | Fires when |
| --- | --- | --- |
| `productreels_widget_created` | `int $widget_id` | A widget is created |
| `productreels_widget_updated` | `int $widget_id` | A widget is saved |
| `productreels_widget_deleted` | `int $widget_id` | A widget is deleted |

### Tracking

| Action | Arguments | Fires when |
| --- | --- | --- |
| `productreels_view_tracked` | `int $reel_id`, `int $widget_id` | A view is counted (after rate limiting) |
| `productreels_click_tracked` | `int $widget_id`, `int $reel_id`, `string $button_uuid` | A product or button click is recorded |

### Settings and lifecycle

| Action | Arguments | Fires when |
| --- | --- | --- |
| `productreels_settings_updated` | `array $settings` | Settings are saved |
| `productreels_activated` | – | The plugin is activated |
| `productreels_deactivated` | – | The plugin is deactivated |
| `productreels_schema_installed` | `array $results` | Database tables are created or updated |
| `productreels_migrated` | `string $db_version`, `string $previous_version` | A database migration has run |
| `productreels_rest_routes_registered` | – | All REST routes are registered |

## Examples

### Purge a page cache when a widget changes

ProductReels clears its own widget cache automatically. If you also use a full-page cache, purge it so visitors see changes straight away:

```php
add_action( 'productreels_widget_updated', 'luma_purge_page_cache' );
add_action( 'productreels_reel_updated', 'luma_purge_page_cache' );

function luma_purge_page_cache() {
	if ( function_exists( 'rocket_clean_domain' ) ) {
		rocket_clean_domain(); // WP Rocket
	}
}
```

### Send click events to your own analytics

```php
add_action( 'productreels_click_tracked', function ( $widget_id, $reel_id, $button_uuid ) {
	// Example: keep a simple daily counter in an option.
	$key    = 'luma_reel_clicks_' . gmdate( 'Ymd' );
	$counts = get_option( $key, array() );

	$counts[ $reel_id ] = isset( $counts[ $reel_id ] ) ? $counts[ $reel_id ] + 1 : 1;

	update_option( $key, $counts, false );
}, 10, 3 );
```

### Notify your team when a reel is published

```php
add_action( 'productreels_reel_created', function ( $reel_id ) {
	wp_mail(
		'marketing@example.com',
		'New reel added',
		sprintf( 'Reel #%d was added. Review it in ProductReels → Reels.', $reel_id )
	);
} );
```

{% hint style="warning" %}
Tracking actions run on public requests from visitors. Keep that code fast and never call slow external APIs synchronously inside them.
{% endhint %}
