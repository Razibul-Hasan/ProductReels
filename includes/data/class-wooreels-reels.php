<?php
/**
 * Reels: one video, a title, a poster and its links.
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
 * Reads and writes reels.
 *
 * A reel is reusable and lives independently of any widget: deleting a widget
 * never deletes a reel, and deleting a reel removes its files and its pivot
 * rows but leaves the click history that references it, so a widget's reported
 * numbers do not silently change when a reel is retired.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/data
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Reels extends Wooreels_Repository {

	/**
	 * The files repository, created on first use.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Wooreels_Files|null
	 */
	private $files = null;

	/**
	 * The table this repository owns.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string The short table key.
	 */
	protected function table_key() {
		return 'reels';
	}

	/**
	 * Column => cast for the reels table.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return array<string,string> The cast map.
	 */
	protected function casts() {
		return array(
			'id'         => self::CAST_INT,
			'reel_uuid'  => self::CAST_STRING,
			'title'      => self::CAST_STRING,
			'thumbnail'  => self::CAST_STRING,
			'links'      => self::CAST_JSON,
			'view_count' => self::CAST_INT,
			'created_at' => self::CAST_DATETIME,
			'updated_at' => self::CAST_DATETIME,
		);
	}

	/**
	 * Columns a reels list may be sorted by.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string[] Sortable column names.
	 */
	protected function sortable() {
		return array( 'id', 'title', 'view_count', 'created_at' );
	}

	/**
	 * The files repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return Wooreels_Files The repository.
	 */
	private function files() {
		if ( null === $this->files ) {
			$this->files = new Wooreels_Files();
		}

		return $this->files;
	}

	/**
	 * A page of reels, each carrying its first file.
	 *
	 * `exclude_widget` returns the reels that are *not* already in that widget,
	 * which is what the editor's "add reels" picker lists.
	 *
	 * @since  1.0.0
	 * @param  array $args search, exclude_widget, page, per_page, orderby, order.
	 * @return array{items:array,total:int,pages:int,page:int,per_page:int} The page.
	 */
	public function paginate( $args = array() ) {
		list( $page, $per_page, $offset ) = $this->sanitize_pagination( $args );

		list( $column, $direction ) = $this->sanitize_order(
			isset( $args['orderby'] ) ? $args['orderby'] : 'id',
			isset( $args['order'] ) ? $args['order'] : 'DESC'
		);

		$table  = $this->table();
		$where  = array( '1=1' );
		$values = array();

		$search = isset( $args['search'] ) ? trim( (string) $args['search'] ) : '';

		if ( '' !== $search ) {
			$where[]  = 'title LIKE %s';
			$values[] = '%' . $this->db()->esc_like( $search ) . '%';
		}

		$exclude_widget = isset( $args['exclude_widget'] ) ? absint( $args['exclude_widget'] ) : 0;

		if ( $exclude_widget > 0 ) {
			$pivot    = Wooreels_Schema::table( 'widget_reels' );
			$where[]  = "id NOT IN ( SELECT reel_id FROM `{$pivot}` WHERE widget_id = %d )";
			$values[] = $exclude_widget;
		}

		$where_sql = implode( ' AND ', $where );

		$count_sql = "SELECT COUNT(*) FROM `{$table}` WHERE {$where_sql}";
		$total     = (int) $this->db()->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			empty( $values ) ? $count_sql : $this->db()->prepare( $count_sql, $values ) // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);

		$list_sql = "SELECT * FROM `{$table}` WHERE {$where_sql} ORDER BY {$column} {$direction}, id DESC LIMIT %d OFFSET %d";

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( $list_sql, array_merge( $values, array( $per_page, $offset ) ) ), // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		$items = $this->attach_first_file( $this->cast_rows( $rows ) );

		return $this->paginated( $items, $total, $page, $per_page );
	}

	/**
	 * One reel with every file it owns.
	 *
	 * @since  1.0.0
	 * @param  int $id Reel id.
	 * @return array|null The reel, or null when it does not exist.
	 */
	public function find( $id ) {
		$reel = $this->find_row( $id );

		if ( null === $reel ) {
			return null;
		}

		$reel['files'] = $this->files()->for_reel( $reel['id'] );

		return $reel;
	}

	/**
	 * Several reels by id, hydrated with their files, in one pass.
	 *
	 * Two queries whatever the number of reels: one for the rows, one for the
	 * files.
	 *
	 * @since  1.0.0
	 * @param  int[] $ids Reel ids.
	 * @return array<int,array> Reel id => the hydrated reel.
	 */
	public function find_many( $ids ) {
		$ids = array_values( array_unique( array_filter( array_map( 'absint', (array) $ids ) ) ) );

		if ( empty( $ids ) ) {
			return array();
		}

		$table        = $this->table();
		$placeholders = $this->placeholders( count( $ids ) );

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT * FROM `{$table}` WHERE id IN ({$placeholders})", $ids ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		$reels = $this->cast_rows( $rows );
		$files = $this->files()->for_reels( wp_list_pluck( $reels, 'id' ) );

		$keyed = array();

		foreach ( $reels as $reel ) {
			$reel['files']        = isset( $files[ $reel['id'] ] ) ? $files[ $reel['id'] ] : array();
			$keyed[ $reel['id'] ] = $reel;
		}

		return $keyed;
	}

	/**
	 * Create a reel and its files in one transaction.
	 *
	 * @since  1.0.0
	 * @param  array $data title, thumbnail, links[], files[].
	 * @return array|null The new reel, or null when the write failed.
	 */
	public function create( $data ) {
		$title = Wooreels_Validator::text( isset( $data['title'] ) ? $data['title'] : '', 255 );

		if ( '' === $title ) {
			$title = $this->next_untitled_title();
		}

		$links = Wooreels_Validator::validate_links( isset( $data['links'] ) ? $data['links'] : array() );
		$files = Wooreels_Validator::validate_files( isset( $data['files'] ) ? $data['files'] : array() );

		$this->begin_transaction();

		try {
			$id = $this->insert_row(
				array(
					'reel_uuid' => $this->uuid(),
					'title'     => $title,
					'thumbnail' => Wooreels_Validator::url( isset( $data['thumbnail'] ) ? $data['thumbnail'] : '' ),
					'links'     => $links,
				)
			);

			if ( $id < 1 ) {
				$this->abort( 'Insert into the reels table returned no id.' );
			}

			$this->files()->replace_for_reel( $id, $files );

			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: creating a reel failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return null;
		}

		/**
		 * Fires after a reel has been created.
		 *
		 * @since 1.0.0
		 * @param int $id The new reel id.
		 */
		do_action( 'wooreels_reel_created', $id );

		return $this->find( $id );
	}

	/**
	 * Update a reel, replacing its files wholesale when files are supplied.
	 *
	 * @since  1.0.0
	 * @param  int   $id   Reel id.
	 * @param  array $data Any of title, thumbnail, links[], files[].
	 * @return array|null The updated reel, or null when it does not exist or the write failed.
	 */
	public function update( $id, $data ) {
		$id = (int) $id;

		if ( ! $this->exists( $id ) ) {
			return null;
		}

		$fields = array();

		if ( array_key_exists( 'title', $data ) ) {
			$title = Wooreels_Validator::text( $data['title'], 255 );

			if ( '' !== $title ) {
				$fields['title'] = $title;
			}
		}

		if ( array_key_exists( 'thumbnail', $data ) ) {
			$fields['thumbnail'] = Wooreels_Validator::url( $data['thumbnail'] );
		}

		if ( array_key_exists( 'links', $data ) ) {
			$fields['links'] = Wooreels_Validator::validate_links( $data['links'] );
		}

		$this->begin_transaction();

		try {
			if ( ! empty( $fields ) && ! $this->update_row( $id, $fields ) ) {
				$this->abort( 'Update of the reel row failed.' );
			}

			if ( array_key_exists( 'files', $data ) ) {
				$this->files()->replace_for_reel( $id, Wooreels_Validator::validate_files( $data['files'] ) );
			}

			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: updating reel ' . $id . ' failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return null;
		}

		/**
		 * Fires after a reel has been updated.
		 *
		 * @since 1.0.0
		 * @param int $id The reel id.
		 */
		do_action( 'wooreels_reel_updated', $id );

		return $this->find( $id );
	}

	/**
	 * Delete a reel, its files and its pivot rows.
	 *
	 * Click counters that reference the reel are kept: they carry a snapshot of
	 * the button labels and remain readable after the reel is gone.
	 *
	 * @since  1.0.0
	 * @param  int $id Reel id.
	 * @return bool Whether the reel was deleted.
	 */
	public function delete( $id ) {
		$id = (int) $id;

		if ( ! $this->exists( $id ) ) {
			return false;
		}

		$pivot = Wooreels_Schema::table( 'widget_reels' );

		$this->begin_transaction();

		try {
			$this->files()->delete_for_reel( $id );
			$this->db()->delete( $pivot, array( 'reel_id' => $id ), array( '%d' ) );

			if ( ! parent::delete( $id ) ) {
				$this->abort( 'Delete of the reel row removed nothing.' );
			}

			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: deleting reel ' . $id . ' failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return false;
		}

		/**
		 * Fires after a reel has been deleted.
		 *
		 * @since 1.0.0
		 * @param int $id The deleted reel id.
		 */
		do_action( 'wooreels_reel_deleted', $id );

		return true;
	}

	/**
	 * Delete several reels, reporting the ones that could not go.
	 *
	 * @since  1.0.0
	 * @param  int[] $ids Reel ids.
	 * @return array{deleted:int,failed:int[]} What happened.
	 */
	public function bulk_delete( $ids ) {
		$ids     = array_values( array_unique( array_filter( array_map( 'absint', (array) $ids ) ) ) );
		$deleted = 0;
		$failed  = array();

		foreach ( $ids as $id ) {
			if ( $this->delete( $id ) ) {
				++$deleted;
				continue;
			}

			$failed[] = $id;
		}

		return array(
			'deleted' => $deleted,
			'failed'  => $failed,
		);
	}

	/**
	 * Add one to a reel's view counter, atomically.
	 *
	 * @since  1.0.0
	 * @param  int $id Reel id.
	 * @return int The new view count, or 0 when the reel does not exist.
	 */
	public function increment_view( $id ) {
		$id    = (int) $id;
		$table = $this->table();

		$updated = $this->db()->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "UPDATE `{$table}` SET view_count = view_count + 1 WHERE id = %d", $id ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);

		if ( ! $updated ) {
			return 0;
		}

		return (int) $this->db()->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT view_count FROM `{$table}` WHERE id = %d", $id ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	/**
	 * Attach each reel's first file, in one query for the whole page.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  array[] $reels Typed reel rows.
	 * @return array[] The same rows, each with a 'file' key.
	 */
	private function attach_first_file( $reels ) {
		if ( empty( $reels ) ) {
			return $reels;
		}

		$files = $this->files()->for_reels( wp_list_pluck( $reels, 'id' ) );

		foreach ( $reels as $index => $reel ) {
			$own = isset( $files[ $reel['id'] ] ) ? $files[ $reel['id'] ] : array();

			$reels[ $index ]['file'] = empty( $own ) ? null : $own[0];
		}

		return $reels;
	}

	/**
	 * The next automatic title, for a reel saved without one.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return string The title.
	 */
	private function next_untitled_title() {
		/* translators: %d: sequential number for an automatically named reel. */
		return sprintf( __( 'Untitled reel %d', 'wooreels' ), $this->count_all() + 1 );
	}
}
