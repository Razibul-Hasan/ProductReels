<?php
/**
 * REST routes for WooCommerce product lookup.
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
 * Finds products to tag, and reads back the ones a player needs to draw.
 *
 * Every query goes through wc_get_products(); this class never writes SQL
 * against a WooCommerce table. With WooCommerce inactive both routes answer
 * with an empty list and a 200 — product tagging is the one feature that needs
 * Woo, and the rest of the plugin carries on without it.
 *
 * Prices come back as the price_html WooCommerce itself renders, so the store's
 * currency, tax and sale settings are respected without the frontend knowing
 * anything about them.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/rest
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Rest_Products extends Wooreels_Rest_Controller {

	/**
	 * The base of every route in this controller.
	 *
	 * @since  1.0.0
	 * @access protected
	 * @var    string
	 */
	protected $rest_base = 'products';

	/**
	 * How long a batch lookup stays cached.
	 *
	 * @since 1.0.0
	 * @var   int
	 */
	const BATCH_CACHE = 300;

	/**
	 * Register the product routes.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'admin_permission' ),
				'args'                => array(
					'search'   => array(
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
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
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/batch',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_batch' ),
				'permission_callback' => array( $this, 'public_read_permission' ),
				'args'                => array(
					'ids' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array( 'type' => 'integer' ),
					),
				),
			)
		);
	}

	/**
	 * Search products to tag on a reel.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_items( $request ) {
		if ( ! $this->has_woocommerce() ) {
			return $this->empty_list();
		}

		$results = wc_get_products(
			array(
				'status'   => 'publish',
				'limit'    => (int) $request->get_param( 'per_page' ),
				'page'     => (int) $request->get_param( 'page' ),
				's'        => (string) $request->get_param( 'search' ),
				'paginate' => true,
			)
		);

		$items = array();

		foreach ( $results->products as $product ) {
			$items[] = $this->present( $product );
		}

		$response = rest_ensure_response( $items );

		$response->header( 'X-WP-Total', (string) $results->total );
		$response->header( 'X-WP-TotalPages', (string) $results->max_num_pages );

		return $response;
	}

	/**
	 * Read the display fields for a known set of products.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_batch( $request ) {
		if ( ! $this->has_woocommerce() ) {
			return $this->empty_list();
		}

		$ids = array_values( array_unique( array_filter( array_map( 'absint', (array) $request->get_param( 'ids' ) ) ) ) );

		if ( empty( $ids ) ) {
			return $this->empty_list();
		}

		sort( $ids );

		$ids       = array_slice( $ids, 0, 100 );
		$cache_key = 'wooreels_products_' . md5( implode( ',', $ids ) );
		$cached    = get_transient( $cache_key );

		if ( is_array( $cached ) ) {
			return rest_ensure_response( $cached );
		}

		$items    = array();
		$products = wc_get_products(
			array(
				'status'  => 'publish',
				'include' => $ids,
				'limit'   => count( $ids ),
			)
		);

		foreach ( $products as $product ) {
			$items[] = $this->present( $product );
		}

		set_transient( $cache_key, $items, self::BATCH_CACHE );

		return rest_ensure_response( $items );
	}

	/**
	 * Whether WooCommerce is active on this site.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return bool Whether it is.
	 */
	private function has_woocommerce() {
		return class_exists( 'WooCommerce' ) && function_exists( 'wc_get_products' );
	}

	/**
	 * An empty product list with a 200, for a store without WooCommerce.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return WP_REST_Response The response.
	 */
	private function empty_list() {
		$response = rest_ensure_response( array() );

		$response->header( 'X-WP-Total', '0' );
		$response->header( 'X-WP-TotalPages', '0' );

		return $response;
	}

	/**
	 * The fields the editor and the player need from a product.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  WC_Product $product The product.
	 * @return array<string,mixed> The product as the client sees it.
	 */
	private function present( $product ) {
		$image_id = $product->get_image_id();
		$image    = $image_id ? wp_get_attachment_image_url( $image_id, 'woocommerce_thumbnail' ) : '';

		if ( ! $image && function_exists( 'wc_placeholder_img_src' ) ) {
			$image = wc_placeholder_img_src( 'woocommerce_thumbnail' );
		}

		return array(
			'id'           => $product->get_id(),
			'name'         => $product->get_name(),
			'price_html'   => $product->get_price_html(),
			'image'        => (string) $image,
			'permalink'    => (string) $product->get_permalink(),
			'rating'       => (float) $product->get_average_rating(),
			'rating_count' => (int) $product->get_rating_count(),
			'in_stock'     => (bool) $product->is_in_stock(),
			'purchasable'  => (bool) ( $product->is_purchasable() && $product->is_type( 'simple' ) ),
		);
	}
}
