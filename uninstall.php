<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Removes everything WooReels ever wrote — the five tables, both options and
 * every wooreels_* transient — but only when the site owner has turned on
 * "Delete all plugin data on uninstall" in Settings. That flag is off by
 * default, so an accidental delete of the plugin never costs anyone their
 * reels.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$wooreels_settings = get_option( 'wooreels_settings', array() );

if ( ! is_array( $wooreels_settings ) || empty( $wooreels_settings['delete_data_on_uninstall'] ) ) {
	// Opt-in not given: leave every widget, reel, file and counter untouched.
	return;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/install/class-wooreels-schema.php';

Wooreels_Schema::drop_tables();
Wooreels_Schema::delete_transients();

delete_option( 'wooreels_settings' );
delete_option( 'wooreels_db_version' );
