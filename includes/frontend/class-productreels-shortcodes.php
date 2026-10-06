<?php
/**
 * The [productreels] and [productreels_reel] shortcodes.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/frontend
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Prints mount nodes; the public bundle does the rest.
 *
 * No server-rendered markup beyond the node — the React renderer paints the
 * widget from `GET /render/:id`, which is the same payload the editor's
 * preview is built from, so the two can never disagree. Printing a node also
 * flags the request, and that flag is what gets the public bundle enqueued:
 * a page with no reels loads no ProductReels assets at all.
 *
 * The block and the Elementor widget both render through widget_markup(),
 * so every way of placing a widget produces exactly the same HTML.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/frontend
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Shortcodes {

	/**
	 * Register both shortcodes.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register() {
		add_shortcode( 'productreels', array( $this, 'widget' ) );
		add_shortcode( 'productreels_reel', array( $this, 'reel' ) );
	}

	/**
	 * [productreels id="12"]
	 *
	 * @since  1.0.0
	 * @param  array|string $atts Shortcode attributes.
	 * @return string The mount node, or nothing.
	 */
	public function widget( $atts ) {
		$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'productreels' );

		return self::widget_markup( absint( $atts['id'] ) );
	}

	/**
	 * [productreels_reel id="7"] — one reel, no widget chrome.
	 *
	 * @since  1.0.0
	 * @param  array|string $atts Shortcode attributes.
	 * @return string The mount node, or nothing.
	 */
	public function reel( $atts ) {
		$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'productreels_reel' );

		return self::reel_markup( absint( $atts['id'] ) );
	}

	/**
	 * The mount node for a widget.
	 *
	 * @since  1.0.0
	 * @param  int $widget_id Widget id.
	 * @return string The markup, an admin-only notice, or an empty string.
	 */
	public static function widget_markup( $widget_id ) {
		$widget_id = absint( $widget_id );
		$widgets   = new Productreels_Widgets();
		$summary   = $widget_id > 0 ? $widgets->summary( $widget_id ) : null;

		if ( null === $summary ) {
			return self::missing_notice(
				$widget_id > 0
					/* translators: %d: widget id. */
					? sprintf( __( 'ProductReels: widget #%d was not found.', 'productreels' ), $widget_id )
					: __( 'ProductReels: the shortcode needs a widget id, e.g. [productreels id="1"].', 'productreels' )
			);
		}

		Productreels_Public::request_assets();

		return sprintf(
			'<div class="productreels-embed" data-widget-id="%1$d" data-version="%2$s" data-name="%3$s"></div>',
			$summary['id'],
			esc_attr( Productreels_Render_Cache::version( $summary['updated_at'] ) ),
			esc_attr( $summary['name'] )
		);
	}

	/**
	 * The mount node for a single reel.
	 *
	 * @since  1.0.0
	 * @param  int $reel_id Reel id.
	 * @return string The markup, an admin-only notice, or an empty string.
	 */
	public static function reel_markup( $reel_id ) {
		$reel_id = absint( $reel_id );
		$reels   = new Productreels_Reels();

		if ( $reel_id < 1 || ! $reels->exists( $reel_id ) ) {
			return self::missing_notice(
				$reel_id > 0
					/* translators: %d: reel id. */
					? sprintf( __( 'ProductReels: reel #%d was not found.', 'productreels' ), $reel_id )
					: __( 'ProductReels: the shortcode needs a reel id, e.g. [productreels_reel id="1"].', 'productreels' )
			);
		}

		Productreels_Public::request_assets();

		return sprintf(
			'<div class="productreels-embed productreels-embed--single" data-reel-id="%1$d" data-version="%2$s"></div>',
			$reel_id,
			esc_attr( Productreels_Render_Cache::version( 'reel' ) )
		);
	}

	/**
	 * Nothing for visitors; a short, plain note for someone who can fix it.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  string $message What went wrong.
	 * @return string The notice, or an empty string.
	 */
	private static function missing_notice( $message ) {
		if ( ! current_user_can( Productreels_Rest_Controller::CAPABILITY ) ) {
			return '';
		}

		return sprintf(
			'<p class="productreels-notice" style="padding:8px 12px;border:1px dashed #d1d5db;border-radius:6px;font-size:13px;color:#6b7280;">%s</p>',
			esc_html( $message )
		);
	}
}
