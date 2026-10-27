<?php
/**
 * Widgets placed on every WooCommerce product page.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.1.1
 *
 * @package    Productreels
 * @subpackage Productreels/includes/frontend
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Prints a widget's mount node at a chosen spot on every product page.
 *
 * A widget opts in with its `productPage` style (show, position). Which
 * widgets did is kept in one small option, rebuilt whenever a widget is
 * saved or deleted, so a product page reads one autoloaded option instead
 * of every widget's styles. The hooks are WooCommerce's own single-product
 * actions, which block themes fire too through WooCommerce's template
 * compatibility layer. Without WooCommerce they never fire.
 *
 * @since      1.1.1
 * @package    Productreels
 * @subpackage Productreels/includes/frontend
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Product_Pages {

	/**
	 * The option holding the placed widgets: a list of { id, position }.
	 *
	 * @since 1.1.1
	 * @var   string
	 */
	const OPTION = 'productreels_product_page_widgets';

	/**
	 * Each position and the WooCommerce action and priority it prints at.
	 *
	 * @since 1.1.1
	 * @var   array<string,array{0:string,1:int}>
	 */
	const POSITIONS = array(
		'before_product' => array( 'woocommerce_before_single_product', 20 ),
		'after_cart'     => array( 'woocommerce_single_product_summary', 35 ),
		'before_tabs'    => array( 'woocommerce_after_single_product_summary', 5 ),
		'after_tabs'     => array( 'woocommerce_after_single_product_summary', 12 ),
		'after_product'  => array( 'woocommerce_after_single_product', 20 ),
	);

	/**
	 * Widgets already printed on this request, so a theme that fires a hook
	 * twice still shows each widget once.
	 *
	 * @since  1.1.1
	 * @access private
	 * @var    array<int,bool>
	 */
	private static $printed = array();

	/**
	 * Hook every position, and the index rebuild to every widget write.
	 *
	 * @since  1.1.1
	 * @param  Productreels_Loader $loader The hook collector.
	 * @return void
	 */
	public static function register( $loader ) {
		foreach ( self::POSITIONS as $position => $hook ) {
			$loader->add_action( $hook[0], 'Productreels_Product_Pages', 'print_' . $position, $hook[1] );
		}

		foreach ( array( 'productreels_widget_created', 'productreels_widget_updated', 'productreels_widget_deleted' ) as $event ) {
			$loader->add_action( $event, 'Productreels_Product_Pages', 'rebuild' );
		}
	}

	/**
	 * Above the product.
	 *
	 * @since  1.1.1
	 * @return void
	 */
	public static function print_before_product() {
		self::print_position( 'before_product' );
	}

	/**
	 * In the summary, under Add to cart.
	 *
	 * @since  1.1.1
	 * @return void
	 */
	public static function print_after_cart() {
		self::print_position( 'after_cart' );
	}

	/**
	 * Below the product, above the tabs.
	 *
	 * @since  1.1.1
	 * @return void
	 */
	public static function print_before_tabs() {
		self::print_position( 'before_tabs' );
	}

	/**
	 * Below the tabs, above related products.
	 *
	 * @since  1.1.1
	 * @return void
	 */
	public static function print_after_tabs() {
		self::print_position( 'after_tabs' );
	}

	/**
	 * At the end of the product page.
	 *
	 * @since  1.1.1
	 * @return void
	 */
	public static function print_after_product() {
		self::print_position( 'after_product' );
	}

	/**
	 * Print the widgets placed at one position.
	 *
	 * @since  1.1.1
	 * @access private
	 * @param  string $position A key of POSITIONS.
	 * @return void
	 */
	private static function print_position( $position ) {
		if ( ! function_exists( 'is_product' ) || ! is_product() ) {
			return;
		}

		foreach ( self::placed() as $placed ) {
			if ( $placed['position'] !== $position || isset( self::$printed[ $placed['id'] ] ) ) {
				continue;
			}

			self::$printed[ $placed['id'] ] = true;

			$markup = Productreels_Shortcodes::widget_markup( $placed['id'] );

			if ( '' === $markup ) {
				continue;
			}

			printf(
				'<div class="prs-product-page prs-product-page--%1$s">%2$s</div>',
				esc_attr( str_replace( '_', '-', $position ) ),
				$markup // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- widget_markup() escapes every value it prints.
			);
		}
	}

	/**
	 * The widgets placed on product pages, from the option or rebuilt into it.
	 *
	 * @since  1.1.1
	 * @return array<int,array{id:int,position:string}> The placements.
	 */
	public static function placed() {
		$placed = get_option( self::OPTION, null );

		return is_array( $placed ) ? $placed : self::rebuild();
	}

	/**
	 * Read every widget's `productPage` style and store the ones that show.
	 *
	 * @since  1.1.1
	 * @return array<int,array{id:int,position:string}> The placements.
	 */
	public static function rebuild() {
		global $wpdb;

		$table = Productreels_Schema::table( 'widgets' );

		// Every widget that mentions the key; the JSON decides the rest.
		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare( "SELECT id, styles_json FROM `{$table}` WHERE styles_json LIKE %s ORDER BY id ASC", '%' . $wpdb->esc_like( '"productPage"' ) . '%' ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			ARRAY_A
		);

		$placed = array();

		foreach ( (array) $rows as $row ) {
			$styles = json_decode( (string) $row['styles_json'], true );
			$page   = is_array( $styles ) && isset( $styles['productPage'] ) && is_array( $styles['productPage'] ) ? $styles['productPage'] : array();

			if ( empty( $page['show'] ) ) {
				continue;
			}

			$placed[] = array(
				'id'       => (int) $row['id'],
				'position' => Productreels_Validator::enum(
					isset( $page['position'] ) ? $page['position'] : '',
					array_keys( self::POSITIONS ),
					'before_tabs'
				),
			);
		}

		update_option( self::OPTION, $placed, true );

		return $placed;
	}
}
