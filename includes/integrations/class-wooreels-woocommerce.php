<?php
/**
 * Everything the plugin asks of WooCommerce, in one place.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/integrations
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Guards and small helpers around WooCommerce.
 *
 * WooReels works without WooCommerce — reels, widgets, custom links and
 * analytics all function — and only product tagging and add to cart need
 * the store. Every WooCommerce call in the plugin goes through here, so the
 * "is it there?" check lives in exactly one file.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/integrations
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_WooCommerce {

	/**
	 * Whether WooCommerce is active and its product API is loaded.
	 *
	 * @since  1.0.0
	 * @return bool Whether it is.
	 */
	public static function is_active() {
		return class_exists( 'WooCommerce' ) && function_exists( 'wc_get_products' );
	}

	/**
	 * The store's currency, or a neutral default without WooCommerce.
	 *
	 * @since  1.0.0
	 * @return array{code:string,symbol:string,position:string,decimals:int} The currency.
	 */
	public static function currency() {
		if ( ! function_exists( 'get_woocommerce_currency' ) ) {
			return array(
				'code'     => 'USD',
				'symbol'   => '$',
				'position' => 'left',
				'decimals' => 2,
			);
		}

		return array(
			'code'     => (string) get_woocommerce_currency(),
			'symbol'   => html_entity_decode( (string) get_woocommerce_currency_symbol() ),
			'position' => (string) get_option( 'woocommerce_currency_pos', 'left' ),
			'decimals' => (int) wc_get_price_decimals(),
		);
	}

	/**
	 * The Store API nonce the frontend sends with add-to-cart requests.
	 *
	 * @since  1.0.0
	 * @return string The nonce, or an empty string without WooCommerce.
	 */
	public static function store_api_nonce() {
		return self::is_active() ? wp_create_nonce( 'wc_store_api' ) : '';
	}

	/**
	 * Where "View cart" should send a visitor.
	 *
	 * @since  1.0.0
	 * @return string The cart URL, or an empty string without WooCommerce.
	 */
	public static function cart_url() {
		if ( ! self::is_active() || ! function_exists( 'wc_get_cart_url' ) ) {
			return '';
		}

		return (string) wc_get_cart_url();
	}

	/**
	 * The WooCommerce facts both JS bootstraps carry.
	 *
	 * @since  1.0.0
	 * @return array<string,mixed> hasWoo, currency, storeApiNonce, cartUrl.
	 */
	public static function bootstrap() {
		return array(
			'hasWoo'        => self::is_active(),
			'currency'      => self::currency(),
			'storeApiNonce' => self::store_api_nonce(),
			'cartUrl'       => esc_url_raw( self::cart_url() ),
		);
	}
}
