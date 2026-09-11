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
 * @package    Wooreels
 * @subpackage Wooreels/includes
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
 * @package    Wooreels
 * @subpackage Wooreels/includes
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Wooreels_Loader    $loader    Maintains and registers all hooks for the plugin.
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
		if ( defined( 'WOOREELS_VERSION' ) ) {
			$this->version = WOOREELS_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'wooreels';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_core_hooks();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Wooreels_Loader. Orchestrates the hooks of the plugin.
	 * - Wooreels_I18n. Defines internationalization functionality.
	 * - Wooreels_Schema. Owns the table names and the DDL.
	 * - Wooreels_Migrations. Keeps the database in step with the schema revision.
	 * - Wooreels_Admin. Defines all hooks for the admin area.
	 * - Wooreels_Public. Defines all hooks for the public side of the site.
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
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-wooreels-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-wooreels-i18n.php';

		/**
		 * The install layer: table definitions and the schema migration runner.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/install/class-wooreels-schema.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/install/class-wooreels-migrations.php';

		/**
		 * Support classes the data layer leans on.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-wooreels-validator.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-wooreels-rate-limiter.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-wooreels-media.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/support/class-wooreels-render-cache.php';

		/**
		 * Integrations: WooCommerce helpers (always), Elementor (only when it is there).
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/integrations/class-wooreels-woocommerce.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/integrations/class-wooreels-elementor.php';

		/**
		 * The data layer: the repository base, the five repositories and settings.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-wooreels-repository.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-wooreels-settings.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-wooreels-files.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-wooreels-clicks.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-wooreels-reels.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/data/class-wooreels-widgets.php';

		/**
		 * The REST layer: the base controller, one controller per resource, and
		 * the registrar that hooks them all to rest_api_init.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-controller.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-widgets.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-reels.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-files.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-products.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-tracking.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest-settings.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/rest/class-wooreels-rest.php';

		/**
		 * The frontend layer: shortcodes and the block, both of which only print
		 * a mount node for the public bundle.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'includes/frontend/class-wooreels-shortcodes.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/frontend/class-wooreels-block.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'admin/class-wooreels-admin.php';

		/**
		 * The class responsible for defining all actions that occur in the public-facing
		 * side of the site.
		 */
		require_once plugin_dir_path( __DIR__ ) . 'public/class-wooreels-public.php';

		$this->loader = new Wooreels_Loader();
	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Wooreels_I18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function set_locale() {

		$plugin_i18n = new Wooreels_I18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );
	}

	/**
	 * Register the hooks that belong to neither the admin nor the public side.
	 *
	 * Runs the schema migration check on init at priority 5, before anything
	 * else in the plugin reads a WooReels table, and registers the REST API.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_core_hooks() {

		$this->loader->add_action( 'init', 'Wooreels_Migrations', 'maybe_upgrade', 5 );

		$plugin_rest = new Wooreels_Rest();

		$this->loader->add_action( 'rest_api_init', $plugin_rest, 'register_routes' );

		// Every widget, reel or file write orphans the cached render payloads.
		Wooreels_Render_Cache::register( $this->loader );

		// Placement: shortcodes, the block, and Elementor when it is active.
		$shortcodes = new Wooreels_Shortcodes();
		$block      = new Wooreels_Block();
		$elementor  = new Wooreels_Elementor();

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

		$plugin_admin = new Wooreels_Admin( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'admin_menu', $plugin_admin, 'register_menu' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_assets' );
	}

	/**
	 * Register all of the hooks related to the public-facing functionality
	 * of the plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function define_public_hooks() {

		$plugin_public = new Wooreels_Public( $this->get_plugin_name(), $this->get_version() );

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
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    Wooreels_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
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
