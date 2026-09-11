<?php
/**
 * Elementor integration bootstrap.
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
 * Registers the WooReels Elementor widget, but only when Elementor is there.
 *
 * The widget class extends Elementor's base class, so its file is required
 * only from inside Elementor's own registration hook — on a site without
 * Elementor it is never even read.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/integrations
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Elementor {

	/**
	 * The editor stylesheet handle carrying the panel icon.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const ICON_STYLE = 'wooreels-elementor-editor';

	/**
	 * Hook into Elementor if it has loaded.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function maybe_boot() {
		if ( ! did_action( 'elementor/loaded' ) ) {
			return;
		}

		add_action( 'elementor/widgets/register', array( $this, 'register_widget' ) );
		add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'enqueue_editor_styles' ) );
	}

	/**
	 * Register the widget with Elementor's widgets manager.
	 *
	 * @since  1.0.0
	 * @param  \Elementor\Widgets_Manager $manager Elementor's widgets manager.
	 * @return void
	 */
	public function register_widget( $manager ) {
		require_once WOOREELS_PATH . 'includes/integrations/widgets/class-wooreels-elementor-widget.php';

		$manager->register( new Wooreels_Elementor_Widget() );
	}

	/**
	 * The stylesheet that draws the widget's icon in the Elementor panel.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	public function enqueue_editor_styles() {
		wp_enqueue_style(
			self::ICON_STYLE,
			WOOREELS_URL . 'admin/css/wooreels-elementor.css',
			array(),
			WOOREELS_VERSION
		);
	}
}
