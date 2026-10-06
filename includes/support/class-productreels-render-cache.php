<?php
/**
 * Caching for the public render payload.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/support
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Transient cache for `GET /render/:id`, with invalidation that cannot miss.
 *
 * One transient per widget, stamped with a site-wide generation number. Any
 * write to a widget, reel or file — including the ones that touch a reel
 * shared by many widgets — bumps the generation, so every cached payload on
 * the site is stale at once: the next read sees the old stamp, misses, and
 * overwrites the same row. That is one autoloaded option read per request,
 * no LIKE query over the options table, and never more than one row per
 * widget, which also keeps it correct under an external object cache where
 * transients are not rows.
 *
 * The same generation is folded into the version the shortcode prints on
 * the mount node, so the browser's cached copy of the payload is busted at
 * the same moment.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/support
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Render_Cache {

	/**
	 * The option holding the generation counter.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const GENERATION_OPTION = 'productreels_render_generation';

	/**
	 * Hook the invalidation to every write the data layer announces.
	 *
	 * @since  1.0.0
	 * @param  Productreels_Loader $loader The hook collector.
	 * @return void
	 */
	public static function register( $loader ) {
		$events = array(
			'productreels_widget_created',
			'productreels_widget_updated',
			'productreels_widget_deleted',
			'productreels_reel_created',
			'productreels_reel_updated',
			'productreels_reel_deleted',
			'productreels_settings_updated',
		);

		foreach ( $events as $event ) {
			$loader->add_action( $event, 'Productreels_Render_Cache', 'bump' );
		}

		// A deleted widget's row would otherwise sit there until its TTL ran out.
		$loader->add_action( 'productreels_widget_deleted', 'Productreels_Render_Cache', 'forget' );
	}

	/**
	 * The current generation.
	 *
	 * @since  1.0.0
	 * @return int The generation, never below 1.
	 */
	public static function generation() {
		return max( 1, (int) get_option( self::GENERATION_OPTION, 1 ) );
	}

	/**
	 * Orphan every cached render payload on the site.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public static function bump() {
		update_option( self::GENERATION_OPTION, self::generation() + 1, true );
	}

	/**
	 * Whether caching is turned on in Settings.
	 *
	 * @since  1.0.0
	 * @return bool Whether it is.
	 */
	public static function enabled() {
		return (bool) Productreels_Settings::get( 'cache_render', true );
	}

	/**
	 * How long a payload stays cached, in seconds.
	 *
	 * @since  1.0.0
	 * @return int The TTL.
	 */
	public static function ttl() {
		return (int) Productreels_Settings::get( 'cache_ttl', 12 * HOUR_IN_SECONDS );
	}

	/**
	 * The cache-buster the mount node carries and the browser sends back.
	 *
	 * @since  1.0.0
	 * @param  string $updated_at The widget's updated_at.
	 * @return string The version token.
	 */
	public static function version( $updated_at ) {
		return substr( md5( (string) $updated_at . '|' . self::generation() ), 0, 12 );
	}

	/**
	 * The transient key for one widget.
	 *
	 * @since  1.0.0
	 * @param  int $widget_id Widget id.
	 * @return string The key.
	 */
	public static function key( $widget_id ) {
		return 'productreels_render_' . (int) $widget_id;
	}

	/**
	 * The stamp a payload must carry to still be current: the styles it was
	 * built from and the generation it was built at.
	 *
	 * @since  1.0.0
	 * @param  string $styles_json The stored styles JSON.
	 * @return string The stamp.
	 */
	private static function stamp( $styles_json ) {
		return md5( (string) $styles_json . '|' . self::generation() );
	}

	/**
	 * Read a cached payload.
	 *
	 * @since  1.0.0
	 * @param  int    $widget_id   Widget id.
	 * @param  string $styles_json The stored styles JSON.
	 * @return array|null The payload, or null on a miss or a stale entry.
	 */
	public static function get( $widget_id, $styles_json ) {
		if ( ! self::enabled() ) {
			return null;
		}

		$cached = get_transient( self::key( $widget_id ) );

		if ( ! is_array( $cached ) || ! isset( $cached['stamp'], $cached['payload'] ) ) {
			return null;
		}

		if ( ! is_array( $cached['payload'] ) || self::stamp( $styles_json ) !== $cached['stamp'] ) {
			return null;
		}

		return $cached['payload'];
	}

	/**
	 * Store a payload, replacing whatever the widget had cached before.
	 *
	 * @since  1.0.0
	 * @param  int    $widget_id   Widget id.
	 * @param  string $styles_json The stored styles JSON.
	 * @param  array  $payload     The payload.
	 * @return void
	 */
	public static function set( $widget_id, $styles_json, $payload ) {
		if ( ! self::enabled() ) {
			return;
		}

		set_transient(
			self::key( $widget_id ),
			array(
				'stamp'   => self::stamp( $styles_json ),
				'payload' => $payload,
			),
			self::ttl()
		);
	}

	/**
	 * Drop a widget's cached payload.
	 *
	 * @since  1.0.0
	 * @param  int $widget_id Widget id.
	 * @return void
	 */
	public static function forget( $widget_id ) {
		delete_transient( self::key( $widget_id ) );
	}
}
