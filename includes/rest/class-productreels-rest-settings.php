<?php
/**
 * REST routes for the plugin settings.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Reads and writes the settings the Settings screen edits.
 *
 * Writes are partial: send only what changed. Every value is clamped to its
 * allowed range on the way in, so a number typed into the wrong box cannot put
 * the site into a strange state.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Rest_Settings extends Productreels_Rest_Controller {

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'settings';

	/**
	 * Register the settings routes.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'admin_permission' ),
				),
				array(
					'methods'             => 'PUT, PATCH',
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'admin_permission' ),
					'args'                => array(
						'view_limit'               => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 100,
						),
						'view_interval'            => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 1440,
						),
						'allow_public_fetch'       => array( 'type' => 'boolean' ),
						'cache_render'             => array( 'type' => 'boolean' ),
						'cache_ttl'                => array(
							'type'    => 'integer',
							'minimum' => MINUTE_IN_SECONDS,
							'maximum' => WEEK_IN_SECONDS,
						),
						'delete_data_on_uninstall' => array( 'type' => 'boolean' ),
					),
				),
			)
		);
	}

	/**
	 * The current settings, merged with the defaults.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_item( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		return rest_ensure_response( Productreels_Settings::all() );
	}

	/**
	 * Apply a partial settings update.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function update_item( $request ) {
		$changes = array();

		foreach ( array_keys( Productreels_Settings::defaults() ) as $key ) {
			if ( null !== $request->get_param( $key ) ) {
				$changes[ $key ] = $request->get_param( $key );
			}
		}

		if ( empty( $changes ) ) {
			return $this->invalid( 'productreels_settings_update_failed', __( 'Please enter valid numbers.', 'productreels' ) );
		}

		return rest_ensure_response( Productreels_Settings::update( $changes ) );
	}
}
