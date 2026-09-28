<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Removes everything ProductReels ever wrote — the five tables, its options and
 * every productreels_* transient — but only when the site owner has turned on
 * "Delete all plugin data on uninstall" in Settings. That flag is off by
 * default, so an accidental delete of the plugin never costs anyone their
 * reels.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$productreels_settings = get_option( 'productreels_settings', array() );

if ( ! is_array( $productreels_settings ) || empty( $productreels_settings['delete_data_on_uninstall'] ) ) {
	// Opt-in not given: leave every widget, reel, file and counter untouched.
	return;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/install/class-productreels-schema.php';

Productreels_Schema::drop_tables();
Productreels_Schema::delete_transients();

delete_option( 'productreels_settings' );
delete_option( 'productreels_db_version' );
delete_option( 'productreels_render_generation' );
