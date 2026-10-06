<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://bestwebexpert.com
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Productreels_Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'PRODUCTREELS_VERSION' ) ) {
			$this->version = PRODUCTREELS_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'productreels';

		$this->load_dependencies();
		$this->define_core_hooks();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Productreels_Loader. Orchestrates the hooks of the plugin.
	 * - Productreels_Schema. Owns the table names and the DDL.
	 * - Productreels_Migrations. Keeps the database in step with the schema revision.
	 * - Productreels_Admin. Defines all hooks for the admin area.
	 * - Productreels_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-productreels-loader.php';

		/**
		 * The install layer: table definitions and the schema migration runner.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/install/class-productreels-schema.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/install/class-productreels-migrations.php';

		/**
		 * Support classes the data layer leans on.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-productreels-validator.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-productreels-rate-limiter.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-productreels-media.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-productreels-render-cache.php';

		/**
		 * Integrations: WooCommerce helpers (always), Elementor (only when it is there).
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/integrations/class-productreels-woocommerce.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/integrations/class-productreels-elementor.php';

		/**
		 * The data layer: the repository base, the five repositories and settings.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-productreels-repository.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-productreels-settings.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-productreels-files.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-productreels-clicks.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-productreels-reels.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-productreels-widgets.php';

		/**
		 * The REST layer: the base controller, one controller per resource, and
		 * the registrar that hooks them all to rest_api_init.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest-controller.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest-widgets.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest-reels.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest-products.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest-tracking.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest-settings.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-productreels-rest.php';

		/**
		 * The frontend layer: shortcodes and the block, both of which only print
		 * a mount node for the public bundle.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/frontend/class-productreels-shortcodes.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/frontend/class-productreels-block.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'admin/class-productreels-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'public/class-productreels-public.php';

		$this->loader = new Productreels_Loader();
	}

	/**
	 * Register the hooks that belong to neither the admin nor the public side.
	 *
	 * Runs the schema migration check on init at priority 5, before anything
	 * else in the plugin reads a ProductReels table, and registers the REST API.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_core_hooks() {

		$this->loader->add_action( 'init', 'Productreels_Migrations', 'maybe_upgrade', 5 );

		$plugin_rest = new Productreels_Rest();

		$this->loader->add_action( 'rest_api_init', $plugin_rest, 'register_routes' );

		// Every widget, reel or file write orphans the cached render payloads.
		Productreels_Render_Cache::register( $this->loader );

		// Placement: shortcodes, the block, and Elementor when it is active.
		$shortcodes = new Productreels_Shortcodes();
		$block      = new Productreels_Block();
		$elementor  = new Productreels_Elementor();

		$this->loader->add_action( 'init', $shortcodes, 'register' );
		$this->loader->add_action( 'init', $block, 'register' );
		$this->loader->add_action( 'plugins_loaded', $elementor, 'maybe_boot', 20 );
	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_admin_hooks() {

		$plugin_admin = new Productreels_Admin( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'admin_menu', $plugin_admin, 'register_menu' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_assets' );

		// Both halves of the core admin footer, on ProductReels screens only.
		$this->loader->add_filter( 'admin_footer_text', $plugin_admin, 'admin_footer_text', 99 );
		$this->loader->add_filter( 'update_footer', $plugin_admin, 'admin_footer_text', 99 );
		$this->loader->add_filter( 'admin_body_class', $plugin_admin, 'admin_body_class' );
		$this->loader->add_filter( 'admin_title', $plugin_admin, 'admin_title' );
	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {

		$plugin_public = new Productreels_Public( $this->get_plugin_name(), $this->get_version() );

		// Registered on every page, enqueued only when a mount node was printed.
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'register_assets' );
		$this->loader->add_action( 'wp_footer', $plugin_public, 'maybe_enqueue', 5 );
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
