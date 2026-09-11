<?php
/**
 * Caching for the public render payload.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/support
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Transient cache for `GET /render/:id`, with invalidation that cannot miss.
 *
 * The key carries a hash of the widget's styles and a site-wide generation
 * number. Any write to a widget, reel or file — including the ones that
 * touch a reel shared by many widgets — bumps the generation, so every
 * cached payload on the site is orphaned at once and expires by TTL. That is
 * one autoloaded option read per request and no LIKE query over the options
 * table, which also keeps it correct under an external object cache where
 * transients are not rows.
 *
 * The same generation is folded into the version the shortcode prints on
 * the mount node, so the browser's cached copy of the payload is busted at
 * the same moment.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/support
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Render_Cache {

	/**
	 * The option holding the generation counter.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const GENERATION_OPTION = 'wooreels_render_generation';

	/**
	 * Hook the invalidation to every write the data layer announces.
	 *
	 * @since  1.0.0
	 * @param  Wooreels_Loader $loader The hook collector.
	 * @return void
	 */
	public static function register( $loader ) {
		$events = array(
			'wooreels_widget_created',
			'wooreels_widget_updated',
			'wooreels_widget_deleted',
			'wooreels_reel_created',
			'wooreels_reel_updated',
			'wooreels_reel_deleted',
			'wooreels_settings_updated',
		);

		foreach ( $events as $event ) {
			$loader->add_action( $event, 'Wooreels_Render_Cache', 'bump' );
		}
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
		return (bool) Wooreels_Settings::get( 'cache_render', true );
	}

	/**
	 * How long a payload stays cached, in seconds.
	 *
	 * @since  1.0.0
	 * @return int The TTL.
	 */
	public static function ttl() {
		return (int) Wooreels_Settings::get( 'cache_ttl', 12 * HOUR_IN_SECONDS );
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
	 * The transient key for one widget at its current styles and generation.
	 *
	 * @since  1.0.0
	 * @param  int    $widget_id   Widget id.
	 * @param  string $styles_json The stored styles JSON.
	 * @return string The key.
	 */
	public static function key( $widget_id, $styles_json ) {
		return 'wooreels_render_' . (int) $widget_id . '_' . substr( md5( (string) $styles_json . '|' . self::generation() ), 0, 16 );
	}

	/**
	 * Read a cached payload.
	 *
	 * @since  1.0.0
	 * @param  string $key The key from key().
	 * @return array|null The payload, or null on a miss.
	 */
	public static function get( $key ) {
		if ( ! self::enabled() ) {
			return null;
		}

		$cached = get_transient( $key );

		return is_array( $cached ) ? $cached : null;
	}

	/**
	 * Store a payload.
	 *
	 * @since  1.0.0
	 * @param  string $key     The key from key().
	 * @param  array  $payload The payload.
	 * @return void
	 */
	public static function set( $key, $payload ) {
		if ( ! self::enabled() ) {
			return;
		}

		set_transient( $key, $payload, self::ttl() );
	}
}
