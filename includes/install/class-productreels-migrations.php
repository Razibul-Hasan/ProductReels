<?php
/**
 * Schema migration runner.
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
 * Keeps the database in step with PRODUCTREELS_DB_VERSION.
 *
 * The schema revision is stored in productreels_db_version, separately from
 * PRODUCTREELS_VERSION, so bumping the schema re-runs dbDelta() on the next load
 * without the site owner having to deactivate and reactivate the plugin.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/install
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Migrations {

	/**
	 * The option holding the installed schema revision.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const OPTION = 'productreels_db_version';

	/**
	 * The revision assumed when the option has never been written.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const UNINSTALLED = '0.0.0';

	/**
	 * The ordered list of migration callbacks, keyed by the revision they take
	 * the database to.
	 *
	 * Order matters: a site upgrading across several releases runs every
	 * pending entry, oldest first.
	 *
	 * @since  1.0.0
	 * @return array<string,callable> Revision => callback.
	 */
	protected static function migrations() {
		return array(
			'1.0.0' => array( __CLASS__, 'migrate_1_0_0' ),
		);
	}

	/**
	 * Bring the database up to PRODUCTREELS_DB_VERSION when it is behind.
	 *
	 * Runs on init at priority 5, before anything reads a ProductReels table.
	 * Returns early during a WordPress install, when there is no site to
	 * upgrade yet.
	 *
	 * @since  1.0.0
	 * @return bool Whether a migration run happened.
	 */
	public static function maybe_upgrade() {
		if ( defined( 'WP_INSTALLING' ) && WP_INSTALLING ) {
			return false;
		}

		$installed = (string) get_option( self::OPTION, self::UNINSTALLED );

		if ( '' === $installed ) {
			$installed = self::UNINSTALLED;
		}

		if ( version_compare( $installed, PRODUCTREELS_DB_VERSION, '>=' ) ) {
			return false;
		}

		// dbDelta() first: it creates anything missing and widens anything that
		// changed, so migration callbacks can assume the current columns exist.
		Productreels_Schema::install();

		foreach ( self::migrations() as $version => $callback ) {
			if ( version_compare( $installed, $version, '>=' ) ) {
				continue;
			}

			try {
				call_user_func( $callback );
			} catch ( Throwable $e ) {
				error_log( sprintf( 'ProductReels: migration to %1$s failed: %2$s', $version, $e->getMessage() ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

				// Leave the option where it was so the run is retried next load.
				return false;
			}
		}

		update_option( self::OPTION, PRODUCTREELS_DB_VERSION );

		/**
		 * Fires after the database has been migrated to a new schema revision.
		 *
		 * @since 1.0.0
		 * @param string $to   The revision the database is now at.
		 * @param string $from The revision it was at before this run.
		 */
		do_action( 'productreels_migrated', PRODUCTREELS_DB_VERSION, $installed );

		return true;
	}

	/**
	 * Migration to schema revision 1.0.0.
	 *
	 * The initial revision needs no data changes — Productreels_Schema::install()
	 * has already created the tables. It exists so the ordered framework above
	 * has a first entry to walk.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	protected static function migrate_1_0_0() {
		// Nothing to migrate: 1.0.0 is the initial schema.
	}
}
