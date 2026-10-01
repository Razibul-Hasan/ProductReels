<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link             https://wordpress.org/plugins/productreels
 * @since             1.0.0
 * @package           Productreels
 *
 * @wordpress-plugin
 * Plugin Name:       ProductReels
 * Plugin URI:        https://wordpress.org/plugins/productreels
 * Description:       Turn product videos and customer UGC into shoppable Instagram-style reels. Grid, carousel, marquee, stacked and popup layouts, WooCommerce product tagging, CTA buttons, and built-in view/click analytics.
 * Version:           1.0.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            bestwpexpert
 * Author URI:        https://bestwebexpert.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       productreels
 * Domain Path:       /languages
 * WC requires at least: 7.0
 */

// If this file is called directly, abort.
if (! defined('WPINC')) {
	die;
}

/**
 * The plugin version, following SemVer — https://semver.org
 */
define('PRODUCTREELS_VERSION', '1.0.0');

/**
 * The database schema revision.
 *
 * Deliberately separate from PRODUCTREELS_VERSION: bumping this re-runs dbDelta()
 * on the next load, without the site owner reactivating the plugin.
 */
define('PRODUCTREELS_DB_VERSION', '1.0.0');

/**
 * Absolute path to this file, the plugin directory, and the plugin URL.
 */
define('PRODUCTREELS_FILE', __FILE__);
define('PRODUCTREELS_PATH', plugin_dir_path(PRODUCTREELS_FILE));
define('PRODUCTREELS_URL', plugin_dir_url(PRODUCTREELS_FILE));

/**
 * Tell WooCommerce this plugin is compatible with High-Performance Order Storage.
 *
 * @since 1.0.0
 * @return void
 */
function productreels_declare_woocommerce_compatibility()
{
	if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
			'custom_order_tables',
			PRODUCTREELS_FILE,
			true
		);
	}
}
add_action('before_woocommerce_init', 'productreels_declare_woocommerce_compatibility');

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-productreels-activator.php
 *
 * @since 1.0.0
 * @return void
 */
function productreels_activate()
{
	require_once PRODUCTREELS_PATH . 'includes/class-productreels-activator.php';
	Productreels_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-productreels-deactivator.php
 *
 * @since 1.0.0
 * @return void
 */
function productreels_deactivate()
{
	require_once PRODUCTREELS_PATH . 'includes/class-productreels-deactivator.php';
	Productreels_Deactivator::deactivate();
}

register_activation_hook(PRODUCTREELS_FILE, 'productreels_activate');
register_deactivation_hook(PRODUCTREELS_FILE, 'productreels_deactivate');

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require PRODUCTREELS_PATH . 'includes/class-productreels.php';

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
function productreels_run()
{
	$plugin = new Productreels();
	$plugin->run();
}
productreels_run();
