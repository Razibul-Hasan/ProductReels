<?php
/**
 * REST route for the Widgets screen's store-wide numbers.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.1.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Totals, reel usage and the most-viewed reels, in one read-only call.
 *
 * Views and clicks are counted exactly as 1.0.0's widgets screen counted
 * them (see Productreels_Widgets::overview_totals()). Nothing is cached: the
 * queries are indexed aggregates, and a transient would hold back the live
 * view counts 1.0.0 showed on every load.
 *
 * @since      1.1.0
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Rest_Overview extends Productreels_Rest_Controller {

	/**
	 * How many reels the top-reels row shows.
	 *
	 * @since 1.1.0
	 * @var   int
	 */
	const TOP_REELS = 6;

	/**
	 * Option set once the first-run guide's last step is done: a widget was
	 * found on a page, or the merchant marked the step done themselves.
	 *
	 * @since 1.1.0
	 * @var   string
	 */
	const GUIDE_OPTION = 'productreels_guide_done';

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.1.0
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'overview';

	/**
	 * Register the overview route.
	 *
	 * @since  1.1.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array(),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/guide',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'complete_guide' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array(),
			)
		);
	}

	/**
	 * The numbers.
	 *
	 * @since  1.1.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_item( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$widgets = new Productreels_Widgets();
		$reels   = new Productreels_Reels();
		$clicks  = new Productreels_Clicks();

		$totals = $widgets->overview_totals();
		$top    = $reels->most_viewed( self::TOP_REELS );
		$by_id  = $clicks->totals_for_reels( wp_list_pluck( $top, 'id' ) );

		foreach ( $top as $index => $reel ) {
			$top[ $index ]['clicks'] = isset( $by_id[ $reel['id'] ] ) ? $by_id[ $reel['id'] ] : 0;
		}

		return rest_ensure_response(
			array(
				'widgets'      => $totals['widgets'],
				'views'        => $totals['views'],
				'clicks'       => $totals['clicks'],
				'reels_total'  => $reels->count_all(),
				'reels_in_use' => $totals['reels_in_use'],
				'top_reels'    => $top,
				'placed'       => $totals['views'] > 0 || ( $totals['widgets'] > 0 && $this->is_placed() ),
			)
		);
	}

	/**
	 * Mark the guide's last step done, for widgets placed where is_placed()
	 * can't see them (a classic widget area, a theme template, another builder).
	 *
	 * @since  1.1.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function complete_guide( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		update_option( self::GUIDE_OPTION, 1, false );

		return rest_ensure_response( array( 'placed' => true ) );
	}

	/**
	 * Whether a widget is on a page yet: the guide's last step, before the
	 * first view arrives. Looks for the shortcode, the block or the Elementor
	 * widget in any saved post, page or template (drafts count; trash and
	 * revisions don't), and remembers a hit so later loads skip the search.
	 *
	 * @since  1.1.0
	 * @return bool Placed.
	 */
	private function is_placed() {
		if ( get_option( self::GUIDE_OPTION ) ) {
			return true;
		}

		global $wpdb;

		$skip = "p.post_type <> 'revision' AND p.post_status NOT IN ( 'trash', 'auto-draft', 'inherit' )";

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Runs only during setup; the hit is stored. $skip is a fixed string.
		$found = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT p.ID FROM {$wpdb->posts} p
				WHERE {$skip} AND ( p.post_content LIKE %s OR p.post_content LIKE %s )
				LIMIT 1",
				'%' . $wpdb->esc_like( '[productreels' ) . '%',
				'%' . $wpdb->esc_like( '<!-- wp:productreels/reels' ) . '%'
			)
		);

		if ( ! $found ) {
			$found = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT p.ID FROM {$wpdb->postmeta} m
					INNER JOIN {$wpdb->posts} p ON p.ID = m.post_id
					WHERE m.meta_key = '_elementor_data' AND {$skip} AND m.meta_value LIKE %s
					LIMIT 1",
					'%' . $wpdb->esc_like( '"widgetType":"productreels"' ) . '%'
				)
			);
		}
		// phpcs:enable

		if ( $found ) {
			update_option( self::GUIDE_OPTION, 1, false );
		}

		return (bool) $found;
	}
}
