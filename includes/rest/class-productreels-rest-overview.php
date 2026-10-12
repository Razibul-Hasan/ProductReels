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
			)
		);
	}
}
