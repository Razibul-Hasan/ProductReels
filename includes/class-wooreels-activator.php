<?php
/**
 * Fired during plugin activation
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Fired during plugin activation.
 *
 * Creates the five WooReels tables, records the schema revision and seeds the
 * default settings without overwriting anything a returning site already had.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Activator {

	/**
	 * Install the schema and seed settings.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public static function activate() {
		require_once WOOREELS_PATH . 'includes/install/class-wooreels-schema.php';
		require_once WOOREELS_PATH . 'includes/support/class-wooreels-validator.php';
		require_once WOOREELS_PATH . 'includes/data/class-wooreels-settings.php';

		Wooreels_Schema::install();

		update_option( 'wooreels_db_version', WOOREELS_DB_VERSION );

		self::seed_settings();

		flush_rewrite_rules();

		/**
		 * Fires once WooReels has finished activating.
		 *
		 * @since 1.0.0
		 */
		do_action( 'wooreels_activated' );
	}

	/**
	 * Write the defaults, keeping any value the site has already chosen.
	 *
	 * Wooreels_Settings owns the default values; this only makes sure the
	 * option exists from the first page load after activation.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private static function seed_settings() {
		$existing = get_option( Wooreels_Settings::OPTION, array() );

		if ( ! is_array( $existing ) ) {
			$existing = array();
		}

		update_option( Wooreels_Settings::OPTION, Wooreels_Settings::sanitize( array_merge( Wooreels_Settings::defaults(), $existing ) ) );
	}
}
