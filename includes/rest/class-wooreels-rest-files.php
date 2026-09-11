<?php
/**
 * REST routes for media file rows.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/rest
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Removes a single video from a reel.
 *
 * Deleting a file row detaches the video from the reel. The WordPress
 * attachment itself is left in the media library, because it may well be in use
 * somewhere else on the site and this plugin did not put it there.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Rest_Files extends Wooreels_Rest_Controller {

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'files';

	/**
	 * The files repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Wooreels_Files
	 */
	private $files;

	/**
	 * Wire up the repository.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->files = new Wooreels_Files();
	}

	/**
	 * Register the file routes.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_item' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => $this->id_arg(),
			)
		);
	}

	/**
	 * Detach one video from its reel.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function delete_item( $request ) {
		$id   = $request->get_param( 'id' );
		$file = $this->files->find( $id );

		if ( null === $file ) {
			return $this->not_found( __( 'That video is no longer attached to this reel.', 'wooreels' ) );
		}

		if ( ! $this->files->delete( $id ) ) {
			return $this->failed( 'wooreels_file_delete_failed', 'The files repository refused the delete.' );
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => (int) $id,
				'reel_id' => $file['reel_id'],
			)
		);
	}
}
