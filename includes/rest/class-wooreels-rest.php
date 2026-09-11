<?php
/**
 * Registers every WooReels REST controller.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/rest
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
 * @package    Wooreels
 * @subpackage Wooreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Rest {

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
		 * Fires after WooReels has registered its REST routes.
		 *
		 * @since 1.0.0
		 */
		do_action( 'wooreels_rest_routes_registered' );
	}

	/**
	 * Every controller, in registration order.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return Wooreels_Rest_Controller[] The controllers.
	 */
	private function controllers() {
		return array(
			new Wooreels_Rest_Widgets(),
			new Wooreels_Rest_Reels(),
			new Wooreels_Rest_Files(),
			new Wooreels_Rest_Products(),
			new Wooreels_Rest_Tracking(),
			new Wooreels_Rest_Settings(),
		);
	}
}
