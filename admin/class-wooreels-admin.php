<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/admin
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Owns the admin menu, the single mount node and the admin bundle.
 *
 * The whole admin is one React app on one WordPress screen. The extra menu
 * items are real WordPress submenus whose only job is to redirect to a hash
 * route on that screen, which is what lets a single-page app appear in the
 * sidebar as four separate destinations.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/admin
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Admin {

	/**
	 * The one admin page slug the app lives on.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const PAGE = 'wooreels';

	/**
	 * Submenu slug => the hash route it sends the browser to.
	 *
	 * @since 1.0.0
	 * @var   array<string,string>
	 */
	const REDIRECTS = array(
		'wooreels-reels'      => '#/reels',
		'wooreels-new-widget' => '#/widgets/new',
		'wooreels-settings'   => '#/settings',
	);

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The current version of the plugin.
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
	 * @param string $plugin_name The name of this plugin.
	 * @param string $version     The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Register the WooReels menu and its four submenu items.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function register_menu() {
		add_menu_page(
			__( 'WooReels', 'wooreels' ),
			__( 'WooReels', 'wooreels' ),
			Wooreels_Rest_Controller::CAPABILITY,
			self::PAGE,
			array( $this, 'render_app' ),
			'dashicons-format-video',
			25
		);

		// Replaces the duplicate of the parent WordPress adds automatically.
		add_submenu_page(
			self::PAGE,
			__( 'All Widgets', 'wooreels' ),
			__( 'All Widgets', 'wooreels' ),
			Wooreels_Rest_Controller::CAPABILITY,
			self::PAGE,
			array( $this, 'render_app' )
		);

		$labels = array(
			'wooreels-reels'      => __( 'All Reels', 'wooreels' ),
			'wooreels-new-widget' => __( 'Create Widget', 'wooreels' ),
			'wooreels-settings'   => __( 'Settings', 'wooreels' ),
		);

		foreach ( $labels as $slug => $label ) {
			$hook = add_submenu_page(
				self::PAGE,
				$label,
				$label,
				Wooreels_Rest_Controller::CAPABILITY,
				$slug,
				'__return_null'
			);

			if ( $hook ) {
				// Redirect on load, before a single byte of markup is sent.
				add_action( 'load-' . $hook, array( $this, 'redirect_to_route' ) );
			}
		}
	}

	/**
	 * Send a submenu request on to its hash route on the app screen.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function redirect_to_route() {
		$screen = get_current_screen();

		if ( ! $screen instanceof WP_Screen ) {
			return;
		}

		foreach ( self::REDIRECTS as $slug => $route ) {
			if ( false === strpos( $screen->id, $slug ) ) {
				continue;
			}

			wp_safe_redirect( admin_url( 'admin.php?page=' . self::PAGE ) . $route );
			exit;
		}
	}

	/**
	 * Render the single mount node the React app takes over.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function render_app() {
		require WOOREELS_PATH . 'admin/partials/wooreels-admin-display.php';
	}

	/**
	 * Load the admin bundle, but only on a WooReels screen.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function enqueue_assets() {
		if ( ! $this->is_wooreels_screen() ) {
			return;
		}

		$asset_file = WOOREELS_PATH . 'admin/dist/wooreels-admin.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			add_action( 'admin_notices', array( $this, 'render_missing_build_notice' ) );

			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'wooreels-admin',
			WOOREELS_URL . 'admin/dist/wooreels-admin.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'wooreels-admin', 'wooreels', WOOREELS_PATH . 'languages' );

		wp_add_inline_script(
			'wooreels-admin',
			'window.wooreelsAdmin = ' . wp_json_encode( $this->bootstrap() ) . ';',
			'before'
		);

		wp_enqueue_style(
			'wooreels-admin',
			WOOREELS_URL . 'admin/dist/style-wooreels-admin.css',
			array(),
			$asset['version']
		);

		// The build emits a mirrored stylesheet; WordPress swaps it in for RTL locales.
		wp_style_add_data( 'wooreels-admin', 'rtl', 'replace' );

		// The reel editor picks videos and posters out of the media library.
		wp_enqueue_media();
	}

	/**
	 * Tell an administrator the bundle has not been built yet.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function render_missing_build_notice() {
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html__( 'The WooReels admin bundle is missing. Run "npm install && npm run build" in the plugin folder.', 'wooreels' )
		);
	}

	/**
	 * Whether the screen being rendered belongs to this plugin.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return bool Whether it does.
	 */
	private function is_wooreels_screen() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen = get_current_screen();

		return $screen instanceof WP_Screen && false !== strpos( $screen->id, self::PAGE );
	}

	/**
	 * Everything the React app needs to know before its first render.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return array<string,mixed> The bootstrap payload.
	 */
	private function bootstrap() {
		return array_merge(
			array(
				'restUrl'      => esc_url_raw( rest_url() ),
				'apiBase'      => esc_url_raw( rest_url( 'wooreels/v1/' ) ),
				'pluginUrl'    => esc_url_raw( WOOREELS_URL ),
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'adminUrl'     => esc_url_raw( admin_url( 'admin.php?page=' . self::PAGE ) ),
				'capabilities' => array(
					'manage' => current_user_can( Wooreels_Rest_Controller::CAPABILITY ),
				),
				'defaults'     => Wooreels_Settings::default_styles(),
				'settings'     => Wooreels_Settings::all(),
				'version'      => WOOREELS_VERSION,
			),
			Wooreels_WooCommerce::bootstrap()
		);
	}
}
