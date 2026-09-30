<?php
/**
 * Public REST routes: render payload, view tracking and click tracking.
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
 * The only three routes a visitor's browser ever touches.
 *
 * `/render/:id` is the frontend's single read: everything needed to paint one
 * widget, in one request. The two tracking routes accept nothing but integers
 * and a UUID — a click is recorded under the labels the reel itself carries,
 * never ones the request supplies — and views are rate limited per visitor
 * per reel.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Rest_Tracking extends Productreels_Rest_Controller {

	/**
	 * The widgets repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Productreels_Widgets
	 */
	private $widgets;

	/**
	 * The reels repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Productreels_Reels
	 */
	private $reels;

	/**
	 * The clicks repository.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    Productreels_Clicks
	 */
	private $clicks;

	/**
	 * Wire up the repositories.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->widgets = new Productreels_Widgets();
		$this->reels   = new Productreels_Reels();
		$this->clicks  = new Productreels_Clicks();
	}

	/**
	 * Register the public routes.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/render/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'render' ),
				'permission_callback' => array( $this, 'public_read_permission' ),
				'args'                => $this->id_arg(),
			)
		);

		register_rest_route(
			$this->namespace,
			'/render/reel/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'render_reel' ),
				'permission_callback' => array( $this, 'public_read_permission' ),
				'args'                => $this->id_arg(),
			)
		);

		register_rest_route(
			$this->namespace,
			'/widgets/(?P<wid>\d+)/reels/(?P<id>\d+)/view',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'track_view' ),
				'permission_callback' => array( $this, 'track_permission' ),
				'args'                => array_merge( $this->widget_or_standalone_arg( 'wid' ), $this->id_arg( 'id' ) ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/track/click',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'track_click' ),
				'permission_callback' => array( $this, 'track_permission' ),
				'args'                => array(
					'widget_id' => array(
						'type'              => 'integer',
						'required'          => true,
						'minimum'           => 0,
						'sanitize_callback' => 'absint',
					),
					'reel_id'   => array(
						'type'              => 'integer',
						'required'          => true,
						'minimum'           => 1,
						'sanitize_callback' => 'absint',
					),
					'btn_uuid'  => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Everything one widget needs to paint itself.
	 *
	 * Cached in a transient stamped with the widget's styles and the site-wide
	 * render generation (see Productreels_Render_Cache), and served with a
	 * public Cache-Control so a CDN can hold it too. The mount node's
	 * version token changes with the same generation, so the browser asks
	 * for a fresh URL the moment anything relevant is edited.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function render( $request ) {
		$summary = $this->widgets->summary( $request->get_param( 'id' ) );

		if ( null === $summary ) {
			return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
		}

		$payload = Productreels_Render_Cache::get( $summary['id'], $summary['styles_json'] );

		if ( null === $payload ) {
			$widget = $this->widgets->find( $summary['id'] );

			if ( null === $widget ) {
				return $this->not_found( __( 'That widget no longer exists.', 'productreels' ) );
			}

			$payload = array(
				'id'     => $widget['id'],
				'name'   => $widget['name'],
				'styles' => $widget['styles'],
				'reels'  => array_map( array( $this, 'present_reel' ), $widget['reels'] ),
			);

			Productreels_Render_Cache::set( $summary['id'], $summary['styles_json'], $payload );
		}

		return $this->cacheable( $payload );
	}

	/**
	 * One reel on its own, for [productreels_reel].
	 *
	 * Shaped exactly like a widget payload — id 0, the default styles, one
	 * reel — so the frontend renders it through the same components.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function render_reel( $request ) {
		$reel = $this->reels->find( $request->get_param( 'id' ) );

		if ( null === $reel ) {
			return $this->not_found( __( 'That reel no longer exists.', 'productreels' ) );
		}

		$styles             = Productreels_Settings::default_styles();
		$styles['template'] = 'grid';

		return $this->cacheable(
			array(
				'id'     => 0,
				'name'   => '',
				'styles' => Productreels_Validator::validate_styles( $styles ),
				'reels'  => array( $this->present_reel( $reel ) ),
			)
		);
	}

	/**
	 * The fields of a reel a visitor's browser needs, and nothing else.
	 *
	 * @since  1.0.0
	 * @param  array $reel A hydrated reel.
	 * @return array<string,mixed> The public shape.
	 */
	public function present_reel( $reel ) {
		return array(
			'id'         => $reel['id'],
			'reel_uuid'  => $reel['reel_uuid'],
			'title'      => $reel['title'],
			'thumbnail'  => $reel['thumbnail'],
			'view_count' => $reel['view_count'],
			'files'      => $reel['files'],
			'links'      => $reel['links'],
		);
	}

	/**
	 * Wrap a payload with the headers that let browsers and CDNs keep it.
	 *
	 * Logged-in requests keep WordPress's own no-cache headers: an editor
	 * previewing a change must never be handed a stale copy. So does a site
	 * that has switched public fetch off — a shared cache must not hand a
	 * nonce-authorised copy to a request that carried no nonce.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  array $payload The payload.
	 * @return WP_REST_Response The response.
	 */
	private function cacheable( $payload ) {
		$response = rest_ensure_response( $payload );

		if ( ! is_user_logged_in() && Productreels_Render_Cache::enabled() && Productreels_Settings::get( 'allow_public_fetch', true ) ) {
			$ttl = Productreels_Render_Cache::ttl();

			$response->header( 'Cache-Control', 'public, max-age=' . $ttl . ', s-maxage=' . $ttl );
			$response->header( 'Vary', 'Accept-Encoding' );
		}

		return $response;
	}

	/**
	 * A widget id that may also be 0, meaning "no widget: a standalone reel".
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  string $name The parameter name.
	 * @return array<string,array> The argument schema.
	 */
	private function widget_or_standalone_arg( $name ) {
		return array(
			$name => array(
				'type'              => 'integer',
				'required'          => true,
				'minimum'           => 0,
				'sanitize_callback' => 'absint',
			),
		);
	}

	/**
	 * Whether a reel may be tracked against a widget.
	 *
	 * Inside a widget the reel has to actually belong to it; a standalone
	 * reel (widget 0) only has to exist.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  int $widget_id Widget id, or 0.
	 * @param  int $reel_id   Reel id.
	 * @return bool Whether tracking may proceed.
	 */
	private function trackable( $widget_id, $reel_id ) {
		if ( 0 === (int) $widget_id ) {
			return $this->reels->exists( $reel_id );
		}

		return in_array( (int) $reel_id, $this->widgets->reel_ids( $widget_id ), true );
	}

	/**
	 * Count one view of a reel inside a widget.
	 *
	 * Answers 200 either way so the player never has to care: `counted` says
	 * whether the counter actually moved. The one exception is a genuine rate
	 * limit, which is a 429 so a misbehaving client can see it.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function track_view( $request ) {
		$widget_id = $request->get_param( 'wid' );
		$reel_id   = $request->get_param( 'id' );

		if ( ! $this->trackable( $widget_id, $reel_id ) ) {
			return $this->not_found( __( 'That reel is not part of this widget.', 'productreels' ) );
		}

		if ( Productreels_Rate_Limiter::is_bot() ) {
			return rest_ensure_response(
				array(
					'counted'    => false,
					'view_count' => 0,
				)
			);
		}

		$allowed = Productreels_Rate_Limiter::check(
			'view:' . $reel_id . ':' . Productreels_Rate_Limiter::visitor_hash(),
			(int) Productreels_Settings::get( 'view_limit', 2 ),
			(int) Productreels_Settings::get( 'view_interval', 1 ) * MINUTE_IN_SECONDS
		);

		if ( ! $allowed ) {
			return new WP_Error(
				'productreels_view_rate_limited',
				__( 'This view has already been counted.', 'productreels' ),
				array( 'status' => 429 )
			);
		}

		$views = $this->reels->increment_view( $reel_id );

		/**
		 * Fires after a reel view has been counted.
		 *
		 * @since 1.0.0
		 * @param int $reel_id   The reel that was viewed.
		 * @param int $widget_id The widget it was viewed in.
		 */
		do_action( 'productreels_view_tracked', (int) $reel_id, (int) $widget_id );

		return rest_ensure_response(
			array(
				'counted'    => true,
				'view_count' => $views,
			)
		);
	}

	/**
	 * Count one click on a button.
	 *
	 * The button has to be one the reel actually carries: its labels are
	 * copied from the reel's own link, so a request can never write a label
	 * of its choosing into the statistics, nor mint a counter for a button
	 * that does not exist.
	 *
	 * Not rate limited: the counter is an atomic upsert, and a click is a
	 * deliberate act rather than something a page does on its own.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error The response.
	 */
	public function track_click( $request ) {
		$widget_id = $request->get_param( 'widget_id' );
		$reel_id   = $request->get_param( 'reel_id' );
		$btn_uuid  = Productreels_Validator::uuid( $request->get_param( 'btn_uuid' ) );

		if ( '' === $btn_uuid ) {
			return $this->invalid( 'productreels_click_invalid', __( 'That button could not be identified.', 'productreels' ) );
		}

		if ( ! $this->trackable( $widget_id, $reel_id ) ) {
			return $this->not_found( __( 'That reel is not part of this widget.', 'productreels' ) );
		}

		$reel = $this->reels->find( $reel_id );
		$link = null === $reel ? null : $this->link_on( $reel, $btn_uuid );

		if ( null === $link ) {
			return $this->not_found( __( 'That button is not part of this reel.', 'productreels' ) );
		}

		// Counters belong to a widget; a standalone reel has none to report
		// under, so its clicks are acknowledged and not stored.
		if ( 0 === (int) $widget_id || Productreels_Rate_Limiter::is_bot() ) {
			return rest_ensure_response( array( 'counted' => false ) );
		}

		// A product card leads to the product's own page; a custom button
		// carries its URL with it.
		$url = isset( $link['buttonUrl'] ) ? $link['buttonUrl'] : '';

		if ( 'product' === $link['btn_type'] && ! empty( $link['product_id'] ) ) {
			$url = (string) get_permalink( (int) $link['product_id'] );
		}

		$recorded = $this->clicks->record(
			array(
				'widget_id'     => $widget_id,
				'reel_id'       => $reel_id,
				'reel_title'    => $reel['title'],
				'btn_uuid'      => $btn_uuid,
				'button_text'   => isset( $link['buttonText'] ) ? $link['buttonText'] : '',
				'button_url'    => $url,
				'campaign_name' => isset( $link['campaignName'] ) ? $link['campaignName'] : '',
			)
		);

		if ( ! $recorded ) {
			return $this->failed( 'productreels_click_track_failed', 'The clicks repository refused the upsert.' );
		}

		/**
		 * Fires after a button click has been counted.
		 *
		 * @since 1.0.0
		 * @param int    $widget_id The widget the button was clicked in.
		 * @param int    $reel_id   The reel it belongs to.
		 * @param string $btn_uuid  The button's tracking key.
		 */
		do_action( 'productreels_click_tracked', (int) $widget_id, (int) $reel_id, $btn_uuid );

		return rest_ensure_response( array( 'counted' => true ) );
	}

	/**
	 * The link on a reel with this tracking key, if there is one.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  array  $reel     A hydrated reel.
	 * @param  string $btn_uuid The button's tracking key.
	 * @return array|null The link, or null when the reel has no such button.
	 */
	private function link_on( $reel, $btn_uuid ) {
		foreach ( (array) $reel['links'] as $link ) {
			if ( is_array( $link ) && isset( $link['btn_uuid'] ) && $link['btn_uuid'] === $btn_uuid ) {
				return $link;
			}
		}

		return null;
	}
}
