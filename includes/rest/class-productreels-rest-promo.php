<?php
/**
 * REST route that dismisses the seasonal banner.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.1.2
 *
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * POST /promo/dismiss: hide a campaign from the current user for good.
 *
 * Same capability as every admin route; the request carries the wp_rest
 * nonce like every other call the app makes through apiFetch.
 *
 * @since      1.1.2
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Rest_Promo extends Productreels_Rest_Controller {

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.1.2
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'promo';

	/**
	 * Register the dismiss route.
	 *
	 * @since  1.1.2
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/dismiss',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'dismiss' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array(
					'campaign' => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array( Productreels_Promo::CAMPAIGN ),
					),
				),
			)
		);
	}

	/**
	 * Record the dismissal.
	 *
	 * @since  1.1.2
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function dismiss( $request ) {
		Productreels_Promo::dismiss( get_current_user_id(), $request['campaign'] );

		return rest_ensure_response( array( 'dismissed' => true ) );
	}
}
