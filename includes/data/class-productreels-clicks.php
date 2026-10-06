<?php
/**
 * Per-button click counters.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/data
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Reads and writes the click counters.
 *
 * A counter is keyed on (widget_id, btn_uuid), so the same reel used in two
 * widgets counts its clicks separately — the two campaigns are different
 * placements and deserve different numbers.
 *
 * Recording a click is a single atomic upsert. Two visitors clicking the same
 * button at the same moment can never lose a count to a read-then-write race.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/data
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Clicks extends Productreels_Repository {

	/**
	 * The table this repository owns.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string The short table key.
	 */
	protected function table_key() {
		return 'clicks';
	}

	/**
	 * Column => cast for the clicks table.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return array<string,string> The cast map.
	 */
	protected function casts() {
		return array(
			'id'            => self::CAST_INT,
			'widget_id'     => self::CAST_INT,
			'reel_id'       => self::CAST_INT,
			'reel_title'    => self::CAST_STRING,
			'btn_uuid'      => self::CAST_STRING,
			'button_text'   => self::CAST_STRING,
			'button_url'    => self::CAST_STRING,
			'campaign_name' => self::CAST_STRING,
			'click_count'   => self::CAST_INT,
			'updated_at'    => self::CAST_DATETIME,
		);
	}

	/**
	 * Columns a stats table may be sorted by.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @return string[] Sortable column names.
	 */
	protected function sortable() {
		return array( 'click_count', 'button_text', 'campaign_name', 'reel_title', 'id' );
	}

	/**
	 * Record one click, atomically.
	 *
	 * The label columns are refreshed on every click so a button renamed in the
	 * editor reports under its current name, while the counter keeps counting.
	 *
	 * @since  1.0.0
	 * @param  array $data widget_id, reel_id, btn_uuid and the button's labels.
	 * @return bool Whether the counter moved.
	 */
	public function record( $data ) {
		$widget_id = absint( isset( $data['widget_id'] ) ? $data['widget_id'] : 0 );
		$reel_id   = absint( isset( $data['reel_id'] ) ? $data['reel_id'] : 0 );
		$btn_uuid  = Productreels_Validator::uuid( isset( $data['btn_uuid'] ) ? $data['btn_uuid'] : '' );

		if ( $widget_id < 1 || $reel_id < 1 || '' === $btn_uuid ) {
			return false;
		}

		$table = $this->table();

		$sql = $this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"INSERT INTO `{$table}`
				( widget_id, reel_id, reel_title, btn_uuid, button_text, button_url, campaign_name, click_count )
			VALUES
				( %d, %d, %s, %s, %s, %s, %s, 1 )
			ON DUPLICATE KEY UPDATE
				click_count   = click_count + 1,
				reel_id       = VALUES( reel_id ),
				reel_title    = VALUES( reel_title ),
				button_text   = VALUES( button_text ),
				button_url    = VALUES( button_url ),
				campaign_name = VALUES( campaign_name )",
			$widget_id,
			$reel_id,
			Productreels_Validator::text( isset( $data['reel_title'] ) ? $data['reel_title'] : '', 255 ),
			$btn_uuid,
			Productreels_Validator::text( isset( $data['button_text'] ) ? $data['button_text'] : '', 255 ),
			Productreels_Validator::url( isset( $data['button_url'] ) ? $data['button_url'] : '' ),
			Productreels_Validator::text( isset( $data['campaign_name'] ) ? $data['campaign_name'] : '', 191 )
		);

		return false !== $this->db()->query( $sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Every button counter for one widget, busiest first.
	 *
	 * @since  1.0.0
	 * @param  int    $widget_id Widget id.
	 * @param  string $orderby   Column to sort by, matched against the allowlist.
	 * @param  string $order     ASC or DESC.
	 * @return array[] The counters.
	 */
	public function for_widget( $widget_id, $orderby = 'click_count', $order = 'DESC' ) {
		list( $column, $direction ) = $this->sanitize_order( $orderby, $order );

		$table = $this->table();

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM `{$table}` WHERE widget_id = %d ORDER BY {$column} {$direction}, id ASC",
				(int) $widget_id
			),
			ARRAY_A
		);

		return $this->cast_rows( $rows );
	}

	/**
	 * Total clicks for a set of widgets, in one query.
	 *
	 * Powers the widgets list, which shows a click total per row.
	 *
	 * @since  1.0.0
	 * @param  int[] $widget_ids Widget ids.
	 * @return array<int,int> Widget id => total clicks.
	 */
	public function totals_for_widgets( $widget_ids ) {
		$widget_ids = array_values( array_unique( array_filter( array_map( 'absint', (array) $widget_ids ) ) ) );

		if ( empty( $widget_ids ) ) {
			return array();
		}

		$table        = $this->table();
		$placeholders = $this->placeholders( count( $widget_ids ) );

		$rows = $this->db()->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$this->db()->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT widget_id, COALESCE( SUM( click_count ), 0 ) AS total
				FROM `{$table}`
				WHERE widget_id IN ({$placeholders})
				GROUP BY widget_id",
				$widget_ids
			),
			ARRAY_A
		);

		$totals = array();

		foreach ( (array) $rows as $row ) {
			$totals[ (int) $row['widget_id'] ] = (int) $row['total'];
		}

		return $totals;
	}

	/**
	 * Delete every counter belonging to a widget.
	 *
	 * @since  1.0.0
	 * @param  int $widget_id Widget id.
	 * @return int How many rows were deleted.
	 */
	public function delete_for_widget( $widget_id ) {
		return (int) $this->db()->delete( $this->table(), array( 'widget_id' => (int) $widget_id ), array( '%d' ) );
	}
}
