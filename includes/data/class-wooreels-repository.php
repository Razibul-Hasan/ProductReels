<?php
/**
 * Base class every WooReels repository extends.
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
 * The plugin's only door to the database.
 *
 * Two rules make this class the security boundary for every write:
 *
 * 1. `global $wpdb` is written here and nowhere else in the plugin. Controllers
 *    never see it.
 * 2. Every read and write passes through the subclass's cast map. A column that
 *    is not in the map cannot be written, and a column that is not in the map is
 *    dropped on the way out — so an unexpected key in a request payload can
 *    never reach a table.
 *
 * Rows come back as typed PHP arrays and never contain null: ints are int,
 * bools are bool, JSON columns are already decoded to arrays, and a NULL string
 * column reads back as an empty string.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/data
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
abstract class Wooreels_Repository {

	/**
	 * Cast a column to a PHP integer.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const CAST_INT = 'int';

	/**
	 * Cast a column to a PHP string.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const CAST_STRING = 'string';

	/**
	 * Cast a column to a PHP boolean.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const CAST_BOOL = 'bool';

	/**
	 * Decode a JSON column into a PHP array.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const CAST_JSON = 'json';

	/**
	 * Keep a MySQL datetime as its string form.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const CAST_DATETIME = 'datetime';

	/**
	 * The short table key this repository owns, e.g. 'widgets'.
	 *
	 * @since  1.0.0
	 * @return string A key from Wooreels_Schema::TABLES.
	 */
	abstract protected function table_key();

	/**
	 * Column => cast for every column this repository may read or write.
	 *
	 * @since  1.0.0
	 * @return array<string,string> The cast map.
	 */
	abstract protected function casts();

	/**
	 * Columns that exist in the cast map but may never be written from a payload.
	 *
	 * @since  1.0.0
	 * @return string[] Guarded column names.
	 */
	protected function guarded() {
		return array( 'id', 'created_at', 'updated_at' );
	}

	/**
	 * Columns this repository will accept in an ORDER BY, most useful first.
	 *
	 * Anything not in this allowlist is replaced with the first entry, so an
	 * `orderby` parameter can never reach SQL.
	 *
	 * @since  1.0.0
	 * @return string[] Sortable column names.
	 */
	protected function sortable() {
		return array( 'id' );
	}

	/**
	 * The WordPress database abstraction object.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return wpdb The WordPress database object.
	 */
	protected function db() {
		global $wpdb;
		return $wpdb;
	}

	/**
	 * This repository's real, prefixed table name.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string The table name.
	 */
	protected function table() {
		return Wooreels_Schema::table( $this->table_key() );
	}

	/**
	 * Turn one raw database row into a typed array.
	 *
	 * Iteration is over the cast map rather than the row, so unknown columns are
	 * dropped and the key order is always the map's order.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array|null           $row   Raw associative row, or null.
	 * @param  array<string,string> $extra Casts for computed columns in this query.
	 * @return array|null Typed row, or null when there was no row.
	 */
	protected function cast_row( $row, $extra = array() ) {
		if ( ! is_array( $row ) ) {
			return null;
		}

		$casts = array_merge( $this->casts(), $extra );
		$out   = array();

		foreach ( $casts as $column => $cast ) {
			if ( ! array_key_exists( $column, $row ) ) {
				continue;
			}

			$out[ $column ] = $this->cast_value( $row[ $column ], $cast );
		}

		return $out;
	}

	/**
	 * Cast a list of raw rows.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array                $rows  Raw associative rows.
	 * @param  array<string,string> $extra Casts for computed columns in this query.
	 * @return array[] Typed rows.
	 */
	protected function cast_rows( $rows, $extra = array() ) {
		$out = array();

		foreach ( (array) $rows as $row ) {
			$typed = $this->cast_row( $row, $extra );

			if ( null !== $typed ) {
				$out[] = $typed;
			}
		}

		return $out;
	}

	/**
	 * Cast one value coming out of the database.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  mixed  $value Raw value.
	 * @param  string $cast  One of the CAST_* constants.
	 * @return mixed Typed value.
	 */
	protected function cast_value( $value, $cast ) {
		switch ( $cast ) {
			case self::CAST_INT:
				return null === $value ? 0 : (int) $value;

			case self::CAST_BOOL:
				return null === $value ? false : (bool) (int) $value;

			case self::CAST_JSON:
				if ( is_array( $value ) ) {
					return $value;
				}

				if ( null === $value || '' === $value ) {
					return array();
				}

				$decoded = json_decode( (string) $value, true );

				return is_array( $decoded ) ? $decoded : array();

			case self::CAST_DATETIME:
			case self::CAST_STRING:
			default:
				return null === $value ? '' : (string) $value;
		}
	}

	/**
	 * Reduce a payload to the columns this repository is allowed to write.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array $data Arbitrary payload, typically straight off a request.
	 * @return array{0:array<string,mixed>,1:string[]} Values and their $wpdb formats.
	 */
	protected function fillable( $data ) {
		$casts   = $this->casts();
		$guarded = $this->guarded();
		$values  = array();
		$formats = array();

		foreach ( $casts as $column => $cast ) {
			if ( in_array( $column, $guarded, true ) ) {
				continue;
			}

			if ( ! is_array( $data ) || ! array_key_exists( $column, $data ) ) {
				continue;
			}

			$value = $data[ $column ];

			if ( null === $value ) {
				$values[ $column ] = null;
				$formats[]         = '%s';
				continue;
			}

			switch ( $cast ) {
				case self::CAST_INT:
					$values[ $column ] = (int) $value;
					$formats[]         = '%d';
					break;

				case self::CAST_BOOL:
					$values[ $column ] = $value ? 1 : 0;
					$formats[]         = '%d';
					break;

				case self::CAST_JSON:
					$values[ $column ] = is_string( $value ) ? $value : (string) wp_json_encode( $value );
					$formats[]         = '%s';
					break;

				default:
					$values[ $column ] = (string) $value;
					$formats[]         = '%s';
					break;
			}
		}

		return array( $values, $formats );
	}

	/**
	 * Insert one row from a payload.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array $data Payload, filtered through the cast map.
	 * @return int The new row id, or 0 when the insert failed.
	 */
	protected function insert_row( $data ) {
		list( $values, $formats ) = $this->fillable( $data );

		if ( empty( $values ) ) {
			return 0;
		}

		$inserted = $this->db()->insert( $this->table(), $values, $formats );

		return $inserted ? (int) $this->db()->insert_id : 0;
	}

	/**
	 * Update one row from a payload.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  int   $id   Row id.
	 * @param  array $data Payload, filtered through the cast map.
	 * @return bool Whether the update ran without error.
	 */
	protected function update_row( $id, $data ) {
		list( $values, $formats ) = $this->fillable( $data );

		if ( empty( $values ) ) {
			return true;
		}

		$updated = $this->db()->update(
			$this->table(),
			$values,
			array( 'id' => (int) $id ),
			$formats,
			array( '%d' )
		);

		return false !== $updated;
	}

	/**
	 * Read one row by id.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  int $id Row id.
	 * @return array|null Typed row, or null when it does not exist.
	 */
	protected function find_row( $id ) {
		$table = $this->table();

		$row = $this->db()->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT * FROM `{$table}` WHERE id = %d", (int) $id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		return $this->cast_row( $row );
	}

	/**
	 * Delete one row by id.
	 *
	 * @since  1.0.0
	 * @param  int $id Row id.
	 * @return bool Whether a row was deleted.
	 */
	public function delete( $id ) {
		return (bool) $this->db()->delete( $this->table(), array( 'id' => (int) $id ), array( '%d' ) );
	}

	/**
	 * Whether a row with this id exists.
	 *
	 * @since  1.0.0
	 * @param  int $id Row id.
	 * @return bool Whether it exists.
	 */
	public function exists( $id ) {
		$table = $this->table();

		return (bool) $this->db()->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( "SELECT id FROM `{$table}` WHERE id = %d", (int) $id ) // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	/**
	 * How many rows this table holds.
	 *
	 * @since  1.0.0
	 * @return int Row count.
	 */
	public function count_all() {
		$table = $this->table();

		return (int) $this->db()->get_var( "SELECT COUNT(*) FROM `{$table}`" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Normalise page and per_page into a page, a limit and an offset.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array $args Request arguments, possibly with 'page' and 'per_page'.
	 * @return array{0:int,1:int,2:int} Page, per page, offset.
	 */
	protected function sanitize_pagination( $args ) {
		$page     = isset( $args['page'] ) ? (int) $args['page'] : 1;
		$per_page = isset( $args['per_page'] ) ? (int) $args['per_page'] : 20;

		$page     = max( 1, $page );
		$per_page = min( 100, max( 1, $per_page ) );

		return array( $page, $per_page, ( $page - 1 ) * $per_page );
	}

	/**
	 * Match an orderby/order pair against this repository's allowlist.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string $orderby Requested column.
	 * @param  string $order   Requested direction.
	 * @return array{0:string,1:string} Safe column name and direction.
	 */
	protected function sanitize_order( $orderby, $order ) {
		$sortable = $this->sortable();
		$column   = in_array( (string) $orderby, $sortable, true ) ? (string) $orderby : $sortable[0];
		$dir      = 'ASC' === strtoupper( (string) $order ) ? 'ASC' : 'DESC';

		return array( $column, $dir );
	}

	/**
	 * A comma separated run of $wpdb placeholders, for an IN () clause.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  int    $count  How many placeholders.
	 * @param  string $format Placeholder format, '%d' or '%s'.
	 * @return string The placeholder list.
	 */
	protected function placeholders( $count, $format = '%d' ) {
		return implode( ',', array_fill( 0, max( 1, (int) $count ), $format ) );
	}

	/**
	 * Shape a page of results the way every list endpoint returns them.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array $items    The rows on this page.
	 * @param  int   $total    Total rows matching the query.
	 * @param  int   $page     Current page.
	 * @param  int   $per_page Rows per page.
	 * @return array{items:array,total:int,pages:int,page:int,per_page:int} The envelope.
	 */
	protected function paginated( $items, $total, $page, $per_page ) {
		return array(
			'items'    => $items,
			'total'    => (int) $total,
			'pages'    => $per_page > 0 ? (int) ceil( $total / $per_page ) : 0,
			'page'     => (int) $page,
			'per_page' => (int) $per_page,
		);
	}

	/**
	 * Abandon a transactional write.
	 *
	 * The repositories' create/update/delete methods run several statements
	 * inside one transaction and unwind with a rollback if any of them fails;
	 * this is how a step reports that failure to the catch block.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string $message What went wrong, for the error log.
	 * @return void
	 * @throws RuntimeException Always.
	 */
	protected function abort( $message ) {
		throw new RuntimeException( esc_html( $message ) );
	}

	/**
	 * Open a transaction.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return void
	 */
	protected function begin_transaction() {
		$this->db()->query( 'START TRANSACTION' ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Commit the open transaction.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return void
	 */
	protected function commit() {
		$this->db()->query( 'COMMIT' ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Roll the open transaction back.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return void
	 */
	protected function rollback() {
		$this->db()->query( 'ROLLBACK' ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Generate a version 4 UUID.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string The UUID.
	 */
	protected function uuid() {
		return wp_generate_uuid4();
	}
}
