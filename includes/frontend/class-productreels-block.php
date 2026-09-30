<?php
/**
 * The productreels/reels Gutenberg block.
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
 * Registers the block from block/block.json and renders it dynamically.
 *
 * The block saves nothing but a widget id; on the frontend it prints the
 * same mount node as the shortcode, through the same function, so a block
 * and a shortcode pointing at one widget are indistinguishable in the DOM.
 * The editor script is registered under the `productreels-block` handle and
 * enqueued by WordPress only on block-editor screens.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/frontend
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Block {

	/**
	 * The editor script and style handle.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const HANDLE = 'productreels-block';

	/**
	 * Register the editor assets and the block type.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		$asset_file = PRODUCTREELS_PATH . 'block/dist/productreels-block.asset.php';

		if ( file_exists( $asset_file ) ) {
			$asset = require $asset_file;

			wp_register_script(
				self::HANDLE,
				PRODUCTREELS_URL . 'block/dist/productreels-block.js',
				$asset['dependencies'],
				$asset['version'],
				true
			);

			wp_set_script_translations( self::HANDLE, 'productreels', PRODUCTREELS_PATH . 'languages' );

			wp_add_inline_script(
				self::HANDLE,
				'window.productreelsBlock = ' . wp_json_encode(
					array(
						'adminUrl'  => esc_url_raw( admin_url( 'admin.php?page=productreels' ) ),
						// An editor may place a widget without being able to open the app.
						'canManage' => current_user_can( Productreels_Rest_Controller::CAPABILITY ),
					)
				) . ';',
				'before'
			);

			wp_register_style(
				self::HANDLE,
				PRODUCTREELS_URL . 'block/dist/productreels-block.css',
				array(),
				$asset['version']
			);

			wp_style_add_data( self::HANDLE, 'rtl', 'replace' );
		}

		register_block_type(
			PRODUCTREELS_PATH . 'block',
			array(
				'render_callback' => array( $this, 'render' ),
			)
		);
	}

	/**
	 * Print the mount node for the chosen widget.
	 *
	 * @since  1.0.0
	 * @param  array $attributes Block attributes.
	 * @return string The markup.
	 */
	public function render( $attributes ) {
		$widget_id = isset( $attributes['widgetId'] ) ? absint( $attributes['widgetId'] ) : 0;

		if ( $widget_id < 1 ) {
			return '';
		}

		$markup = Productreels_Shortcodes::widget_markup( $widget_id );

		if ( '' === $markup ) {
			return '';
		}

		$wrapper = function_exists( 'get_block_wrapper_attributes' ) ? get_block_wrapper_attributes() : 'class="wp-block-productreels-reels"';

		return sprintf( '<div %1$s>%2$s</div>', $wrapper, $markup );
	}
}
