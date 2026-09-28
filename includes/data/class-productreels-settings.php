<?php
/**
 * Plugin settings and the default widget style object.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/data
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Wraps get_option()/update_option() with merged defaults, and owns the style
 * object every new widget starts from.
 *
 * Settings live in a single `productreels_settings` option. Reads always merge over
 * the defaults, so a setting added in a later release is present immediately
 * without a migration.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/data
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Settings {

	/**
	 * The option name holding every plugin setting.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const OPTION = 'productreels_settings';

	/**
	 * The settings a fresh install starts with.
	 *
	 * View limit and interval work together as the per-visitor view rate limit:
	 * at most `view_limit` views of one reel per `view_interval` minutes.
	 *
	 * @since  1.0.0
	 * @return array<string,mixed> Default settings.
	 */
	public static function defaults() {
		return array(
			'view_limit'               => 2,
			'view_interval'            => 1,
			'allow_public_fetch'       => true,
			'cache_render'             => true,
			'cache_ttl'                => 12 * HOUR_IN_SECONDS,
			'delete_data_on_uninstall' => false,
		);
	}

	/**
	 * Every setting, merged over the defaults and typed.
	 *
	 * @since  1.0.0
	 * @return array<string,mixed> The current settings.
	 */
	public static function all() {
		$stored = get_option( self::OPTION, array() );

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return self::sanitize( array_merge( self::defaults(), $stored ) );
	}

	/**
	 * Read one setting.
	 *
	 * @since  1.0.0
	 * @param  string $key      Setting name.
	 * @param  mixed  $fallback Returned when the setting is unknown.
	 * @return mixed The setting value.
	 */
	public static function get( $key, $fallback = null ) {
		$all = self::all();

		return array_key_exists( $key, $all ) ? $all[ $key ] : $fallback;
	}

	/**
	 * Apply a partial update, validated and clamped.
	 *
	 * Unknown keys are dropped: a payload can only ever move a setting this
	 * class already knows about.
	 *
	 * @since  1.0.0
	 * @param  array $partial The settings to change.
	 * @return array<string,mixed> The full settings after the update.
	 */
	public static function update( $partial ) {
		$current = self::all();

		if ( ! is_array( $partial ) ) {
			$partial = array();
		}

		foreach ( $partial as $key => $value ) {
			if ( ! array_key_exists( $key, $current ) ) {
				continue;
			}

			$current[ $key ] = $value;
		}

		$clean = self::sanitize( $current );

		update_option( self::OPTION, $clean );

		/**
		 * Fires after the plugin settings have been saved.
		 *
		 * @since 1.0.0
		 * @param array $clean The settings as stored.
		 */
		do_action( 'productreels_settings_updated', $clean );

		return $clean;
	}

	/**
	 * Coerce and clamp every setting to its allowed type and range.
	 *
	 * @since  1.0.0
	 * @param  array $input Raw settings.
	 * @return array<string,mixed> Clean settings.
	 */
	public static function sanitize( $input ) {
		if ( ! is_array( $input ) ) {
			$input = array();
		}

		$defaults = self::defaults();

		return array(
			'view_limit'               => Productreels_Validator::int_between( self::pick( $input, 'view_limit', $defaults ), 1, 100, $defaults['view_limit'] ),
			'view_interval'            => Productreels_Validator::int_between( self::pick( $input, 'view_interval', $defaults ), 1, 1440, $defaults['view_interval'] ),
			'allow_public_fetch'       => Productreels_Validator::bool( self::pick( $input, 'allow_public_fetch', $defaults ) ),
			'cache_render'             => Productreels_Validator::bool( self::pick( $input, 'cache_render', $defaults ) ),
			'cache_ttl'                => Productreels_Validator::int_between( self::pick( $input, 'cache_ttl', $defaults ), MINUTE_IN_SECONDS, WEEK_IN_SECONDS, $defaults['cache_ttl'] ),
			'delete_data_on_uninstall' => Productreels_Validator::bool( self::pick( $input, 'delete_data_on_uninstall', $defaults ) ),
		);
	}

	/**
	 * Read a key out of a raw settings array, falling back to its default.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  array  $input    Raw settings.
	 * @param  string $key      Setting name.
	 * @param  array  $defaults The default settings.
	 * @return mixed The raw value.
	 */
	private static function pick( $input, $key, $defaults ) {
		return array_key_exists( $key, $input ) ? $input[ $key ] : $defaults[ $key ];
	}

	/**
	 * The style object a new widget starts from.
	 *
	 * This single object drives the whole visual editor and the whole frontend
	 * render. Productreels_Validator::validate_styles() checks every incoming style
	 * payload against it: unknown keys are dropped, numbers out of range are
	 * clamped.
	 *
	 * @since  1.0.0
	 * @return array<string,mixed> The default styles.
	 */
	public static function default_styles() {
		return array(

			// Layout.
			'template'                  => 'carousel',
			'shape'                     => 'rectangle',
			'size'                      => 200,
			'sizeOnTab'                 => 150,
			'sizeOnMobile'              => 150,
			'gap'                       => 16,
			'gapOnTab'                  => 16,
			'gapOnMobile'               => 16,
			'topBottomSpacing'          => 0,
			'alignment'                 => 'center',

			// Thumbnail.
			'appearance'                => 'overlay',
			'showFallbackTitle'         => true,
			'captionColor'              => '#ffffff',
			'overlayColor'              => '#000000b8',
			'titleColor'                => '#111827',
			'hoverEffect'               => 'none',
			'cardBgColor'               => '#ffffff00',
			'border'                    => array(
				'width'          => 2,
				'color'          => '#9ca3af',
				'radius'         => 6,
				'radiusOnTab'    => 6,
				'radiusOnMobile' => 6,
			),
			'shadow'                    => array(
				'size' => 16,
			),

			// Play icon.
			'showPlayButton'            => false,
			'playIconSize'              => 40,
			'playIconColor'             => '#ffffff',

			// View count badge.
			'showViews'                 => true,
			'viewsBgColor'              => '#6b7280',
			'viewsTextIconColor'        => '#ffffff',

			// Widget title.
			'widgetTitle'               => array(
				'alignment'     => 'hidden',
				'fontSize'      => 24,
				'color'         => '#000000',
				'spacingTop'    => 0,
				'spacingBottom' => 16,
			),

			// Player.
			'playerAppearance'          => 'overlay',
			'showPlayerFallbackTitle'   => true,
			'slideDirection'            => 'horizontal',
			'playBehavior'              => 'click',
			'playWithSound'             => true,
			'loop'                      => true,
			'disablePreview'            => false,
			'showSeekbar'               => true,
			'showVolumeControl'         => true,

			// Preview nav buttons, inside the player.
			'previewBtnBgColor'         => '#ffffff',
			'previewBtnIconColor'       => '#374151',
			'previewBtnHoverBgColor'    => '#ffffff',
			'previewBtnHoverIconColor'  => '#374151',
			'previewBtnBorderRadius'    => 40,

			// Carousel nav buttons, on the thumbnail rail.
			'carouselBtnBgColor'        => '#ffffff',
			'carouselBtnIconColor'      => '#1f2937',
			'carouselBtnHoverBgColor'   => '#dbeafe',
			'carouselBtnHoverIconColor' => '#1f2937',
			'carouselBtnBorderRadius'   => 40,
			'carouselBtnPosition'       => 'inside',

			// Product card.
			'productCardStyle'          => 'modern',
			'showRatings'               => true,
			'showAddToCart'             => true,
			'addToCartText'             => 'Add to cart',
			// The alternative to Add to cart: add, then straight to checkout.
			// The editor keeps the two exclusive; if both arrive on, this wins.
			'directCheckout'            => false,
			'directCheckoutText'        => 'Buy now',

			// Template specific.
			'marquee'                   => array(
				'speed'        => 40,
				'direction'    => 'left',
				'pauseOnHover' => true,
			),
			'stacked'                   => array(
				'depth'  => 3,
				'offset' => 24,
				'scale'  => 0.92,
			),
			'popup'                     => array(
				'trigger'       => 'load',
				'delaySeconds'  => 5,
				'scrollPercent' => 30,
				'position'      => 'bottom-right',
				'showOnMobile'  => true,
				'dismissFor'    => 'session',
			),

			// Performance.
			'lazyLoad'                  => true,

			// Advanced.
			'customClass'               => '',
		);
	}
}
