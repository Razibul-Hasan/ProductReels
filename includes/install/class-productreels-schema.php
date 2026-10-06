<?php
/**
 * Database schema definition, installer and teardown.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/install
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Owns every ProductReels table: its short key, its real prefixed name, its DDL
 * and its lifecycle.
 *
 * This is the only place in the plugin that knows a table's real name. Every
 * other class asks for one through Productreels_Schema::table(), which resolves it
 * from a hardcoded map — a table name can therefore never originate in a
 * request payload.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/install
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Schema {

	/**
	 * Unprefixed table names, keyed by the short key used across the plugin.
	 *
	 * @since 1.0.0
	 * @var   array<string,string>
	 */
	const TABLES = array(
		'widgets'      => 'productreels_widgets',
		'reels'        => 'productreels_reels',
		'widget_reels' => 'productreels_widget_reels',
		'files'        => 'productreels_files',
		'clicks'       => 'productreels_clicks',
	);

	/**
	 * The WordPress database abstraction object.
	 *
	 * Schema owns data-definition statements, so it is the one place outside
	 * the repository layer that reaches for $wpdb.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return wpdb The WordPress database object.
	 */
	private static function db() {
		global $wpdb;
		return $wpdb;
	}

	/**
	 * Every table this plugin owns, as fully prefixed names.
	 *
	 * @since  1.0.0
	 * @return array<string,string> Short key => prefixed table name.
	 */
	public static function tables() {
		$tables = array();

		foreach ( self::TABLES as $key => $name ) {
			$tables[ $key ] = self::db()->prefix . $name;
		}

		return $tables;
	}

	/**
	 * Resolve one short table key to its real, prefixed name.
	 *
	 * @since  1.0.0
	 * @param  string $name Short table key, e.g. 'widgets'.
	 * @throws InvalidArgumentException When the key is not one this plugin owns.
	 * @return string The prefixed table name.
	 */
	public static function table( $name ) {
		if ( ! isset( self::TABLES[ $name ] ) ) {
			throw new InvalidArgumentException( 'Unknown ProductReels table key: ' . esc_html( (string) $name ) );
		}

		return self::db()->prefix . self::TABLES[ $name ];
	}

	/**
	 * The CREATE TABLE statement for every table, formatted for dbDelta().
	 *
	 * @since  1.0.0
	 * @return array<string,string> Short key => CREATE TABLE statement.
	 */
	public static function statements() {
		$charset_collate = self::db()->get_charset_collate();
		$tables          = self::tables();
		$sql             = array();

		$sql['widgets'] = "CREATE TABLE {$tables['widgets']} (
	id bigint unsigned NOT NULL AUTO_INCREMENT,
	slug varchar(191) NOT NULL,
	name varchar(191) NOT NULL,
	styles_json longtext NULL,
	created_by bigint unsigned NULL,
	created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY  (id),
	UNIQUE KEY uq_slug (slug)
) {$charset_collate};";

		$sql['reels'] = "CREATE TABLE {$tables['reels']} (
	id bigint unsigned NOT NULL AUTO_INCREMENT,
	reel_uuid char(36) NOT NULL,
	title varchar(255) NULL,
	thumbnail text NULL,
	links longtext NULL,
	view_count bigint unsigned NOT NULL DEFAULT 0,
	created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY  (id),
	UNIQUE KEY uq_reel_uuid (reel_uuid)
) {$charset_collate};";

		$sql['widget_reels'] = "CREATE TABLE {$tables['widget_reels']} (
	id bigint unsigned NOT NULL AUTO_INCREMENT,
	widget_id bigint unsigned NOT NULL,
	reel_id bigint unsigned NOT NULL,
	sort_order int unsigned NOT NULL DEFAULT 0,
	created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY  (id),
	UNIQUE KEY uq_widget_reel (widget_id,reel_id),
	KEY idx_widget (widget_id),
	KEY idx_reel (reel_id),
	KEY idx_widget_sort (widget_id,sort_order)
) {$charset_collate};";

		$sql['files'] = "CREATE TABLE {$tables['files']} (
	id bigint unsigned NOT NULL AUTO_INCREMENT,
	reel_id bigint unsigned NOT NULL,
	file_uuid char(36) NOT NULL,
	wp_media_id bigint unsigned NULL,
	url text NOT NULL,
	mime_type varchar(100) NOT NULL,
	source varchar(32) NOT NULL DEFAULT 'native',
	provider_id varchar(191) NULL,
	poster_url text NULL,
	duration int unsigned NULL,
	created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY  (id),
	UNIQUE KEY uq_file_uuid (file_uuid),
	KEY idx_reel (reel_id)
) {$charset_collate};";

		$sql['clicks'] = "CREATE TABLE {$tables['clicks']} (
	id bigint unsigned NOT NULL AUTO_INCREMENT,
	widget_id bigint unsigned NOT NULL,
	reel_id bigint unsigned NOT NULL,
	reel_title varchar(255) NULL,
	btn_uuid char(36) NOT NULL,
	button_text varchar(255) NULL,
	button_url text NULL,
	campaign_name varchar(191) NULL,
	click_count bigint unsigned NOT NULL DEFAULT 0,
	updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY  (id),
	UNIQUE KEY uq_btn (widget_id,btn_uuid),
	KEY idx_widget (widget_id)
) {$charset_collate};";

		return $sql;
	}

	/**
	 * Create or upgrade every table.
	 *
	 * Running dbDelta() is idempotent: against an up-to-date database it is a
	 * no-op. It deliberately never writes productreels_db_version — the activator
	 * and the migration runner own that option.
	 *
	 * @since  1.0.0
	 * @return array<string,array> dbDelta() report, keyed by short table key.
	 */
	public static function install() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$results = array();

		foreach ( self::statements() as $key => $statement ) {
			$results[ $key ] = dbDelta( $statement );
		}

		/**
		 * Fires after the ProductReels tables have been created or upgraded.
		 *
		 * @since 1.0.0
		 * @param array<string,array> $results dbDelta() report, keyed by table key.
		 */
		do_action( 'productreels_schema_installed', $results );

		return $results;
	}

	/**
	 * Drop every table this plugin owns.
	 *
	 * Only ever called from uninstall.php, and only when the site owner has
	 * opted in through the delete_data_on_uninstall setting.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public static function drop_tables() {
		$wpdb = self::db();

		foreach ( self::tables() as $table ) {
			// Table names come from the hardcoded map above; escaped anyway so
			// the query never trusts anything but itself.
			$table = esc_sql( $table );

			$wpdb->query( "DROP TABLE IF EXISTS `{$table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
		}
	}

	/**
	 * Delete every transient this plugin has written.
	 *
	 * Options are looked up directly because WordPress has no API for finding
	 * transients by prefix, but each one is removed through delete_transient()
	 * so an external object cache is invalidated too.
	 *
	 * @since  1.0.0
	 * @return int Number of transients deleted.
	 */
	public static function delete_transients() {
		$wpdb = self::db();

		$names = $wpdb->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_productreels_' ) . '%',
				$wpdb->esc_like( '_transient_timeout_productreels_' ) . '%'
			)
		);

		$deleted = 0;

		foreach ( (array) $names as $option_name ) {
			$key = preg_replace( '/^_transient_(timeout_)?/', '', $option_name );

			if ( delete_transient( $key ) ) {
				++$deleted;
			}
		}

		return $deleted;
	}
}
