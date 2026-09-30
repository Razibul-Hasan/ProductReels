<?php
/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/public
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Owns the public bundle and the rule for when it loads.
 *
 * The script and stylesheet are registered on every frontend request but
 * enqueued only in the footer, and only when something on the page — a
 * shortcode, the block, the Elementor widget — has printed a mount node and
 * called request_assets(). A page with no reels loads zero ProductReels bytes.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/public
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Public {

	/**
	 * The script and style handle.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const HANDLE = 'productreels-public';

	/**
	 * Whether anything on this request has asked for the bundle.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    bool
	 */
	private static $requested = false;

	/**
	 * Whether the bundle has already been enqueued on this request.
	 *
	 * @since  1.0.0
	 * @access private
	 * @var    bool
	 */
	private static $enqueued = false;

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since 1.0.0
	 * @param string $plugin_name The name of the plugin.
	 * @param string $version     The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Note that this page needs the bundle.
	 *
	 * Called by whatever prints a mount node. Safe to call any number of
	 * times and at any point in the request: if the footer has already run,
	 * the assets are enqueued on the spot so a late mount node is not left
	 * without its renderer.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public static function request_assets() {
		self::$requested = true;

		if ( did_action( 'wp_footer' ) && ! self::$enqueued ) {
			self::enqueue();
		}
	}

	/**
	 * Register the bundle so it can be enqueued later.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_assets() {
		$asset_file = PRODUCTREELS_PATH . 'public/dist/productreels-public.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_register_script(
			self::HANDLE,
			PRODUCTREELS_URL . 'public/dist/productreels-public.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( self::HANDLE, 'productreels', PRODUCTREELS_PATH . 'languages' );

		wp_add_inline_script(
			self::HANDLE,
			'window.productreelsPublic = ' . wp_json_encode( $this->bootstrap() ) . ';',
			'before'
		);

		wp_register_style(
			self::HANDLE,
			PRODUCTREELS_URL . 'public/dist/style-productreels-public.css',
			array(),
			$asset['version']
		);

		wp_style_add_data( self::HANDLE, 'rtl', 'replace' );
	}

	/**
	 * Enqueue the bundle in the footer if the page asked for it.
	 *
	 * Runs early on wp_footer so the tags are printed with the rest of the
	 * footer scripts and styles.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function maybe_enqueue() {
		if ( self::$requested ) {
			self::enqueue();
		}
	}

	/**
	 * Enqueue the script and stylesheet once.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private static function enqueue() {
		if ( self::$enqueued ) {
			return;
		}

		self::$enqueued = true;

		wp_enqueue_script( self::HANDLE );
		wp_enqueue_style( self::HANDLE );
	}

	/**
	 * Everything the public bundle needs to know before its first render.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return array<string,mixed> The bootstrap payload.
	 */
	private function bootstrap() {
		return array_merge(
			array(
				'restUrl'   => esc_url_raw( rest_url() ),
				'apiBase'   => esc_url_raw( rest_url( 'productreels/v1/' ) ),
				'pluginUrl' => esc_url_raw( PRODUCTREELS_URL ),
				// Issued to logged-out visitors too: it is what lets the site's own
				// pages read a widget when public fetch is switched off.
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'defaults'  => Productreels_Settings::default_styles(),
				'version'   => PRODUCTREELS_VERSION,
			),
			Productreels_WooCommerce::bootstrap()
		);
	}
}
