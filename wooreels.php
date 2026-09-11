<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://bestwebexpert.com/wooreels
 * @since             1.0.0
 * @package           Wooreels
 *
 * @wordpress-plugin
 * Plugin Name:       WooReels — Shoppable Video Reels for WooCommerce
 * Plugin URI:        https://bestwebexpert.com/wooreels
 * Description:       Turn product videos and customer UGC into shoppable Instagram-style reels. Grid, carousel, marquee, stacked and popup layouts, WooCommerce product tagging, CTA buttons, and built-in view/click analytics.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Razibul Hasan
 * Author URI:        https://bestwebexpert.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wooreels
 * Domain Path:       /languages
 * WC requires at least: 7.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * The plugin version, following SemVer — https://semver.org
 */
define( 'WOOREELS_VERSION', '1.0.0' );

/**
 * The database schema revision.
 *
 * Deliberately separate from WOOREELS_VERSION: bumping this re-runs dbDelta()
 * on the next load, without the site owner reactivating the plugin.
 */
define( 'WOOREELS_DB_VERSION', '1.0.0' );

/**
 * Absolute path to this file, the plugin directory, and the plugin URL.
 */
define( 'WOOREELS_FILE', __FILE__ );
define( 'WOOREELS_PATH', plugin_dir_path( WOOREELS_FILE ) );
define( 'WOOREELS_URL', plugin_dir_url( WOOREELS_FILE ) );

/**
 * Tell WooCommerce this plugin is compatible with High-Performance Order Storage.
 *
 * @since 1.0.0
 * @return void
 */
function wooreels_declare_woocommerce_compatibility() {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
			'custom_order_tables',
			WOOREELS_FILE,
			true
		);
	}
}
add_action( 'before_woocommerce_init', 'wooreels_declare_woocommerce_compatibility' );

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-wooreels-activator.php
 *
 * @since 1.0.0
 * @return void
 */
function wooreels_activate() {
	require_once WOOREELS_PATH . 'includes/class-wooreels-activator.php';
	Wooreels_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-wooreels-deactivator.php
 *
 * @since 1.0.0
 * @return void
 */
function wooreels_deactivate() {
	require_once WOOREELS_PATH . 'includes/class-wooreels-deactivator.php';
	Wooreels_Deactivator::deactivate();
}

register_activation_hook( WOOREELS_FILE, 'wooreels_activate' );
register_deactivation_hook( WOOREELS_FILE, 'wooreels_deactivate' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require WOOREELS_PATH . 'includes/class-wooreels.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 * @return   void
 */
function wooreels_run() {

	$plugin = new Wooreels();
	$plugin->run();
}
wooreels_run();
