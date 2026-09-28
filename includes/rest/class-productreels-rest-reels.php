<?php
/**
 * REST routes for reels.
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
 * Everything the reels library does to a reel.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Rest_Reels extends Productreels_Rest_Controller {

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'reels';

	/**
	 * The reels repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Productreels_Reels
	 */
	private $reels;

	/**
	 * Wire up the repository.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->reels = new Productreels_Reels();
	}

	/**
	 * Register every reel route.
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
					'permission_callback' => array( $this, 'admin_permission' ),
					'args'                => array_merge(
						$this->collection_args( array( 'id', 'title', 'view_count', 'created_at' ) ),
						array(
							'exclude_widget' => array(
								'type'              => 'integer',
								'default'           => 0,
								'minimum'           => 0,
								'sanitize_callback' => 'absint',
							),
						)
					),
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
			'/' . $this->rest_base . '/bulk-delete',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'bulk_delete' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array(
					'ids' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array( 'type' => 'integer' ),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/validate-url',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'validate_url' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array(
					'url'    => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'esc_url_raw',
					),
					'source' => array(
						'type'    => 'string',
						'default' => 'hosted',
						'enum'    => Productreels_Validator::SOURCES,
					),
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
					'permission_callback' => array( $this, 'admin_permission' ),
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
	}

	/**
	 * A page of reels, each with its first file.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_items( $request ) {
		$page = $this->reels->paginate(
			array(
				'page'           => $request->get_param( 'page' ),
				'per_page'       => $request->get_param( 'per_page' ),
				'search'         => $request->get_param( 'search' ),
				'exclude_widget' => $request->get_param( 'exclude_widget' ),
				'orderby'        => $request->get_param( 'orderby' ),
				'order'          => $request->get_param( 'order' ),
			)
		);

		return $this->list_response( $page );
	}

	/**
	 * One reel, with every file and link it owns.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function get_item( $request ) {
		$reel = $this->reels->find( $request->get_param( 'id' ) );

		if ( null === $reel ) {
			return $this->not_found( __( 'That reel no longer exists.', 'productreels-shoppable-video-reels-for-woocommerce' ) );
		}

		return rest_ensure_response( $reel );
	}

	/**
	 * Create a reel and its files in one transaction.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function create_item( $request ) {
		// A new reel has nothing to fall back on, so a field left out of the
		// request is as empty as one sent empty.
		$incomplete = $this->incomplete(
			(array) $request->get_param( 'files' ),
			(array) $request->get_param( 'links' )
		);

		if ( null !== $incomplete ) {
			return $incomplete;
		}

		$reel = $this->reels->create(
			array(
				'title'     => $request->get_param( 'title' ),
				'thumbnail' => $request->get_param( 'thumbnail' ),
				'links'     => $request->get_param( 'links' ),
				'files'     => $request->get_param( 'files' ),
			)
		);

		if ( null === $reel ) {
			return $this->failed( 'productreels_reel_create_failed', 'The reels repository returned no reel.' );
		}

		$response = rest_ensure_response( $reel );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Update a reel; supplying files replaces them wholesale.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function update_item( $request ) {
		$id      = $request->get_param( 'id' );
		$changes = array();

		foreach ( array( 'title', 'thumbnail', 'links', 'files' ) as $field ) {
			if ( null !== $request->get_param( $field ) ) {
				$changes[ $field ] = $request->get_param( $field );
			}
		}

		if ( ! $this->reels->exists( $id ) ) {
			return $this->not_found( __( 'That reel no longer exists.', 'productreels-shoppable-video-reels-for-woocommerce' ) );
		}

		// Only what the client sent is checked; an untouched field keeps
		// whatever the reel already has.
		$incomplete = $this->incomplete(
			isset( $changes['files'] ) ? $changes['files'] : null,
			isset( $changes['links'] ) ? $changes['links'] : null
		);

		if ( null !== $incomplete ) {
			return $incomplete;
		}

		$reel = $this->reels->update( $id, $changes );

		if ( null === $reel ) {
			return $this->failed( 'productreels_reel_update_failed', 'The reels repository returned no reel.' );
		}

		return rest_ensure_response( $reel );
	}

	/**
	 * Delete a reel, its files and its pivot rows.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function delete_item( $request ) {
		$id = $request->get_param( 'id' );

		if ( ! $this->reels->exists( $id ) ) {
			return $this->not_found( __( 'That reel no longer exists.', 'productreels-shoppable-video-reels-for-woocommerce' ) );
		}

		if ( ! $this->reels->delete( $id ) ) {
			return $this->failed( 'productreels_reel_delete_failed', 'The reels repository refused the delete.' );
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => (int) $id,
			)
		);
	}

	/**
	 * Delete several reels, reporting the ones that could not go.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function bulk_delete( $request ) {
		$ids = (array) $request->get_param( 'ids' );

		if ( empty( $ids ) ) {
			return $this->invalid( 'productreels_reels_bulk_delete_failed', __( 'Select at least one reel to delete.', 'productreels-shoppable-video-reels-for-woocommerce' ) );
		}

		return rest_ensure_response( $this->reels->bulk_delete( $ids ) );
	}

	/**
	 * Work out what a pasted video URL is.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function validate_url( $request ) {
		$description = Productreels_Media::describe(
			$request->get_param( 'url' ),
			$request->get_param( 'source' )
		);

		if ( ! $description['valid'] ) {
			return $this->invalid(
				'productreels_url_invalid',
				__( 'That link is not a video we can play. Use a YouTube, Vimeo or direct MP4 URL.', 'productreels-shoppable-video-reels-for-woocommerce' )
			);
		}

		return rest_ensure_response( $description );
	}

	/**
	 * Refuse a reel that would have nothing to play or nothing to click.
	 *
	 * Runs the same validator the repository uses, so a file with no URL or a
	 * link with no text does not count. Pass null for a field the client did
	 * not send and it is left unchecked.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  mixed $files Raw files array, or null when not supplied.
	 * @param  mixed $links Raw links array, or null when not supplied.
	 * @return WP_Error|null The 400 to send back, or null when the reel is complete.
	 */
	private function incomplete( $files, $links ) {
		if ( null !== $files && empty( Productreels_Validator::validate_files( $files ) ) ) {
			return $this->invalid(
				'productreels_reel_no_files',
				__( 'Add at least one video to save this reel.', 'productreels-shoppable-video-reels-for-woocommerce' )
			);
		}

		if ( null !== $links && empty( Productreels_Validator::validate_links( $links ) ) ) {
			return $this->invalid(
				'productreels_reel_no_links',
				__( 'Add at least one link to save this reel.', 'productreels-shoppable-video-reels-for-woocommerce' )
			);
		}

		return null;
	}

	/**
	 * The body arguments a create or update accepts.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return array<string,array> The argument schema.
	 */
	private function writable_args() {
		return array(
			'title'     => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'thumbnail' => array(
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
			),
			'links'     => array(
				'type'  => 'array',
				'items' => array( 'type' => 'object' ),
			),
			'files'     => array(
				'type'  => 'array',
				'items' => array( 'type' => 'object' ),
			),
		);
	}
}
