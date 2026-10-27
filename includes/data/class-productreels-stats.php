<?php
/**
 * Statistics over time: daily views and clicks, and sales from reels.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.1.1
 *
 * @package    Productreels
 * @subpackage Productreels/includes/data
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Reads and writes the daily and sales tables.
 *
 * The lifetime counters 1.0.0 keeps (a reel's view_count, the clicks table)
 * are untouched; this class keeps a second, dated copy beside them. A view or
 * click bumps one row per site-local day, widget and reel, so a 90-day range
 * is at most 90 rows per reel however busy the store is. Sales rows are
 * written by Productreels_Sales once an order is paid.
 *
 * @since      1.1.1
 * @package    Productreels
 * @subpackage Productreels/includes/data
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Stats {

	/**
	 * The option holding the first day daily rows were kept (Y-m-d).
	 *
	 * @since 1.1.1
	 * @var   string
	 */
	const SINCE_OPTION = 'productreels_stats_since';

	/**
	 * The date ranges Statistics offers, in days.
	 *
	 * @since 1.1.1
	 * @var   int[]
	 */
	const RANGES = array( 7, 30, 90 );

	/**
	 * Hook the counters to the tracking actions, and the clean-up to deletes.
	 *
	 * @since  1.1.1
	 * @param  Productreels_Loader $loader The hook collector.
	 * @return void
	 */
	public static function register( $loader ) {
		$loader->add_action( 'productreels_view_tracked', 'Productreels_Stats', 'record_view', 10, 2 );
		$loader->add_action( 'productreels_click_tracked', 'Productreels_Stats', 'record_click', 10, 2 );
		$loader->add_action( 'productreels_widget_deleted', 'Productreels_Stats', 'delete_for_widget' );
	}

	/**
	 * The first day daily rows were kept, written the first time it's asked.
	 *
	 * @since  1.1.1
	 * @return string The day, Y-m-d.
	 */
	public static function since() {
		$since = (string) get_option( self::SINCE_OPTION, '' );

		if ( '' === $since ) {
			$since = self::today();
			add_option( self::SINCE_OPTION, $since, '', false );
		}

		return $since;
	}

	/**
	 * Today in the site's timezone.
	 *
	 * @since  1.1.1
	 * @return string The day, Y-m-d.
	 */
	public static function today() {
		return wp_date( 'Y-m-d' );
	}

	/**
	 * The first day of a range that ends today.
	 *
	 * @since  1.1.1
	 * @param  int $days Days in the range, today included.
	 * @return string The day, Y-m-d.
	 */
	public static function range_start( $days ) {
		return wp_date( 'Y-m-d', time() - ( max( 1, (int) $days ) - 1 ) * DAY_IN_SECONDS );
	}

	/**
	 * Count one view for today.
	 *
	 * @since  1.1.1
	 * @param  int $reel_id   The reel.
	 * @param  int $widget_id The widget, or 0 for a standalone reel.
	 * @return void
	 */
	public static function record_view( $reel_id, $widget_id ) {
		self::bump( (int) $widget_id, (int) $reel_id, 'views' );
	}

	/**
	 * Count one click for today.
	 *
	 * @since  1.1.1
	 * @param  int $widget_id The widget.
	 * @param  int $reel_id   The reel.
	 * @return void
	 */
	public static function record_click( $widget_id, $reel_id ) {
		self::bump( (int) $widget_id, (int) $reel_id, 'clicks' );
	}

	/**
	 * Forget a deleted widget's dated numbers, as its click counters are.
	 *
	 * @since  1.1.1
	 * @param  int $widget_id The widget.
	 * @return void
	 */
	public static function delete_for_widget( $widget_id ) {
		global $wpdb;

		foreach ( array( 'daily', 'sales' ) as $key ) {
			$wpdb->delete( Productreels_Schema::table( $key ), array( 'widget_id' => (int) $widget_id ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		}
	}

	/**
	 * One atomic upsert on today's row.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  int    $widget_id The widget.
	 * @param  int    $reel_id   The reel.
	 * @param  string $column    `views` or `clicks`.
	 * @return void
	 */
	private static function bump( $widget_id, $reel_id, $column ) {
		global $wpdb;

		if ( $reel_id < 1 || ! in_array( $column, array( 'views', 'clicks' ), true ) ) {
			return;
		}

		$table  = Productreels_Schema::table( 'daily' );
		$views  = 'views' === $column ? 1 : 0;
		$clicks = 'clicks' === $column ? 1 : 0;

		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"INSERT INTO `{$table}` (day, widget_id, reel_id, views, clicks) VALUES (%s, %d, %d, %d, %d)
				ON DUPLICATE KEY UPDATE views = views + VALUES(views), clicks = clicks + VALUES(clicks)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				self::today(),
				$widget_id,
				$reel_id,
				$views,
				$clicks
			)
		);
	}

	/**
	 * One widget's report for a range, built on its 1.0.0 all-time report.
	 *
	 * `all` keeps every 1.0.0 number as it was and adds orders and revenue.
	 * A day range reads the daily and sales tables instead, adds a reel that
	 * isn't in the widget's list but was shown in it (a "current product"
	 * widget's reels), and carries a day-by-day series for the trend chart.
	 *
	 * @since  1.1.1
	 * @param  int    $widget_id The widget.
	 * @param  string $range     `all`, `7`, `30` or `90`.
	 * @param  array  $base      Productreels_Widgets::stats() for the widget.
	 * @return array{reels:array,totals:array,series:array} The report.
	 */
	public function report( $widget_id, $range, $base ) {
		$widget_id = (int) $widget_id;
		$days      = in_array( (int) $range, self::RANGES, true ) ? (int) $range : 0;
		$from      = $days > 0 ? self::range_start( $days ) : null;
		$sales     = $this->sales_by_reel( $widget_id, $from );

		if ( 0 === $days ) {
			$reels = array();
			$seen  = array();

			foreach ( $base['reels'] as $reel ) {
				$seen[ $reel['reel_id'] ] = true;
				$reels[]                  = $this->with_sales( $reel, $sales );
			}

			// A "current product" widget's reels aren't in its list. Add the
			// ones it showed, counted the 1.0.0 way: lifetime views, this
			// widget's clicks.
			$clicks = array();

			foreach ( $base['buttons'] as $button ) {
				$id            = (int) $button['reel_id'];
				$clicks[ $id ] = ( isset( $clicks[ $id ] ) ? $clicks[ $id ] : 0 ) + (int) $button['click_count'];
			}

			$extra  = array_diff( array_unique( array_merge( $this->reel_ids_shown( $widget_id ), array_keys( $sales ), array_keys( $clicks ) ) ), array_keys( $seen ) );
			$totals = $base['totals'];

			foreach ( $this->reel_summaries( $extra ) as $reel ) {
				$id    = $reel['reel_id'];
				$views = $reel['view_count'];
				$count = isset( $clicks[ $id ] ) ? $clicks[ $id ] : 0;

				$reels[] = $this->with_sales(
					array(
						'reel_id'     => $id,
						'title'       => $reel['title'],
						'thumbnail'   => $reel['thumbnail'],
						'view_count'  => $views,
						'click_count' => $count,
						'ctr'         => $views > 0 ? round( ( $count / $views ) * 100, 2 ) : 0.0,
					),
					$sales
				);

				$totals['views'] += $views;
			}

			$totals['ctr'] = $totals['views'] > 0 ? round( ( $totals['clicks'] / $totals['views'] ) * 100, 2 ) : 0.0;

			return array(
				'reels'  => $reels,
				'totals' => array_merge( $totals, $this->sales_totals( $widget_id, null ) ),
				'series' => array(),
			);
		}

		$counts = $this->counts_by_reel( $widget_id, $from );
		$reels  = array();
		$seen   = array();

		foreach ( $base['reels'] as $reel ) {
			$seen[ $reel['reel_id'] ] = true;
			$reels[]                  = $this->dated( $reel, $counts, $sales );
		}

		// Reels shown in the widget without being in its list.
		$extra = array_diff( array_unique( array_merge( array_keys( $counts ), array_keys( $sales ) ) ), array_keys( $seen ) );

		foreach ( $this->reel_summaries( $extra ) as $reel ) {
			$reels[] = $this->dated( $reel, $counts, $sales );
		}

		$views  = array_sum( wp_list_pluck( $reels, 'view_count' ) );
		$clicks = array_sum( wp_list_pluck( $reels, 'click_count' ) );

		return array(
			'reels'  => $reels,
			'totals' => array_merge(
				array(
					'views'  => $views,
					'clicks' => $clicks,
					'ctr'    => $views > 0 ? round( ( $clicks / $views ) * 100, 2 ) : 0.0,
				),
				$this->sales_totals( $widget_id, $from )
			),
			'series' => $this->series( $widget_id, $from, $days ),
		);
	}

	/**
	 * A report row with the range's views and clicks, plus its sales.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  array $reel   A report row (reel_id, title, thumbnail, …).
	 * @param  array $counts Views and clicks by reel id.
	 * @param  array $sales  Orders and revenue by reel id.
	 * @return array The row.
	 */
	private function dated( $reel, $counts, $sales ) {
		$id     = (int) $reel['reel_id'];
		$views  = isset( $counts[ $id ] ) ? $counts[ $id ]['views'] : 0;
		$clicks = isset( $counts[ $id ] ) ? $counts[ $id ]['clicks'] : 0;

		return $this->with_sales(
			array(
				'reel_id'     => $id,
				'title'       => $reel['title'],
				'thumbnail'   => $reel['thumbnail'],
				'view_count'  => $views,
				'click_count' => $clicks,
				'ctr'         => $views > 0 ? round( ( $clicks / $views ) * 100, 2 ) : 0.0,
			),
			$sales
		);
	}

	/**
	 * A report row with its orders and revenue.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  array $reel  A report row.
	 * @param  array $sales Orders and revenue by reel id.
	 * @return array The row.
	 */
	private function with_sales( $reel, $sales ) {
		$id = (int) $reel['reel_id'];

		$reel['orders']  = isset( $sales[ $id ] ) ? $sales[ $id ]['orders'] : 0;
		$reel['revenue'] = isset( $sales[ $id ] ) ? $sales[ $id ]['revenue'] : 0.0;

		return $reel;
	}

	/**
	 * Views and clicks per reel since a day.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  int    $widget_id The widget.
	 * @param  string $from      First day, Y-m-d.
	 * @return array<int,array{views:int,clicks:int}> By reel id.
	 */
	private function counts_by_reel( $widget_id, $from ) {
		global $wpdb;

		$table = Productreels_Schema::table( 'daily' );

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT reel_id, SUM(views) AS views, SUM(clicks) AS clicks FROM `{$table}` WHERE widget_id = %d AND day >= %s GROUP BY reel_id", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$widget_id,
				$from
			),
			ARRAY_A
		);

		$out = array();

		foreach ( (array) $rows as $row ) {
			$out[ (int) $row['reel_id'] ] = array(
				'views'  => (int) $row['views'],
				'clicks' => (int) $row['clicks'],
			);
		}

		return $out;
	}

	/**
	 * Orders and revenue per reel, since a day or all time.
	 *
	 * @since  1.1.1
	 * @param  int         $widget_id The widget.
	 * @param  string|null $from      First day, Y-m-d, or null for all time.
	 * @return array<int,array{orders:int,revenue:float}> By reel id.
	 */
	public function sales_by_reel( $widget_id, $from = null ) {
		global $wpdb;

		$table = Productreels_Schema::table( 'sales' );
		$sql   = "SELECT reel_id, COUNT(DISTINCT order_id) AS orders, SUM(revenue) AS revenue FROM `{$table}` WHERE widget_id = %d";
		$args  = array( (int) $widget_id );

		if ( null !== $from ) {
			$sql   .= ' AND day >= %s';
			$args[] = $from;
		}

		$rows = $wpdb->get_results( $wpdb->prepare( $sql . ' GROUP BY reel_id', $args ), ARRAY_A ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared

		$out = array();

		foreach ( (array) $rows as $row ) {
			$out[ (int) $row['reel_id'] ] = array(
				'orders'  => (int) $row['orders'],
				'revenue' => round( (float) $row['revenue'], 2 ),
			);
		}

		return $out;
	}

	/**
	 * A widget's orders and revenue, since a day or all time. An order with
	 * two reels' products in it is still one order.
	 *
	 * @since  1.1.1
	 * @param  int         $widget_id The widget.
	 * @param  string|null $from      First day, Y-m-d, or null for all time.
	 * @return array{orders:int,revenue:float} The totals.
	 */
	public function sales_totals( $widget_id, $from = null ) {
		global $wpdb;

		$table = Productreels_Schema::table( 'sales' );
		$sql   = "SELECT COUNT(DISTINCT order_id) AS orders, COALESCE(SUM(revenue), 0) AS revenue FROM `{$table}` WHERE widget_id = %d";
		$args  = array( (int) $widget_id );

		if ( null !== $from ) {
			$sql   .= ' AND day >= %s';
			$args[] = $from;
		}

		$row = $wpdb->get_row( $wpdb->prepare( $sql, $args ), ARRAY_A ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared

		return array(
			'orders'  => isset( $row['orders'] ) ? (int) $row['orders'] : 0,
			'revenue' => isset( $row['revenue'] ) ? round( (float) $row['revenue'], 2 ) : 0.0,
		);
	}

	/**
	 * Every day of a range, oldest first, with zeros where nothing happened.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  int    $widget_id The widget.
	 * @param  string $from      First day, Y-m-d.
	 * @param  int    $days      Days in the range.
	 * @return array<int,array{day:string,views:int,clicks:int,orders:int,revenue:float}> The series.
	 */
	private function series( $widget_id, $from, $days ) {
		global $wpdb;

		$daily = Productreels_Schema::table( 'daily' );
		$sales = Productreels_Schema::table( 'sales' );

		$counts = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare( "SELECT day, SUM(views) AS views, SUM(clicks) AS clicks FROM `{$daily}` WHERE widget_id = %d AND day >= %s GROUP BY day", $widget_id, $from ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			OBJECT_K
		);

		$sold = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare( "SELECT day, COUNT(DISTINCT order_id) AS orders, SUM(revenue) AS revenue FROM `{$sales}` WHERE widget_id = %d AND day >= %s GROUP BY day", $widget_id, $from ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			OBJECT_K
		);

		$out   = array();
		$start = strtotime( $from . ' 12:00:00 UTC' );

		for ( $i = 0; $i < $days; $i++ ) {
			$day   = gmdate( 'Y-m-d', $start + $i * DAY_IN_SECONDS );
			$out[] = array(
				'day'     => $day,
				'views'   => isset( $counts[ $day ] ) ? (int) $counts[ $day ]->views : 0,
				'clicks'  => isset( $counts[ $day ] ) ? (int) $counts[ $day ]->clicks : 0,
				'orders'  => isset( $sold[ $day ] ) ? (int) $sold[ $day ]->orders : 0,
				'revenue' => isset( $sold[ $day ] ) ? round( (float) $sold[ $day ]->revenue, 2 ) : 0.0,
			);
		}

		return $out;
	}

	/**
	 * Every reel that has a daily row in a widget.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  int $widget_id The widget.
	 * @return int[] Reel ids.
	 */
	private function reel_ids_shown( $widget_id ) {
		global $wpdb;

		$table = Productreels_Schema::table( 'daily' );

		return array_map(
			'intval',
			$wpdb->get_col( $wpdb->prepare( "SELECT DISTINCT reel_id FROM `{$table}` WHERE widget_id = %d", (int) $widget_id ) ) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}

	/**
	 * Title, stored thumbnail and lifetime views of reels outside the widget's list.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  int[] $ids Reel ids.
	 * @return array[] Report-shaped rows for the reels that still exist.
	 */
	private function reel_summaries( $ids ) {
		global $wpdb;

		$ids = array_values( array_filter( array_map( 'absint', (array) $ids ) ) );

		if ( empty( $ids ) ) {
			return array();
		}

		$table        = Productreels_Schema::table( 'reels' );
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );

		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare( "SELECT id, title, thumbnail, view_count FROM `{$table}` WHERE id IN ({$placeholders}) ORDER BY id DESC", $ids ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		$out = array();

		foreach ( (array) $rows as $row ) {
			$out[] = array(
				'reel_id'    => (int) $row['id'],
				'title'      => (string) $row['title'],
				'thumbnail'  => (string) $row['thumbnail'],
				'view_count' => (int) $row['view_count'],
			);
		}

		return $out;
	}
}
