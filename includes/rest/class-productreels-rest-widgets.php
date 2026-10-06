<?php
/**
 * REST routes for widgets.
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
 * Everything the admin app does to a widget.
 *
 * Reading a widget or the list is open to anyone who can edit posts — the
 * block and the Elementor widget need it to offer a choice — while every
 * write stays behind manage_options.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Rest_Widgets extends Productreels_Rest_Controller {

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'widgets';

	/**
	 * The widgets repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Productreels_Widgets
	 */
	private $widgets;

	/**
	 * Wire up the repository.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->widgets = new Productreels_Widgets();
	}

	/**
	 * Register every widget route.
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
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'place_permission' ),
					'args'                => $this->collection_args( array( 'id', 'name', 'created_at' ) ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'admin_permission' ),
					'args'                => $this->writable_args(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'place_permission' ),
					'args'                => $this->id_arg(),
				),
				array(
					'methods'             => 'PUT, PATCH',
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'admin_permission' ),
					'args'                => array_merge( $this->id_arg(), $this->writable_args() ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'admin_permission' ),
					'args'                => $this->id_arg(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/duplicate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'duplicate_item' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => $this->id_arg(),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/stats',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array_merge(
					$this->id_arg(),
					array(
						'orderby' => array(
							'type'    => 'string',
							'default' => 'click_count',
							'enum'    => array( 'click_count', 'button_text', 'campaign_name', 'reel_title' ),
						),
						'order'   => array(
							'type'    => 'string',
							'default' => 'DESC',
							'enum'    => array( 'ASC', 'DESC', 'asc', 'desc' ),
						),
					)
				),
			)
		);
	}

	/**
	 * A page of widgets.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_items( $request ) {
		$page = $this->widgets->paginate(
			array(
				'page'     => $request->get_param( 'page' ),
				'per_page' => $request->get_param( 'per_page' ),
				'search'   => $request->get_param( 'search' ),
				'orderby'  => $request->get_param( 'orderby' ),
				'order'    => $request->get_param( 'order' ),
			)
		);

		return $this->list_response( $page );
	}

	/**
	 * One widget, with its styles and ordered reels.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function get_item( $request ) {
		$widget = $this->widgets->find( $request->get_param( 'id' ) );

		if ( null === $widget ) {
			return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
		}

		return rest_ensure_response( $widget );
	}

	/**
	 * Create a widget.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function create_item( $request ) {
		$widget = $this->widgets->create(
			array(
				'name'     => $request->get_param( 'name' ),
				'styles'   => $request->get_param( 'styles' ),
				'reel_ids' => $request->get_param( 'reel_ids' ),
			)
		);

		if ( null === $widget ) {
			return $this->failed( 'productreels_widget_create_failed', 'The widgets repository returned no widget.' );
		}

		$response = rest_ensure_response( $widget );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Update a widget's name, styles or reel order.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function update_item( $request ) {
		$id      = $request->get_param( 'id' );
		$changes = array();

		foreach ( array( 'name', 'styles', 'reel_ids' ) as $field ) {
			if ( null !== $request->get_param( $field ) ) {
				$changes[ $field ] = $request->get_param( $field );
			}
		}

		if ( ! $this->widgets->exists( $id ) ) {
			return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
		}

		$widget = $this->widgets->update( $id, $changes );

		if ( null === $widget ) {
			return $this->failed( 'productreels_widget_update_failed', 'The widgets repository returned no widget.' );
		}

		return rest_ensure_response( $widget );
	}

	/**
	 * Duplicate a widget.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function duplicate_item( $request ) {
		$id = $request->get_param( 'id' );

		if ( ! $this->widgets->exists( $id ) ) {
			return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
		}

		$copy = $this->widgets->duplicate( $id );

		if ( null === $copy ) {
			return $this->failed( 'productreels_widget_duplicate_failed', 'The widgets repository returned no copy.' );
		}

		$response = rest_ensure_response( $copy );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Delete a widget, leaving its reels alone.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function delete_item( $request ) {
		$id = $request->get_param( 'id' );

		if ( ! $this->widgets->exists( $id ) ) {
			return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
		}

		if ( ! $this->widgets->delete( $id ) ) {
			return $this->failed( 'productreels_widget_delete_failed', 'The widgets repository refused the delete.' );
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => (int) $id,
			)
		);
	}

	/**
	 * View, click and per-button numbers for one widget.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function get_stats( $request ) {
		$stats = $this->widgets->stats(
			$request->get_param( 'id' ),
			$request->get_param( 'orderby' ),
			$request->get_param( 'order' )
		);

		if ( null === $stats ) {
			return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
		}

		$buttons = array();

		foreach ( $stats['buttons'] as $button ) {
			$buttons[] = array(
				'btn_uuid'     => $button['btn_uuid'],
				'reel_id'      => $button['reel_id'],
				'reelTitle'    => $button['reel_title'],
				'buttonText'   => $button['button_text'],
				'buttonUrl'    => $button['button_url'],
				'campaignName' => $button['campaign_name'],
				'clickCount'   => $button['click_count'],
			);
		}

		return rest_ensure_response(
			array(
				'reels'   => $stats['reels'],
				'buttons' => $buttons,
				'totals'  => $stats['totals'],
			)
		);
	}

	/**
	 * The body arguments a create or update accepts.
	 *
	 * Deep validation of styles and reel ids happens in the data layer; this is
	 * only the shape check.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return array<string,array> The argument schema.
	 */
	private function writable_args() {
		return array(
			'name'     => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'styles'   => array(
				'type' => 'object',
			),
			'reel_ids' => array(
				'type'  => 'array',
				'items' => array( 'type' => 'integer' ),
			),
		);
	}
}
