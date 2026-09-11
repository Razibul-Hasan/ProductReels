<?php
/**
 * Validation and coercion for everything that arrives from a client.
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
 * Turns untrusted input into values the rest of the plugin can rely on.
 *
 * Nothing here ever fails loudly on a bad style value: unknown keys are
 * dropped, out-of-range numbers are clamped and wrong types are coerced back to
 * the default. A widget must always render, whatever a client sends.
 *
 * Links are stricter, because a malformed button is worse than a missing one:
 * a link that cannot render is dropped rather than repaired.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/support
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Validator {

	/**
	 * The video sources a file row may declare.
	 *
	 * @since 1.0.0
	 * @var   string[]
	 */
	const SOURCES = array( 'native', 'vimeo', 'youtube', 'hosted' );

	/**
	 * The two link variants.
	 *
	 * @since 1.0.0
	 * @var   string[]
	 */
	const LINK_TYPES = array( 'custom', 'product' );

	/**
	 * Coerce anything to a boolean, the way a checkbox round-trips through JSON.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Raw value.
	 * @return bool The boolean.
	 */
	public static function bool( $value ) {
		if ( is_string( $value ) ) {
			$lower = strtolower( trim( $value ) );

			if ( in_array( $lower, array( 'false', '0', 'no', 'off', '' ), true ) ) {
				return false;
			}

			return true;
		}

		return (bool) $value;
	}

	/**
	 * Coerce to an integer and clamp it into a range.
	 *
	 * @since  1.0.0
	 * @param  mixed $value    Raw value.
	 * @param  int   $min      Lowest allowed value.
	 * @param  int   $max      Highest allowed value.
	 * @param  int   $fallback Used when the value is not numeric at all.
	 * @return int The clamped integer.
	 */
	public static function int_between( $value, $min, $max, $fallback = 0 ) {
		if ( is_bool( $value ) || ! is_numeric( $value ) ) {
			$value = $fallback;
		}

		return (int) min( (int) $max, max( (int) $min, (int) $value ) );
	}

	/**
	 * Coerce to a float and clamp it into a range.
	 *
	 * @since  1.0.0
	 * @param  mixed $value    Raw value.
	 * @param  float $min      Lowest allowed value.
	 * @param  float $max      Highest allowed value.
	 * @param  float $fallback Used when the value is not numeric at all.
	 * @return float The clamped float.
	 */
	public static function float_between( $value, $min, $max, $fallback = 0.0 ) {
		if ( is_bool( $value ) || ! is_numeric( $value ) ) {
			$value = $fallback;
		}

		return (float) min( (float) $max, max( (float) $min, (float) $value ) );
	}

	/**
	 * Match a value against a fixed vocabulary.
	 *
	 * @since  1.0.0
	 * @param  mixed    $value    Raw value.
	 * @param  string[] $allowed  The vocabulary.
	 * @param  string   $fallback Used when the value is not in it.
	 * @return string The allowed value.
	 */
	public static function enum( $value, $allowed, $fallback = '' ) {
		$value = is_scalar( $value ) ? (string) $value : '';

		if ( in_array( $value, (array) $allowed, true ) ) {
			return $value;
		}

		return (string) $fallback;
	}

	/**
	 * Validate a CSS hex colour, with optional alpha.
	 *
	 * Accepts #rgb, #rgba, #rrggbb and #rrggbbaa — the plugin's own defaults
	 * use the eight digit form for transparency, so sanitize_hex_color() is too
	 * strict here.
	 *
	 * @since  1.0.0
	 * @param  mixed  $value    Raw value.
	 * @param  string $fallback Used when the value is not a hex colour.
	 * @return string The colour.
	 */
	public static function hex_color( $value, $fallback = '#000000' ) {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';

		if ( preg_match( '/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i', $value ) ) {
			return strtolower( $value );
		}

		return (string) $fallback;
	}

	/**
	 * Sanitize a URL for storage.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Raw value.
	 * @return string The URL, or an empty string when it is not usable.
	 */
	public static function url( $value ) {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';

		if ( '' === $value ) {
			return '';
		}

		return (string) esc_url_raw( $value );
	}

	/**
	 * Sanitize a single line of plain text and cap its length.
	 *
	 * @since  1.0.0
	 * @param  mixed $value      Raw value.
	 * @param  int   $max_length Longest string to keep.
	 * @return string The text.
	 */
	public static function text( $value, $max_length = 255 ) {
		$value = is_scalar( $value ) ? (string) $value : '';
		$value = sanitize_text_field( $value );

		if ( mb_strlen( $value ) > $max_length ) {
			$value = mb_substr( $value, 0, $max_length );
		}

		return $value;
	}

	/**
	 * Sanitize a space separated list of CSS class names.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Raw value.
	 * @return string The class list.
	 */
	public static function css_classes( $value ) {
		$value = is_scalar( $value ) ? (string) $value : '';
		$out   = array();

		foreach ( preg_split( '/\s+/', trim( $value ) ) as $class ) {
			$clean = sanitize_html_class( $class );

			if ( '' !== $clean ) {
				$out[] = $clean;
			}
		}

		return implode( ' ', array_slice( $out, 0, 10 ) );
	}

	/**
	 * Validate a version 4 UUID.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Raw value.
	 * @return string The UUID in lower case, or an empty string when invalid.
	 */
	public static function uuid( $value ) {
		$value = is_scalar( $value ) ? strtolower( trim( (string) $value ) ) : '';

		return wp_is_uuid( $value, 4 ) ? $value : '';
	}

	/**
	 * Validate a video source against the fixed vocabulary.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Raw value.
	 * @return string One of native|vimeo|youtube|hosted.
	 */
	public static function source( $value ) {
		return self::enum( $value, self::SOURCES, 'native' );
	}

	/**
	 * The constraint schema for the widget style object.
	 *
	 * Keys mirror Wooreels_Settings::default_styles() exactly; the defaults
	 * themselves are not repeated here, they are read from that method, so the
	 * two can never drift apart.
	 *
	 * @since  1.0.0
	 * @return array<string,array> The schema.
	 */
	public static function styles_schema() {
		$color = array( 'type' => 'color' );
		$flag  = array( 'type' => 'bool' );

		return array(

			// Layout.
			'template'                  => array(
				'type'   => 'enum',
				'values' => array( 'grid', 'carousel', 'marquee', 'stacked', 'popup' ),
			),
			'shape'                     => array(
				'type'   => 'enum',
				'values' => array( 'rectangle', 'circle' ),
			),
			'size'                      => array(
				'type' => 'int',
				'min'  => 40,
				'max'  => 600,
			),
			'sizeOnTab'                 => array(
				'type' => 'int',
				'min'  => 40,
				'max'  => 600,
			),
			'sizeOnMobile'              => array(
				'type' => 'int',
				'min'  => 40,
				'max'  => 600,
			),
			'gap'                       => array(
				'type' => 'int',
				'min'  => 0,
				'max'  => 200,
			),
			'gapOnTab'                  => array(
				'type' => 'int',
				'min'  => 0,
				'max'  => 200,
			),
			'gapOnMobile'               => array(
				'type' => 'int',
				'min'  => 0,
				'max'  => 200,
			),
			'topBottomSpacing'          => array(
				'type' => 'int',
				'min'  => 0,
				'max'  => 200,
			),

			// Thumbnail.
			'appearance'                => array(
				'type'   => 'enum',
				'values' => array( 'overlay', 'title', 'none' ),
			),
			'showFallbackTitle'         => $flag,
			'hoverEffect'               => array(
				'type'   => 'enum',
				'values' => array( 'none', 'zoom-in', 'zoom-out' ),
			),
			'cardBgColor'               => $color,
			'border'                    => array(
				'type'   => 'object',
				'fields' => array(
					'width'          => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 20,
					),
					'color'          => $color,
					'radius'         => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 200,
					),
					'radiusOnTab'    => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 200,
					),
					'radiusOnMobile' => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 200,
					),
				),
			),
			'shadow'                    => array(
				'type'   => 'object',
				'fields' => array(
					'size' => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 100,
					),
				),
			),

			// Play icon.
			'showPlayButton'            => $flag,
			'playIconSize'              => array(
				'type' => 'int',
				'min'  => 16,
				'max'  => 160,
			),
			'playIconColor'             => $color,

			// View count badge.
			'showViews'                 => $flag,
			'viewsBgColor'              => $color,
			'viewsTextIconColor'        => $color,

			// Widget title.
			'widgetTitle'               => array(
				'type'   => 'object',
				'fields' => array(
					'alignment' => array(
						'type'   => 'enum',
						'values' => array( 'hidden', 'left', 'center', 'right' ),
					),
					'fontSize'  => array(
						'type' => 'int',
						'min'  => 8,
						'max'  => 96,
					),
					'color'     => $color,
				),
			),

			// Player.
			'playerAppearance'          => array(
				'type'   => 'enum',
				'values' => array( 'overlay', 'title', 'none' ),
			),
			'showPlayerFallbackTitle'   => $flag,
			'slideDirection'            => array(
				'type'   => 'enum',
				'values' => array( 'horizontal', 'vertical' ),
			),
			'playBehavior'              => array(
				'type'   => 'enum',
				'values' => array( 'click', 'autoplay', 'hover' ),
			),
			'playWithSound'             => $flag,
			'loop'                      => $flag,
			'disablePreview'            => $flag,
			'showSeekbar'               => $flag,
			'showVolumeControl'         => $flag,

			// Preview nav buttons.
			'previewBtnBgColor'         => $color,
			'previewBtnIconColor'       => $color,
			'previewBtnHoverBgColor'    => $color,
			'previewBtnHoverIconColor'  => $color,
			'previewBtnBorderRadius'    => array(
				'type' => 'int',
				'min'  => 0,
				'max'  => 100,
			),

			// Carousel nav buttons.
			'carouselBtnBgColor'        => $color,
			'carouselBtnIconColor'      => $color,
			'carouselBtnHoverBgColor'   => $color,
			'carouselBtnHoverIconColor' => $color,
			'carouselBtnBorderRadius'   => array(
				'type' => 'int',
				'min'  => 0,
				'max'  => 100,
			),
			'carouselBtnPosition'       => array(
				'type'   => 'enum',
				'values' => array( 'inside', 'outside' ),
			),

			// Product card.
			'productCardStyle'          => array(
				'type'   => 'enum',
				'values' => array( 'modern', 'classic' ),
			),
			'showRatings'               => $flag,
			'showAddToCart'             => $flag,
			'addToCartText'             => array(
				'type'   => 'text',
				'length' => 60,
			),

			// Template specific.
			'marquee'                   => array(
				'type'   => 'object',
				'fields' => array(
					'speed'        => array(
						'type' => 'int',
						'min'  => 5,
						'max'  => 200,
					),
					'direction'    => array(
						'type'   => 'enum',
						'values' => array( 'left', 'right' ),
					),
					'pauseOnHover' => $flag,
				),
			),
			'stacked'                   => array(
				'type'   => 'object',
				'fields' => array(
					'depth'  => array(
						'type' => 'int',
						'min'  => 1,
						'max'  => 10,
					),
					'offset' => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 200,
					),
					'scale'  => array(
						'type' => 'float',
						'min'  => 0.5,
						'max'  => 1.0,
					),
				),
			),
			'popup'                     => array(
				'type'   => 'object',
				'fields' => array(
					'trigger'       => array(
						'type'   => 'enum',
						'values' => array( 'load', 'delay', 'scroll' ),
					),
					'delaySeconds'  => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 120,
					),
					'scrollPercent' => array(
						'type' => 'int',
						'min'  => 0,
						'max'  => 100,
					),
					'position'      => array(
						'type'   => 'enum',
						'values' => array( 'bottom-right', 'bottom-left', 'top-right', 'top-left' ),
					),
					'size'          => array(
						'type' => 'int',
						'min'  => 80,
						'max'  => 400,
					),
					'showOnMobile'  => $flag,
				),
			),

			// Performance.
			'lazyLoad'                  => $flag,

			// Advanced.
			'customClass'               => array( 'type' => 'classes' ),
		);
	}

	/**
	 * Validate a whole style payload against the schema.
	 *
	 * The result always contains every key in the schema, so the frontend and
	 * the editor can read any style without a defined() check.
	 *
	 * @since  1.0.0
	 * @param  mixed $input Raw style object.
	 * @return array<string,mixed> The clean style object.
	 */
	public static function validate_styles( $input ) {
		return self::validate_object(
			is_array( $input ) ? $input : array(),
			self::styles_schema(),
			Wooreels_Settings::default_styles()
		);
	}

	/**
	 * Validate one object level against its slice of the schema.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  array $input    Raw values at this level.
	 * @param  array $schema   Rules at this level.
	 * @param  array $defaults Defaults at this level.
	 * @return array<string,mixed> The clean values.
	 */
	private static function validate_object( $input, $schema, $defaults ) {
		$out = array();

		foreach ( $schema as $key => $rule ) {
			$default = array_key_exists( $key, $defaults ) ? $defaults[ $key ] : null;
			$value   = array_key_exists( $key, $input ) ? $input[ $key ] : $default;

			if ( 'object' === $rule['type'] ) {
				$out[ $key ] = self::validate_object(
					is_array( $value ) ? $value : array(),
					$rule['fields'],
					is_array( $default ) ? $default : array()
				);
				continue;
			}

			$out[ $key ] = self::validate_scalar( $value, $rule, $default );
		}

		return $out;
	}

	/**
	 * Validate one scalar against its rule.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  mixed $value   Raw value.
	 * @param  array $rule    The rule from the schema.
	 * @param  mixed $fallback The default for this key.
	 * @return mixed The clean value.
	 */
	private static function validate_scalar( $value, $rule, $fallback ) {
		switch ( $rule['type'] ) {
			case 'int':
				return self::int_between( $value, $rule['min'], $rule['max'], (int) $fallback );

			case 'float':
				return self::float_between( $value, $rule['min'], $rule['max'], (float) $fallback );

			case 'bool':
				return self::bool( $value );

			case 'color':
				return self::hex_color( $value, (string) $fallback );

			case 'enum':
				return self::enum( $value, $rule['values'], (string) $fallback );

			case 'classes':
				return self::css_classes( $value );

			case 'text':
			default:
				$text = self::text( $value, isset( $rule['length'] ) ? $rule['length'] : 255 );

				return '' === $text ? (string) $fallback : $text;
		}
	}

	/**
	 * Validate a reel's links array.
	 *
	 * A link that cannot render is dropped rather than repaired: a custom link
	 * needs both text and a URL, a product link needs a product id. `btn_uuid`
	 * is preserved exactly when it is a valid v4 UUID — it is the click
	 * tracking key and has to stay stable forever — and generated when it is
	 * missing. Duplicate uuids are dropped so click counts cannot collide.
	 *
	 * @since  1.0.0
	 * @param  mixed $input Raw links array.
	 * @return array[] The clean links.
	 */
	public static function validate_links( $input ) {
		if ( ! is_array( $input ) ) {
			return array();
		}

		$out  = array();
		$seen = array();

		foreach ( $input as $link ) {
			if ( ! is_array( $link ) ) {
				continue;
			}

			$type = self::enum( isset( $link['btn_type'] ) ? $link['btn_type'] : '', self::LINK_TYPES );

			if ( '' === $type ) {
				continue;
			}

			$uuid = self::uuid( isset( $link['btn_uuid'] ) ? $link['btn_uuid'] : '' );

			if ( '' === $uuid ) {
				$uuid = wp_generate_uuid4();
			}

			if ( isset( $seen[ $uuid ] ) ) {
				continue;
			}

			$text = self::text( isset( $link['buttonText'] ) ? $link['buttonText'] : '', 120 );

			if ( 'product' === $type ) {
				$product_id = absint( isset( $link['product_id'] ) ? $link['product_id'] : 0 );

				if ( $product_id < 1 ) {
					continue;
				}

				$seen[ $uuid ] = true;

				$out[] = array(
					'btn_type'   => 'product',
					'btn_uuid'   => $uuid,
					'product_id' => $product_id,
					'buttonText' => $text,
				);

				continue;
			}

			$url = self::url( isset( $link['buttonUrl'] ) ? $link['buttonUrl'] : '' );

			if ( '' === $text || '' === $url ) {
				continue;
			}

			$seen[ $uuid ] = true;

			$out[] = array(
				'btn_type'     => 'custom',
				'btn_uuid'     => $uuid,
				'buttonText'   => $text,
				'buttonUrl'    => $url,
				'openInNewTab' => self::bool( isset( $link['openInNewTab'] ) ? $link['openInNewTab'] : true ),
				'campaignName' => self::text( isset( $link['campaignName'] ) ? $link['campaignName'] : '', 120 ),
				'customClass'  => self::css_classes( isset( $link['customClass'] ) ? $link['customClass'] : '' ),
			);
		}

		return $out;
	}

	/**
	 * Validate the media files attached to a reel.
	 *
	 * A file with no URL cannot play, so it is dropped. `file_uuid` is
	 * preserved when valid and generated when missing.
	 *
	 * @since  1.0.0
	 * @param  mixed $input Raw files array.
	 * @return array[] The clean files.
	 */
	public static function validate_files( $input ) {
		if ( ! is_array( $input ) ) {
			return array();
		}

		$out  = array();
		$seen = array();

		foreach ( $input as $file ) {
			if ( ! is_array( $file ) ) {
				continue;
			}

			$url = self::url( isset( $file['url'] ) ? $file['url'] : '' );

			if ( '' === $url ) {
				continue;
			}

			$uuid = self::uuid( isset( $file['file_uuid'] ) ? $file['file_uuid'] : '' );

			if ( '' === $uuid ) {
				$uuid = wp_generate_uuid4();
			}

			if ( isset( $seen[ $uuid ] ) ) {
				continue;
			}

			$seen[ $uuid ] = true;

			$out[] = array(
				'file_uuid'   => $uuid,
				'wp_media_id' => absint( isset( $file['wp_media_id'] ) ? $file['wp_media_id'] : 0 ),
				'url'         => $url,
				'mime_type'   => self::text( isset( $file['mime_type'] ) ? $file['mime_type'] : 'video/mp4', 100 ),
				'source'      => self::source( isset( $file['source'] ) ? $file['source'] : 'native' ),
				'provider_id' => self::text( isset( $file['provider_id'] ) ? $file['provider_id'] : '', 191 ),
				'poster_url'  => self::url( isset( $file['poster_url'] ) ? $file['poster_url'] : '' ),
				'duration'    => self::int_between( isset( $file['duration'] ) ? $file['duration'] : 0, 0, 86400, 0 ),
			);
		}

		return $out;
	}
}
