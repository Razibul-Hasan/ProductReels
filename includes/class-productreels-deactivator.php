<?php
/**
 * Fired during plugin deactivation
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Fired during plugin deactivation.
 *
 * Clears caches and rewrite rules only. Deactivation never touches a widget, a
 * reel, a setting or a counter — reactivating restores the site exactly as it
 * was. Data is destroyed only by uninstall.php, and only on opt-in.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Deactivator {

	/**
	 * Flush rewrite rules and drop this plugin's transients.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public static function deactivate() {
		require_once PRODUCTREELS_PATH . 'includes/install/class-productreels-schema.php';

		Productreels_Schema::delete_transients();

		flush_rewrite_rules();

		/**
		 * Fires once ProductReels has finished deactivating.
		 *
		 * @since 1.0.0
		 */
		do_action( 'productreels_deactivated' );
	}
}
