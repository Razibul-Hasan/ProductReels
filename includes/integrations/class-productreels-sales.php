<?php
/**
 * Sales that came from a reel.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.1.1
 *
 * @package    Productreels
 * @subpackage Productreels/includes/integrations
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Follows a product from a reel's Add to cart to a paid order.
 *
 * 1. The player's add-to-cart request (the Store API's /cart/add-item) carries
 *    `productreels_reel` and `productreels_widget` in its query string. When
 *    WooCommerce adds the item, the pair is kept in the shopper's WooCommerce
 *    session against that cart item. Nothing is added to the cart item
 *    itself, so the same product added from a reel and from the shop page
 *    stays one line.
 * 2. At checkout (classic or block) each order line from such a cart item
 *    gets hidden meta naming the reel and widget.
 * 3. When the order is paid, those lines are written to the sales table;
 *    when it is cancelled, refunded, failed or deleted, they are removed.
 *
 * Everything stays in this site's database. No visitor data is stored: a
 * sales row is an order line, a reel and a widget.
 *
 * @since      1.1.1
 * @package    Productreels
 * @subpackage Productreels/includes/integrations
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Sales {

	/**
	 * The WooCommerce session key holding { cart item key: { reel, widget } }.
	 *
	 * @since 1.1.1
	 * @var   string
	 */
	const SESSION_KEY = 'productreels_attribution';

	/**
	 * Order item meta naming the reel and the widget.
	 *
	 * @since 1.1.1
	 * @var   string
	 */
	const REEL_META   = '_productreels_reel_id';
	const WIDGET_META = '_productreels_widget_id';

	/**
	 * The most cart items one session remembers.
	 *
	 * @since 1.1.1
	 * @var   int
	 */
	const SESSION_LIMIT = 50;

	/**
	 * Order statuses that take an order's lines back out of the numbers.
	 *
	 * @since 1.1.1
	 * @var   string[]
	 */
	const VOID_STATUSES = array( 'cancelled', 'refunded', 'failed' );

	/**
	 * Hook into WooCommerce. Without it none of these actions fire.
	 *
	 * @since  1.1.1
	 * @param  Productreels_Loader $loader The hook collector.
	 * @return void
	 */
	public static function register( $loader ) {
		$loader->add_action( 'woocommerce_add_to_cart', 'Productreels_Sales', 'remember', 10, 4 );
		$loader->add_action( 'woocommerce_checkout_create_order_line_item', 'Productreels_Sales', 'tag_line', 10, 2 );
		$loader->add_action( 'woocommerce_cart_emptied', 'Productreels_Sales', 'forget_session' );
		$loader->add_action( 'woocommerce_payment_complete', 'Productreels_Sales', 'record_order' );
		$loader->add_action( 'woocommerce_order_status_changed', 'Productreels_Sales', 'status_changed', 10, 3 );
		$loader->add_action( 'woocommerce_delete_order', 'Productreels_Sales', 'remove_order' );
	}

	/**
	 * Remember which reel a cart item came from.
	 *
	 * Only when the request names a reel that tags the product and a widget
	 * that can show it (or 0, the single-reel shortcode).
	 *
	 * @since  1.1.1
	 * @param  string $cart_item_key The cart item.
	 * @param  int    $product_id    The product (the parent of a variation).
	 * @param  int    $quantity      Unused.
	 * @param  int    $variation_id  The variation, or 0.
	 * @return void
	 */
	public static function remember( $cart_item_key, $product_id, $quantity = 1, $variation_id = 0 ) {
		// The Store API checked its own nonce; these only label the item.
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['productreels_reel'] ) || ! function_exists( 'WC' ) || ! WC()->session ) {
			return;
		}

		$reel_id   = absint( wp_unslash( $_GET['productreels_reel'] ) );
		$widget_id = isset( $_GET['productreels_widget'] ) ? absint( wp_unslash( $_GET['productreels_widget'] ) ) : 0;
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		// A reel tags the parent product, or now and then one variation.
		if ( ! self::reel_tags( $reel_id, (int) $product_id ) && ! self::reel_tags( $reel_id, (int) $variation_id ) ) {
			return;
		}

		if ( $widget_id > 0 && ! ( new Productreels_Widgets() )->shows_reel( $widget_id, $reel_id ) ) {
			return;
		}

		$map = WC()->session->get( self::SESSION_KEY );
		$map = is_array( $map ) ? $map : array();

		unset( $map[ $cart_item_key ] );

		$map[ (string) $cart_item_key ] = array(
			'reel'   => $reel_id,
			'widget' => $widget_id,
		);

		WC()->session->set( self::SESSION_KEY, array_slice( $map, -self::SESSION_LIMIT, null, true ) );
	}

	/**
	 * Label an order line that came from a reel.
	 *
	 * @since  1.1.1
	 * @param  WC_Order_Item_Product $item          The new order line.
	 * @param  string                $cart_item_key The cart item it came from.
	 * @return void
	 */
	public static function tag_line( $item, $cart_item_key ) {
		if ( ! function_exists( 'WC' ) || ! WC()->session ) {
			return;
		}

		$map = WC()->session->get( self::SESSION_KEY );

		if ( ! is_array( $map ) || ! isset( $map[ $cart_item_key ] ) ) {
			return;
		}

		$item->add_meta_data( self::REEL_META, (int) $map[ $cart_item_key ]['reel'], true );
		$item->add_meta_data( self::WIDGET_META, (int) $map[ $cart_item_key ]['widget'], true );
	}

	/**
	 * The cart is empty (an order was placed, or the shopper cleared it).
	 *
	 * @since  1.1.1
	 * @return void
	 */
	public static function forget_session() {
		if ( function_exists( 'WC' ) && WC()->session ) {
			WC()->session->set( self::SESSION_KEY, null );
		}
	}

	/**
	 * Follow an order's status into or out of the numbers.
	 *
	 * @since  1.1.1
	 * @param  int    $order_id The order.
	 * @param  string $from     The old status.
	 * @param  string $to       The new status.
	 * @return void
	 */
	public static function status_changed( $order_id, $from, $to ) {
		if ( in_array( $to, self::VOID_STATUSES, true ) ) {
			self::remove_order( $order_id );
			return;
		}

		if ( function_exists( 'wc_get_is_paid_statuses' ) && in_array( $to, wc_get_is_paid_statuses(), true ) ) {
			self::record_order( $order_id );
		}
	}

	/**
	 * Write a paid order's reel lines to the sales table. Safe to repeat:
	 * a line already there is left alone.
	 *
	 * @since  1.1.1
	 * @param  int $order_id The order.
	 * @return void
	 */
	public static function record_order( $order_id ) {
		global $wpdb;

		$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : null;

		if ( ! $order || ! is_callable( array( $order, 'get_items' ) ) ) {
			return;
		}

		$created = $order->get_date_created();
		$day     = $created ? $created->date( 'Y-m-d' ) : Productreels_Stats::today();
		$table   = Productreels_Schema::table( 'sales' );

		foreach ( $order->get_items() as $item_id => $item ) {
			$reel_id = (int) $item->get_meta( self::REEL_META );

			if ( $reel_id < 1 || ! is_callable( array( $item, 'get_product_id' ) ) ) {
				continue;
			}

			$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->prepare(
					"INSERT IGNORE INTO `{$table}` (order_id, item_id, widget_id, reel_id, product_id, quantity, revenue, day) VALUES (%d, %d, %d, %d, %d, %d, %f, %s)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					(int) $order->get_id(),
					(int) $item_id,
					(int) $item->get_meta( self::WIDGET_META ),
					$reel_id,
					(int) $item->get_product_id(),
					max( 1, (int) $item->get_quantity() ),
					(float) $item->get_total(),
					$day
				)
			);
		}
	}

	/**
	 * Take an order's lines back out of the numbers.
	 *
	 * @since  1.1.1
	 * @param  int $order_id The order.
	 * @return void
	 */
	public static function remove_order( $order_id ) {
		global $wpdb;

		$wpdb->delete( Productreels_Schema::table( 'sales' ), array( 'order_id' => (int) $order_id ), array( '%d' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Whether a reel tags a product.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  int $reel_id    The reel.
	 * @param  int $product_id The product.
	 * @return bool Whether it does.
	 */
	private static function reel_tags( $reel_id, $product_id ) {
		if ( $reel_id < 1 || $product_id < 1 ) {
			return false;
		}

		$reel = ( new Productreels_Reels() )->find( $reel_id );

		foreach ( null === $reel ? array() : (array) $reel['links'] as $link ) {
			if ( isset( $link['btn_type'], $link['product_id'] ) && 'product' === $link['btn_type'] && (int) $link['product_id'] === $product_id ) {
				return true;
			}
		}

		return false;
	}
}
