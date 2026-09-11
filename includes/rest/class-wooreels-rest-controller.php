<?php
/**
 * Shared behaviour for every WooReels REST controller.
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
 * Base controller: permissions, error envelopes and list headers.
 *
 * Errors always leave here as a WP_Error with a wooreels_* code and a generic
 * message. The real exception is written to the error log and never to the
 * response, so a database message can never reach a browser.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
abstract class Wooreels_Rest_Controller extends WP_REST_Controller {

	/**
	 * The REST namespace every route lives under.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @var    string
	 */
	protected $namespace = 'wooreels/v1';

	/**
	 * The capability an administrative route requires.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * Whether the current user may manage WooReels.
	 *
	 * @since  1.0.0
	 * @return true|WP_Error True, or the error to return to the client.
	 */
	public function admin_permission() {
		if ( current_user_can( self::CAPABILITY ) ) {
			return true;
		}

		return new WP_Error(
			'wooreels_forbidden',
			__( 'You are not allowed to manage WooReels.', 'wooreels' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Whether this request may read public widget data.
	 *
	 * Open to everyone while the "Allow public fetch" setting is on. With it
	 * off the route still works for the site's own pages — they carry a REST
	 * nonce, which WordPress issues to logged-out visitors too — but a third
	 * party reading the endpoint directly is turned away.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return true|WP_Error True, or the error to return to the client.
	 */
	public function public_read_permission( $request ) {
		if ( Wooreels_Settings::get( 'allow_public_fetch', true ) ) {
			return true;
		}

		$nonce = $request->get_header( 'x_wp_nonce' );

		if ( $nonce && wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return true;
		}

		return new WP_Error(
			'wooreels_forbidden',
			__( 'Public access to this widget is turned off.', 'wooreels' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Whether this request may write a tracking event.
	 *
	 * Tracking is open by design — a logged-out visitor watching a reel is the
	 * normal case. Abuse is handled by the rate limiter and by the fact that
	 * these routes only ever accept integers and a UUID.
	 *
	 * @since  1.0.0
	 * @return true Always true.
	 */
	public function track_permission() {
		return true;
	}

	/**
	 * A 404 for a resource that is not there.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string $message What was not found.
	 * @return WP_Error The error.
	 */
	protected function not_found( $message ) {
		return new WP_Error(
			'wooreels_not_found',
			$message,
			array( 'status' => 404 )
		);
	}

	/**
	 * A 400 for input the client can fix.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string $code    The wooreels_* error code.
	 * @param  string $message What is wrong, in words a person can act on.
	 * @return WP_Error The error.
	 */
	protected function invalid( $code, $message ) {
		return new WP_Error(
			$code,
			$message,
			array( 'status' => 400 )
		);
	}

	/**
	 * A 500 for something that went wrong on our side.
	 *
	 * Logs the real reason and returns a generic one.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string         $code   The wooreels_* error code.
	 * @param  string         $detail The real reason, for the log only.
	 * @param  Throwable|null $error  The exception, when there was one.
	 * @return WP_Error The error to send back.
	 */
	protected function failed( $code, $detail, $error = null ) {
		$reason = null !== $error ? $error->getMessage() : $detail;

		error_log( 'WooReels REST ' . $code . ': ' . $reason ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

		return new WP_Error(
			$code,
			__( 'Something went wrong. Please try again.', 'wooreels' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Wrap a page of results with the headers a list client expects.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  array $page A page envelope from a repository.
	 * @return WP_REST_Response The response.
	 */
	protected function list_response( $page ) {
		$response = rest_ensure_response( $page['items'] );

		$response->header( 'X-WP-Total', (string) $page['total'] );
		$response->header( 'X-WP-TotalPages', (string) $page['pages'] );

		return $response;
	}

	/**
	 * The shared pagination, search and ordering arguments.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string[] $orderby_values Columns this endpoint may be ordered by.
	 * @return array<string,array> The argument schema.
	 */
	protected function collection_args( $orderby_values ) {
		return array(
			'page'     => array(
				'type'              => 'integer',
				'default'           => 1,
				'minimum'           => 1,
				'sanitize_callback' => 'absint',
			),
			'per_page' => array(
				'type'              => 'integer',
				'default'           => 20,
				'minimum'           => 1,
				'maximum'           => 100,
				'sanitize_callback' => 'absint',
			),
			'search'   => array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'orderby'  => array(
				'type'    => 'string',
				'default' => $orderby_values[0],
				'enum'    => $orderby_values,
			),
			'order'    => array(
				'type'    => 'string',
				'default' => 'DESC',
				'enum'    => array( 'ASC', 'DESC', 'asc', 'desc' ),
			),
		);
	}

	/**
	 * The `id` path argument every single-resource route uses.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @param  string $name The argument name.
	 * @return array<string,array> The argument schema.
	 */
	protected function id_arg( $name = 'id' ) {
		return array(
			$name => array(
				'type'              => 'integer',
				'required'          => true,
				'minimum'           => 1,
				'sanitize_callback' => 'absint',
			),
		);
	}
}
