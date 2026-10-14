<?php
/**
 * Fired during plugin activation
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
 * Fired during plugin activation.
 *
 * Creates the five ProductReels tables, records the schema revision and seeds the
 * default settings without overwriting anything a returning site already had.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Activator {

	/**
	 * Install the schema and seed settings.
	 *
	 * @since  1.0.0
	 * @since  1.1.0 Queues the first-activation redirect to the dashboard.
	 * @param  bool $network_wide Whether the plugin is being network activated.
	 * @return void
	 */
	public static function activate( $network_wide = false ) {
		require_once PRODUCTREELS_PATH . 'includes/install/class-productreels-schema.php';
		require_once PRODUCTREELS_PATH . 'includes/support/class-productreels-validator.php';
		require_once PRODUCTREELS_PATH . 'includes/data/class-productreels-settings.php';

		Productreels_Schema::install();

		update_option( 'productreels_db_version', PRODUCTREELS_DB_VERSION );

		self::seed_settings();

		flush_rewrite_rules();

		self::queue_redirect( $network_wide );

		/**
		 * Fires once ProductReels has finished activating.
		 *
		 * @since 1.0.0
		 */
		do_action( 'productreels_activated' );
	}

	/**
	 * Ask the next admin page load to open the dashboard, the first time only.
	 *
	 * Productreels_Admin::redirect_after_activation() does the redirect. A
	 * short expiry keeps a WP-CLI or network activation from redirecting
	 * someone much later.
	 *
	 * @since  1.1.0
	 * @access private
	 * @param  bool $network_wide Whether the plugin is being network activated.
	 * @return void
	 */
	private static function queue_redirect( $network_wide ) {
		require_once PRODUCTREELS_PATH . 'admin/class-productreels-admin.php';

		if ( $network_wide || ( defined( 'WP_CLI' ) && WP_CLI ) || get_option( Productreels_Admin::ACTIVATION_REDIRECTED ) ) {
			return;
		}

		set_transient( Productreels_Admin::ACTIVATION_REDIRECT, 1, 30 );
	}

	/**
	 * Write the defaults, keeping any value the site has already chosen.
	 *
	 * Productreels_Settings owns the default values; this only makes sure the
	 * option exists from the first page load after activation.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private static function seed_settings() {
		$existing = get_option( Productreels_Settings::OPTION, array() );

		if ( ! is_array( $existing ) ) {
			$existing = array();
		}

		update_option( Productreels_Settings::OPTION, Productreels_Settings::sanitize( array_merge( Productreels_Settings::defaults(), $existing ) ) );
	}
}
