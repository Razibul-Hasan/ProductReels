<?php
/**
 * Widgets: named, styled, ordered collections of reels.
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
 * Reads and writes widgets and the pivot that orders their reels.
 *
 * Hydrating a widget is three queries whatever its size — the widget row, its
 * reels through the pivot, then every file for those reels in one go. There is
 * no per-reel query anywhere in this class.
 *
 * Deleting a widget takes its pivot rows and its click counters with it and
 * leaves every reel alone: reels are reusable and usually live in more than one
 * widget.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/data
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Widgets extends Wooreels_Repository {

	/**
	 * The files repository, created on first use.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Wooreels_Files|null
	 */
	private $files = null;

	/**
	 * The clicks repository, created on first use.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Wooreels_Clicks|null
	 */
	private $clicks = null;

	/**
	 * The table this repository owns.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string The short table key.
	 */
	protected function table_key() {
		return 'widgets';
	}

	/**
	 * Column => cast for the widgets table.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return array<string,string> The cast map.
	 */
	protected function casts() {
		return array(
			'id'          => self::CAST_INT,
			'slug'        => self::CAST_STRING,
			'name'        => self::CAST_STRING,
			'styles_json' => self::CAST_JSON,
			'created_by'  => self::CAST_INT,
			'created_at'  => self::CAST_DATETIME,
			'updated_at'  => self::CAST_DATETIME,
		);
	}

	/**
	 * Columns a widgets list may be sorted by.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string[] Sortable column names.
	 */
	protected function sortable() {
		return array( 'id', 'name', 'created_at' );
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
	 * The clicks repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return Wooreels_Clicks The repository.
	 */
	private function clicks() {
		if ( null === $this->clicks ) {
			$this->clicks = new Wooreels_Clicks();
		}

		return $this->clicks;
	}

	/**
	 * The pivot table's real name.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return string The table name.
	 */
	private function pivot() {
		return Wooreels_Schema::table( 'widget_reels' );
	}

	/**
	 * A page of widgets, each with its reel count, view total and click total.
	 *
	 * @since  1.0.0
	 * @param  array $args search, page, per_page, orderby, order.
	 * @return array{items:array,total:int,pages:int,page:int,per_page:int} The page.
	 */
	public function paginate( $args = array() ) {
		list( $page, $per_page, $offset ) = $this->sanitize_pagination( $args );

		list( $column, $direction ) = $this->sanitize_order(
			isset( $args['orderby'] ) ? $args['orderby'] : 'id',
			isset( $args['order'] ) ? $args['order'] : 'DESC'
		);

		$table  = $this->table();
		$values = array();
		$where  = '1=1';

		$search = isset( $args['search'] ) ? trim( (string) $args['search'] ) : '';

		if ( '' !== $search ) {
			$where    = 'name LIKE %s';
			$values[] = '%' . $this->db()->esc_like( $search ) . '%';
		}

		$count_sql = "SELECT COUNT(*) FROM `{$table}` WHERE {$where}";
		$total     = (int) $this->db()->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			empty( $values ) ? $count_sql : $this->db()->prepare( $count_sql, $values ) // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);

		$list_sql = "SELECT * FROM `{$table}` WHERE {$where} ORDER BY {$column} {$direction}, id DESC LIMIT %d OFFSET %d";

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( $list_sql, array_merge( $values, array( $per_page, $offset ) ) ), // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		$widgets    = $this->cast_rows( $rows );
		$widget_ids = wp_list_pluck( $widgets, 'id' );
		$reel_stats = $this->reel_totals_for_widgets( $widget_ids );
		$clicks     = $this->clicks()->totals_for_widgets( $widget_ids );

		$items = array();

		foreach ( $widgets as $widget ) {
			$id     = $widget['id'];
			$totals = isset( $reel_stats[ $id ] ) ? $reel_stats[ $id ] : array(
				'reel_count' => 0,
				'view_total' => 0,
			);

			$items[] = array(
				'id'          => $id,
				'name'        => $widget['name'],
				'slug'        => $widget['slug'],
				'reel_count'  => $totals['reel_count'],
				'view_total'  => $totals['view_total'],
				'click_total' => isset( $clicks[ $id ] ) ? $clicks[ $id ] : 0,
				'created_at'  => $widget['created_at'],
			);
		}

		return $this->paginated( $items, $total, $page, $per_page );
	}

	/**
	 * One widget with its styles and its ordered, hydrated reels.
	 *
	 * @since  1.0.0
	 * @param  int $id Widget id.
	 * @return array|null The widget, or null when it does not exist.
	 */
	public function find( $id ) {
		$widget = $this->find_row( $id );

		if ( null === $widget ) {
			return null;
		}

		return $this->present( $widget );
	}

	/**
	 * The widget row alone — no reels, no files — for callers that only need
	 * to know it exists and what version it is at.
	 *
	 * One indexed primary-key read. The shortcode uses it to print the mount
	 * node, and the render route uses it to build the cache key before
	 * deciding whether to hydrate anything at all.
	 *
	 * @since  1.0.0
	 * @param  int $id Widget id.
	 * @return array{id:int,name:string,slug:string,styles_json:string,updated_at:string}|null The summary, or null.
	 */
	public function summary( $id ) {
		$table = $this->table();

		$row = $this->db()->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT id, name, slug, styles_json, updated_at FROM `{$table}` WHERE id = %d", (int) $id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		if ( ! is_array( $row ) ) {
			return null;
		}

		return array(
			'id'          => (int) $row['id'],
			'name'        => (string) $row['name'],
			'slug'        => (string) $row['slug'],
			'styles_json' => (string) $row['styles_json'],
			'updated_at'  => (string) $row['updated_at'],
		);
	}

	/**
	 * One widget looked up by its slug.
	 *
	 * @since  1.0.0
	 * @param  string $slug Widget slug.
	 * @return array|null The widget, or null when it does not exist.
	 */
	public function find_by_slug( $slug ) {
		$table = $this->table();

		$row = $this->db()->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT * FROM `{$table}` WHERE slug = %s", (string) $slug ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		$widget = $this->cast_row( $row );

		return null === $widget ? null : $this->present( $widget );
	}

	/**
	 * Create a widget and its reel pivot in one transaction.
	 *
	 * @since  1.0.0
	 * @param  array $data name, styles, reel_ids[].
	 * @return array|null The new widget, or null when the write failed.
	 */
	public function create( $data ) {
		$name = Wooreels_Validator::text( isset( $data['name'] ) ? $data['name'] : '', 191 );

		if ( '' === $name ) {
			$name = $this->next_untitled_name();
		}

		$styles = Wooreels_Validator::validate_styles( isset( $data['styles'] ) ? $data['styles'] : array() );

		$this->begin_transaction();

		try {
			$id = $this->insert_row(
				array(
					'slug'        => $this->unique_slug( $name ),
					'name'        => $name,
					'styles_json' => $styles,
					'created_by'  => get_current_user_id(),
				)
			);

			if ( $id < 1 ) {
				$this->abort( 'Insert into the widgets table returned no id.' );
			}

			if ( isset( $data['reel_ids'] ) ) {
				$this->write_pivot( $id, $data['reel_ids'] );
			}

			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: creating a widget failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return null;
		}

		/**
		 * Fires after a widget has been created.
		 *
		 * @since 1.0.0
		 * @param int $id The new widget id.
		 */
		do_action( 'wooreels_widget_created', $id );

		return $this->find( $id );
	}

	/**
	 * Update a widget's name, styles or reel list.
	 *
	 * The slug is deliberately left alone on rename: it is an address, and
	 * addresses that move break the pages that point at them.
	 *
	 * @since  1.0.0
	 * @param  int   $id   Widget id.
	 * @param  array $data Any of name, styles, reel_ids[].
	 * @return array|null The updated widget, or null when it does not exist or the write failed.
	 */
	public function update( $id, $data ) {
		$id = (int) $id;

		if ( ! $this->exists( $id ) ) {
			return null;
		}

		$fields = array();

		if ( array_key_exists( 'name', $data ) ) {
			$name = Wooreels_Validator::text( $data['name'], 191 );

			if ( '' !== $name ) {
				$fields['name'] = $name;
			}
		}

		if ( array_key_exists( 'styles', $data ) ) {
			$fields['styles_json'] = Wooreels_Validator::validate_styles( $data['styles'] );
		}

		$this->begin_transaction();

		try {
			if ( ! empty( $fields ) && ! $this->update_row( $id, $fields ) ) {
				$this->abort( 'Update of the widget row failed.' );
			}

			if ( array_key_exists( 'reel_ids', $data ) ) {
				$this->write_pivot( $id, $data['reel_ids'] );
			}

			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: updating widget ' . $id . ' failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return null;
		}

		/**
		 * Fires after a widget has been updated.
		 *
		 * @since 1.0.0
		 * @param int $id The widget id.
		 */
		do_action( 'wooreels_widget_updated', $id );

		return $this->find( $id );
	}

	/**
	 * Deep copy a widget: same styles, same reels, same order, no counters.
	 *
	 * @since  1.0.0
	 * @param  int $id Widget id to copy.
	 * @return array|null The copy, or null when the source does not exist.
	 */
	public function duplicate( $id ) {
		$source = $this->find_row( $id );

		if ( null === $source ) {
			return null;
		}

		/* translators: %s: the name of the widget being duplicated. */
		$name = Wooreels_Validator::text( sprintf( __( '%s (Copy)', 'wooreels' ), $source['name'] ), 191 );

		return $this->create(
			array(
				'name'     => $name,
				'styles'   => $source['styles_json'],
				'reel_ids' => $this->reel_ids( $source['id'] ),
			)
		);
	}

	/**
	 * Delete a widget, its pivot rows and its click counters.
	 *
	 * Reels are left completely alone.
	 *
	 * @since  1.0.0
	 * @param  int $id Widget id.
	 * @return bool Whether the widget was deleted.
	 */
	public function delete( $id ) {
		$id = (int) $id;

		if ( ! $this->exists( $id ) ) {
			return false;
		}

		$this->begin_transaction();

		try {
			$this->db()->delete( $this->pivot(), array( 'widget_id' => $id ), array( '%d' ) );
			$this->clicks()->delete_for_widget( $id );

			if ( ! parent::delete( $id ) ) {
				$this->abort( 'Delete of the widget row removed nothing.' );
			}

			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: deleting widget ' . $id . ' failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return false;
		}

		/**
		 * Fires after a widget has been deleted.
		 *
		 * @since 1.0.0
		 * @param int $id The deleted widget id.
		 */
		do_action( 'wooreels_widget_deleted', $id );

		return true;
	}

	/**
	 * The reel ids in a widget, in their saved order.
	 *
	 * @since  1.0.0
	 * @param  int $widget_id Widget id.
	 * @return int[] Reel ids.
	 */
	public function reel_ids( $widget_id ) {
		$pivot = $this->pivot();

		$ids = $this->db()->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT reel_id FROM `{$pivot}` WHERE widget_id = %d ORDER BY sort_order ASC, id ASC",
				(int) $widget_id
			)
		);

		return array_map( 'intval', (array) $ids );
	}

	/**
	 * Replace a widget's reels, writing sort_order from the array index.
	 *
	 * This is what makes drag-to-reorder stick.
	 *
	 * @since  1.0.0
	 * @param  int   $widget_id Widget id.
	 * @param  int[] $reel_ids  Reel ids, in the order they should appear.
	 * @return bool Whether the pivot was rewritten.
	 */
	public function set_reels( $widget_id, $reel_ids ) {
		$widget_id = (int) $widget_id;

		if ( ! $this->exists( $widget_id ) ) {
			return false;
		}

		$this->begin_transaction();

		try {
			$this->write_pivot( $widget_id, $reel_ids );
			$this->commit();
		} catch ( Throwable $e ) {
			$this->rollback();
			error_log( 'WooReels: reordering widget ' . $widget_id . ' failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

			return false;
		}

		return true;
	}

	/**
	 * View, click and per-button numbers for one widget.
	 *
	 * @since  1.0.0
	 * @param  int    $widget_id Widget id.
	 * @param  string $orderby   Column to sort the button table by.
	 * @param  string $order     ASC or DESC.
	 * @return array{reels:array,buttons:array,totals:array}|null The stats, or null when the widget is gone.
	 */
	public function stats( $widget_id, $orderby = 'click_count', $order = 'DESC' ) {
		$widget_id = (int) $widget_id;

		if ( ! $this->exists( $widget_id ) ) {
			return null;
		}

		$reels   = $this->reel_rows( $widget_id );
		$buttons = $this->clicks()->for_widget( $widget_id, $orderby, $order );

		// Clicks roll up to the reel their button sits on.
		$clicks         = 0;
		$clicks_by_reel = array();

		foreach ( $buttons as $button ) {
			$clicks += $button['click_count'];

			if ( ! isset( $clicks_by_reel[ $button['reel_id'] ] ) ) {
				$clicks_by_reel[ $button['reel_id'] ] = 0;
			}

			$clicks_by_reel[ $button['reel_id'] ] += $button['click_count'];
		}

		$views  = 0;
		$report = array();

		foreach ( $reels as $reel ) {
			$reel_clicks = isset( $clicks_by_reel[ $reel['id'] ] ) ? $clicks_by_reel[ $reel['id'] ] : 0;
			$views      += $reel['view_count'];
			$report[]    = array(
				'reel_id'     => $reel['id'],
				'title'       => $reel['title'],
				'thumbnail'   => $reel['thumbnail'],
				'view_count'  => $reel['view_count'],
				'click_count' => $reel_clicks,
				'ctr'         => $reel['view_count'] > 0 ? round( ( $reel_clicks / $reel['view_count'] ) * 100, 2 ) : 0.0,
			);
		}

		return array(
			'reels'   => $report,
			'buttons' => $buttons,
			'totals'  => array(
				'views'  => $views,
				'clicks' => $clicks,
				'ctr'    => $views > 0 ? round( ( $clicks / $views ) * 100, 2 ) : 0.0,
			),
		);
	}

	/**
	 * Turn a raw widget row into the shape every caller expects.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  array $widget Typed widget row.
	 * @return array The widget with styles and hydrated reels.
	 */
	private function present( $widget ) {
		return array(
			'id'         => $widget['id'],
			'name'       => $widget['name'],
			'slug'       => $widget['slug'],
			'styles'     => Wooreels_Validator::validate_styles( $widget['styles_json'] ),
			'reels'      => $this->hydrated_reels( $widget['id'] ),
			'created_by' => $widget['created_by'],
			'created_at' => $widget['created_at'],
			'updated_at' => $widget['updated_at'],
		);
	}

	/**
	 * A widget's reels in pivot order, each carrying its files.
	 *
	 * Two queries: the reels, then every file for them.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  int $widget_id Widget id.
	 * @return array[] The reels.
	 */
	private function hydrated_reels( $widget_id ) {
		$reels = $this->reel_rows( $widget_id );

		if ( empty( $reels ) ) {
			return array();
		}

		$files = $this->files()->for_reels( wp_list_pluck( $reels, 'id' ) );

		foreach ( $reels as $index => $reel ) {
			$reels[ $index ]['files'] = isset( $files[ $reel['id'] ] ) ? $files[ $reel['id'] ] : array();
		}

		return $reels;
	}

	/**
	 * A widget's reel rows, ordered by the pivot.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  int $widget_id Widget id.
	 * @return array[] Typed reel rows.
	 */
	private function reel_rows( $widget_id ) {
		$pivot = $this->pivot();
		$reels = Wooreels_Schema::table( 'reels' );

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT r.*, p.sort_order
				FROM `{$pivot}` p
				INNER JOIN `{$reels}` r ON r.id = p.reel_id
				WHERE p.widget_id = %d
				ORDER BY p.sort_order ASC, p.id ASC",
				(int) $widget_id
			),
			ARRAY_A
		);

		$casts = array(
			'id'         => self::CAST_INT,
			'reel_uuid'  => self::CAST_STRING,
			'title'      => self::CAST_STRING,
			'thumbnail'  => self::CAST_STRING,
			'links'      => self::CAST_JSON,
			'view_count' => self::CAST_INT,
			'sort_order' => self::CAST_INT,
			'created_at' => self::CAST_DATETIME,
			'updated_at' => self::CAST_DATETIME,
		);

		$out = array();

		foreach ( (array) $rows as $row ) {
			$typed = array();

			foreach ( $casts as $column => $cast ) {
				if ( array_key_exists( $column, $row ) ) {
					$typed[ $column ] = $this->cast_value( $row[ $column ], $cast );
				}
			}

			$out[] = $typed;
		}

		return $out;
	}

	/**
	 * Reel count and view total for a set of widgets, in one query.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  int[] $widget_ids Widget ids.
	 * @return array<int,array{reel_count:int,view_total:int}> Widget id => totals.
	 */
	private function reel_totals_for_widgets( $widget_ids ) {
		$widget_ids = array_values( array_unique( array_filter( array_map( 'absint', (array) $widget_ids ) ) ) );

		if ( empty( $widget_ids ) ) {
			return array();
		}

		$pivot        = $this->pivot();
		$reels        = Wooreels_Schema::table( 'reels' );
		$placeholders = $this->placeholders( count( $widget_ids ) );

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT p.widget_id, COUNT(*) AS reel_count, COALESCE( SUM( r.view_count ), 0 ) AS view_total
				FROM `{$pivot}` p
				INNER JOIN `{$reels}` r ON r.id = p.reel_id
				WHERE p.widget_id IN ({$placeholders})
				GROUP BY p.widget_id",
				$widget_ids
			),
			ARRAY_A
		);

		$totals = array();

		foreach ( (array) $rows as $row ) {
			$totals[ (int) $row['widget_id'] ] = array(
				'reel_count' => (int) $row['reel_count'],
				'view_total' => (int) $row['view_total'],
			);
		}

		return $totals;
	}

	/**
	 * Rewrite a widget's pivot rows from an ordered list of reel ids.
	 *
	 * Ids that do not resolve to a real reel are skipped, so a stale editor tab
	 * cannot leave a pivot row pointing at nothing. Must be called inside a
	 * transaction.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  int   $widget_id Widget id.
	 * @param  mixed $reel_ids  Reel ids in display order.
	 * @return int How many pivot rows were written.
	 */
	private function write_pivot( $widget_id, $reel_ids ) {
		$widget_id = (int) $widget_id;
		$requested = array_values( array_unique( array_filter( array_map( 'absint', (array) $reel_ids ) ) ) );

		$this->db()->delete( $this->pivot(), array( 'widget_id' => $widget_id ), array( '%d' ) );

		if ( empty( $requested ) ) {
			return 0;
		}

		$reels        = Wooreels_Schema::table( 'reels' );
		$placeholders = $this->placeholders( count( $requested ) );

		$existing = $this->db()->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT id FROM `{$reels}` WHERE id IN ({$placeholders})", $requested ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);

		$existing = array_map( 'intval', (array) $existing );
		$written  = 0;

		foreach ( $requested as $reel_id ) {
			if ( ! in_array( $reel_id, $existing, true ) ) {
				continue;
			}

			$inserted = $this->db()->insert(
				$this->pivot(),
				array(
					'widget_id'  => $widget_id,
					'reel_id'    => $reel_id,
					'sort_order' => $written,
				),
				array( '%d', '%d', '%d' )
			);

			if ( $inserted ) {
				++$written;
			}
		}

		return $written;
	}

	/**
	 * Build a slug that no other widget is using.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  string $name The widget name.
	 * @return string The slug.
	 */
	private function unique_slug( $name ) {
		$base = sanitize_title( $name );

		if ( '' === $base ) {
			$base = 'wooreels-widget';
		}

		$base  = substr( $base, 0, 180 );
		$slug  = $base;
		$table = $this->table();
		$try   = 2;

		while ( $this->db()->get_var( $this->db()->prepare( "SELECT id FROM `{$table}` WHERE slug = %s", $slug ) ) ) { // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$slug = $base . '-' . $try;
			++$try;
		}

		return $slug;
	}

	/**
	 * The next automatic name, for a widget saved without one.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return string The name.
	 */
	private function next_untitled_name() {
		/* translators: %d: sequential number for an automatically named widget. */
		return sprintf( __( 'Untitled widget %d', 'wooreels' ), $this->count_all() + 1 );
	}
}
