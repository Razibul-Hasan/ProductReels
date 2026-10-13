<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/admin
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
 * sidebar as three separate destinations: Widgets, Reels and Settings.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/admin
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Admin {

	/**
	 * The one admin page slug the app lives on.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const PAGE = 'productreels';

	/**
	 * Submenu slug => the hash route it sends the browser to.
	 *
	 * `productreels-new-widget` was the 1.0.0 "Create Widget" item. Since
	 * 1.1.0 it is a hidden page, kept so old links and bookmarks still land
	 * on the create screen.
	 *
	 * @since 1.0.0
	 * @var   array<string,string>
	 */
	const REDIRECTS = array(
		'productreels-reels'      => '#/reels',
		'productreels-new-widget' => '#/widgets/new',
		'productreels-settings'   => '#/settings',
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
	 * The admin title WordPress printed, split around the screen name.
	 *
	 * Filled by admin_title(), which runs before the scripts are enqueued, so
	 * the app can rename the tab per route in the site's own format.
	 *
	 * @since 1.1.0
	 * @var   array<string,string>|null
	 */
	private $title_parts = null;

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
	 * Register the ProductReels menu: Widgets, Reels and Settings.
	 *
	 * @since  1.0.0
	 * @since  1.1.0 Labels are Widgets, Reels and Settings; Create Widget is
	 *               a hidden page that still redirects.
	 * @return void
	 */
	public function register_menu() {
		add_menu_page(
			__( 'ProductReels', 'productreels' ),
			__( 'ProductReels', 'productreels' ),
			Productreels_Rest_Controller::CAPABILITY,
			self::PAGE,
			array( $this, 'render_app' ),
			'dashicons-format-video'
		);

		// Replaces the duplicate of the parent WordPress adds automatically.
		add_submenu_page(
			self::PAGE,
			__( 'Widgets', 'productreels' ),
			__( 'Widgets', 'productreels' ),
			Productreels_Rest_Controller::CAPABILITY,
			self::PAGE,
			array( $this, 'render_app' )
		);

		// Parent '' registers a page without a menu item: the 1.0.0 create
		// link keeps working with the same capability check.
		$pages = array(
			'productreels-reels'      => array( self::PAGE, __( 'Reels', 'productreels' ) ),
			'productreels-settings'   => array( self::PAGE, __( 'Settings', 'productreels' ) ),
			'productreels-new-widget' => array( '', __( 'Create widget', 'productreels' ) ),
		);

		foreach ( $pages as $slug => $page ) {
			list( $parent, $label ) = $page;

			$hook = add_submenu_page(
				$parent,
				$label,
				$label,
				Productreels_Rest_Controller::CAPABILITY,
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
		require PRODUCTREELS_PATH . 'admin/partials/productreels-admin-display.php';
	}

	/**
	 * Load the admin bundle, but only on a ProductReels screen.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function enqueue_assets() {
		if ( ! $this->is_productreels_screen() ) {
			return;
		}

		$asset_file = PRODUCTREELS_PATH . 'admin/dist/productreels-admin.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			add_action( 'admin_notices', array( $this, 'render_missing_build_notice' ) );

			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'productreels-admin',
			PRODUCTREELS_URL . 'admin/dist/productreels-admin.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'productreels-admin', 'productreels', PRODUCTREELS_PATH . 'languages' );

		wp_add_inline_script(
			'productreels-admin',
			'window.productreelsAdmin = ' . wp_json_encode( $this->bootstrap() ) . ';',
			'before'
		);

		// Archivo ships with the plugin and loads on ProductReels screens only:
		// never on the storefront, other admin screens or the block editor.
		wp_register_style(
			'productreels-admin-fonts',
			PRODUCTREELS_URL . 'admin/css/productreels-fonts.css',
			array(),
			PRODUCTREELS_VERSION
		);

		wp_enqueue_style(
			'productreels-admin',
			PRODUCTREELS_URL . 'admin/dist/style-productreels-admin.css',
			array( 'productreels-admin-fonts' ),
			$asset['version']
		);

		// The build emits a mirrored stylesheet; WordPress swaps it in for RTL locales.
		wp_style_add_data( 'productreels-admin', 'rtl', 'replace' );

		// The reel editor picks videos and posters out of the media library.
		wp_enqueue_media();
	}

	/**
	 * Drop the "Thank you for creating with WordPress" footer on our screens.
	 *
	 * The app draws its own chrome to the bottom edge; the core footer line
	 * underneath it reads as a stray. Every other admin screen keeps it.
	 *
	 * @since  1.0.0
	 * @param  string $text The footer text WordPress would print.
	 * @return string The text, or an empty string on a ProductReels screen.
	 */
	public function admin_footer_text( $text ) {
		return $this->is_productreels_screen() ? '' : $text;
	}

	/**
	 * Mark the body on our screens so the stylesheet can reclaim the room
	 * WordPress reserves around every screen.
	 *
	 * Core pads the bottom of `#wpbody-content` for the footer line this
	 * plugin hides, and gives `.wrap` a top margin. Left alone they show as a
	 * grey band under the app, and the page scrolls just to reveal it.
	 *
	 * @since  1.0.0
	 * @param  string $classes Space-separated body classes.
	 * @return string The classes, with ours added on a ProductReels screen.
	 */
	public function admin_body_class( $classes ) {
		if ( ! $this->is_productreels_screen() ) {
			return $classes;
		}

		return trim( $classes . ' productreels-screen' );
	}

	/**
	 * Name the browser tab "Widgets ‹ ProductReels ‹ Site — WordPress".
	 *
	 * WordPress titles the tab after the submenu item alone, so nothing says
	 * which plugin the screen belongs to once a few tabs are open. The plugin
	 * name goes after the screen name, the way WordPress nests its own
	 * screens. The title is also kept split around the screen name, so the app
	 * can rename the tab per hash route without guessing the site's format.
	 *
	 * @since  1.0.0
	 * @since  1.1.0 "Screen ‹ ProductReels ‹ …" instead of "ProductReels - Screen ‹ …".
	 * @param  string $admin_title The full title WordPress would print.
	 * @param  string $title       The screen name alone.
	 * @return string The title, with the plugin name on a ProductReels screen.
	 */
	public function admin_title( $admin_title, $title = '' ) {
		if ( ! $this->is_productreels_screen() ) {
			return $admin_title;
		}

		$title = (string) $title;
		$at    = '' === $title ? false : strpos( $admin_title, $title );

		// Another plugin rewrote the title: leave it as it is.
		if ( false === $at ) {
			return $admin_title;
		}

		$before = substr( $admin_title, 0, $at );
		$after  = ' &lsaquo; ' . __( 'ProductReels', 'productreels' ) . substr( $admin_title, $at + strlen( $title ) );

		$this->title_parts = array(
			'before' => html_entity_decode( $before, ENT_QUOTES, 'UTF-8' ),
			'after'  => html_entity_decode( $after, ENT_QUOTES, 'UTF-8' ),
		);

		return $before . $title . $after;
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
			esc_html__( 'The ProductReels admin bundle is missing. Run "npm install && npm run build" in the plugin folder.', 'productreels' )
		);
	}

	/**
	 * Whether the screen being rendered belongs to this plugin.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return bool Whether it does.
	 */
	private function is_productreels_screen() {
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
				'restUrl'    => esc_url_raw( rest_url() ),
				'nonce'      => wp_create_nonce( 'wp_rest' ),
				'defaults'   => Productreels_Settings::default_styles(),
				'settings'   => Productreels_Settings::all(),
				'version'    => PRODUCTREELS_VERSION,
				'logoUrl'    => PRODUCTREELS_URL . 'admin/images/logo.png',
				'title'      => $this->title_parts,
				// The reel editor's "WooCommerce is turned off" notice links here.
				'pluginsUrl' => current_user_can( 'activate_plugins' ) ? esc_url_raw( admin_url( 'plugins.php' ) ) : '',
			),
			Productreels_WooCommerce::bootstrap()
		);
	}
}
