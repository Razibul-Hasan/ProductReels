<?php
/**
 * REST routes for WooCommerce product lookup.
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
 * @package    Productreels
 * @subpackage Productreels/includes/rest
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Rest_Products extends Productreels_Rest_Controller {

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
	 * Since 1.1.0 a search matches the SKU as well as the name, through the
	 * same product search WooCommerce's own admin uses, and each item carries
	 * its `sku`.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response The response.
	 */
	public function get_items( $request ) {
		if ( ! Productreels_WooCommerce::is_active() ) {
			return $this->empty_list();
		}

		$search = (string) $request->get_param( 'search' );
		$args   = array(
			'status'   => 'publish',
			'limit'    => (int) $request->get_param( 'per_page' ),
			'page'     => (int) $request->get_param( 'page' ),
			'paginate' => true,
		);

		if ( '' !== $search ) {
			$ids = $this->search_ids( $search );

			if ( null === $ids ) {
				$args['s'] = $search;
			} elseif ( empty( $ids ) ) {
				return $this->empty_list();
			} else {
				$args['include'] = $ids;
			}
		}

		$results = wc_get_products( $args );

		$items = array();

		foreach ( $results->products as $product ) {
			$item        = $this->present( $product );
			$item['sku'] = (string) $product->get_sku();
			$items[]     = $item;
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
		if ( ! Productreels_WooCommerce::is_active() ) {
			return $this->empty_list();
		}

		$ids = array_values( array_unique( array_filter( array_map( 'absint', (array) $request->get_param( 'ids' ) ) ) ) );

		if ( empty( $ids ) ) {
			return $this->empty_list();
		}

		sort( $ids );

		$ids       = array_slice( $ids, 0, 100 );
		$cache_key = 'productreels_products_' . md5( implode( ',', $ids ) );
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
	 * Ids of the products whose name, description or SKU match a search.
	 *
	 * @since  1.1.0
	 * @access private
	 * @param  string $search The search term.
	 * @return int[]|null The ids, or null when the product data store can't
	 *                    search (the caller falls back to a title search).
	 */
	private function search_ids( $search ) {
		try {
			$store = WC_Data_Store::load( 'product' );
		} catch ( Exception $e ) {
			return null;
		}

		if ( ! is_callable( array( $store, 'search_products' ) ) ) {
			return null;
		}

		return array_values( array_filter( array_map( 'absint', (array) $store->search_products( wc_clean( $search ), '', false, false ) ) ) );
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
