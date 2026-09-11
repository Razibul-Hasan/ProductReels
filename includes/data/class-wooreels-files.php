<?php
/**
 * The media files attached to a reel.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/data
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Reads and writes rows in the files table.
 *
 * Files belong to exactly one reel and are replaced wholesale when that reel is
 * saved, so there is no per-file update: the reel owns the set.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/data
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Files extends Wooreels_Repository {

	/**
	 * The table this repository owns.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string The short table key.
	 */
	protected function table_key() {
		return 'files';
	}

	/**
	 * Column => cast for the files table.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return array<string,string> The cast map.
	 */
	protected function casts() {
		return array(
			'id'          => self::CAST_INT,
			'reel_id'     => self::CAST_INT,
			'file_uuid'   => self::CAST_STRING,
			'wp_media_id' => self::CAST_INT,
			'url'         => self::CAST_STRING,
			'mime_type'   => self::CAST_STRING,
			'source'      => self::CAST_STRING,
			'provider_id' => self::CAST_STRING,
			'poster_url'  => self::CAST_STRING,
			'duration'    => self::CAST_INT,
			'created_at'  => self::CAST_DATETIME,
			'updated_at'  => self::CAST_DATETIME,
		);
	}

	/**
	 * Read one file row.
	 *
	 * @since  1.0.0
	 * @param  int $id File row id.
	 * @return array|null The file, or null when it does not exist.
	 */
	public function find( $id ) {
		return $this->find_row( $id );
	}

	/**
	 * Every file on one reel, in insertion order.
	 *
	 * @since  1.0.0
	 * @param  int $reel_id Reel id.
	 * @return array[] The files.
	 */
	public function for_reel( $reel_id ) {
		$table = $this->table();

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT * FROM `{$table}` WHERE reel_id = %d ORDER BY id ASC", (int) $reel_id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		return $this->cast_rows( $rows );
	}

	/**
	 * Every file on a set of reels, in one query, grouped by reel.
	 *
	 * This is what keeps widget hydration off the N+1 path: the caller loads
	 * all the reels, then all their files, and joins the two in PHP.
	 *
	 * @since  1.0.0
	 * @param  int[] $reel_ids Reel ids.
	 * @return array<int,array[]> Reel id => its files.
	 */
	public function for_reels( $reel_ids ) {
		$reel_ids = array_values( array_unique( array_filter( array_map( 'absint', (array) $reel_ids ) ) ) );

		if ( empty( $reel_ids ) ) {
			return array();
		}

		$table        = $this->table();
		$placeholders = $this->placeholders( count( $reel_ids ) );

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM `{$table}` WHERE reel_id IN ({$placeholders}) ORDER BY reel_id ASC, id ASC",
				$reel_ids
			),
			ARRAY_A
		);

		$grouped = array();

		foreach ( $this->cast_rows( $rows ) as $file ) {
			$grouped[ $file['reel_id'] ][] = $file;
		}

		return $grouped;
	}

	/**
	 * Replace every file on a reel with a new set.
	 *
	 * Expects files that have already been through
	 * Wooreels_Validator::validate_files().
	 *
	 * @since  1.0.0
	 * @param  int     $reel_id Reel id.
	 * @param  array[] $files   The new files.
	 * @return int How many files were written.
	 */
	public function replace_for_reel( $reel_id, $files ) {
		$reel_id = (int) $reel_id;

		$this->delete_for_reel( $reel_id );

		$written = 0;

		foreach ( (array) $files as $file ) {
			$file['reel_id'] = $reel_id;

			if ( $this->insert_row( $file ) > 0 ) {
				++$written;
			}
		}

		return $written;
	}

	/**
	 * Delete every file on a reel.
	 *
	 * @since  1.0.0
	 * @param  int $reel_id Reel id.
	 * @return int How many rows were deleted.
	 */
	public function delete_for_reel( $reel_id ) {
		return (int) $this->db()->delete( $this->table(), array( 'reel_id' => (int) $reel_id ), array( '%d' ) );
	}
}
