<?php
/**
 * Registers every ProductReels REST controller.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The single list of controllers the plugin exposes.
 *
 * Hooked to rest_api_init through the loader, so the plugin's whole API surface
 * is visible from one place.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Rest {

	/**
	 * Register every controller's routes.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_routes() {
		foreach ( $this->controllers() as $controller ) {
			$controller->register_routes();
		}

		/**
		 * Fires after ProductReels has registered its REST routes.
		 *
		 * @since 1.0.0
		 */
		do_action( 'productreels_rest_routes_registered' );
	}

	/**
	 * Every controller, in registration order.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return Productreels_Rest_Controller[] The controllers.
	 */
	private function controllers() {
		return array(
			new Productreels_Rest_Widgets(),
			new Productreels_Rest_Reels(),
			new Productreels_Rest_Products(),
			new Productreels_Rest_Tracking(),
			new Productreels_Rest_Settings(),
		);
	}
}
