<?php
/**
 * The ProductReels Elementor widget.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/integrations/widgets
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * A select-a-widget control that renders the shortcode.
 *
 * Styling lives in the ProductReels editor, not in Elementor's panel: the whole
 * point of a widget is that it looks the same wherever it is placed. The
 * select lists widgets by name and id, read straight from the repository;
 * Elementor has already decided that the current user may edit this page.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/integrations/widgets
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Productreels_Elementor_Widget extends \Elementor\Widget_Base {

	/**
	 * The widget's internal name.
	 *
	 * @since  1.0.0
	 * @return string The name.
	 */
	public function get_name() {
		return 'productreels';
	}

	/**
	 * The title shown in the panel.
	 *
	 * @since  1.0.0
	 * @return string The title.
	 */
	public function get_title() {
		return __( 'ProductReels', 'productreels-shoppable-video-reels-for-woocommerce' );
	}

	/**
	 * The icon class; drawn by admin/css/productreels-elementor.css.
	 *
	 * @since  1.0.0
	 * @return string The icon class.
	 */
	public function get_icon() {
		return 'productreels-elementor-icon';
	}

	/**
	 * Where the widget sits in the panel.
	 *
	 * @since  1.0.0
	 * @return string[] Category slugs.
	 */
	public function get_categories() {
		return array( 'general' );
	}

	/**
	 * Words the panel search should match.
	 *
	 * @since  1.0.0
	 * @return string[] Keywords.
	 */
	public function get_keywords() {
		return array( 'reels', 'video', 'shoppable', 'woocommerce', 'stories', 'productreels' );
	}

	/**
	 * The public bundle, so Elementor loads it for the editor preview too.
	 *
	 * @since  1.0.0
	 * @return string[] Script handles.
	 */
	public function get_script_depends() {
		return array( Productreels_Public::HANDLE );
	}

	/**
	 * The public stylesheet.
	 *
	 * @since  1.0.0
	 * @return string[] Style handles.
	 */
	public function get_style_depends() {
		return array( Productreels_Public::HANDLE );
	}

	/**
	 * Register the controls: one select, one note.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'productreels_section',
			array(
				'label' => __( 'ProductReels', 'productreels-shoppable-video-reels-for-woocommerce' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$options = $this->widget_options();

		$this->add_control(
			'widget_id',
			array(
				'label'       => __( 'Widget', 'productreels-shoppable-video-reels-for-woocommerce' ),
				'type'        => \Elementor\Controls_Manager::SELECT2,
				'options'     => $options,
				'default'     => '',
				'label_block' => true,
				'description' => empty( $options )
					? __( "You haven't created any widget yet! Create one under ProductReels in the WordPress admin.", 'productreels-shoppable-video-reels-for-woocommerce' )
					: __( 'Choose a widget. Styling is done in the ProductReels editor.', 'productreels-shoppable-video-reels-for-woocommerce' ),
			)
		);

		$notice = array(
			'label'           => '',
			'raw'             => __( 'The reels render on the live page and inside this preview once a widget is chosen. Open the widget in ProductReels to change its layout, colours or player behaviour.', 'productreels-shoppable-video-reels-for-woocommerce' ),
			'content_classes' => 'elementor-descriptor',
		);

		if ( defined( '\Elementor\Controls_Manager::NOTICE' ) ) {
			$notice = array(
				'type'        => \Elementor\Controls_Manager::NOTICE,
				'notice_type' => 'info',
				'dismissible' => false,
				'heading'     => __( 'Preview', 'productreels-shoppable-video-reels-for-woocommerce' ),
				'content'     => $notice['raw'],
			);
		} else {
			$notice['type'] = \Elementor\Controls_Manager::RAW_HTML;
		}

		$this->add_control( 'productreels_notice', $notice );

		$this->end_controls_section();
	}

	/**
	 * Render the mount node through the shortcode.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	protected function render() {
		$settings  = $this->get_settings_for_display();
		$widget_id = isset( $settings['widget_id'] ) ? absint( $settings['widget_id'] ) : 0;

		if ( $widget_id < 1 ) {
			if ( \Elementor\Plugin::$instance->editor->is_edit_mode() ) {
				printf(
					'<p style="padding:16px;border:1px dashed #d1d5db;border-radius:6px;font-size:13px;color:#6b7280;text-align:center;">%s</p>',
					esc_html__( 'Choose a ProductReels widget in the panel to show it here.', 'productreels-shoppable-video-reels-for-woocommerce' )
				);
			}

			return;
		}

		echo do_shortcode( '[productreels id="' . $widget_id . '"]' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- The shortcode returns escaped markup.
	}

	/**
	 * Widget id => label for every widget, for the select control.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return array<string,string> The options.
	 */
	private function widget_options() {
		$widgets = new Productreels_Widgets();
		$page    = $widgets->paginate(
			array(
				'per_page' => 100,
				'orderby'  => 'name',
				'order'    => 'ASC',
			)
		);
		$options = array();

		foreach ( $page['items'] as $item ) {
			$options[ (string) $item['id'] ] = sprintf(
				/* translators: 1: widget name, 2: widget id. */
				__( '%1$s (#%2$d)', 'productreels-shoppable-video-reels-for-woocommerce' ),
				$item['name'],
				$item['id']
			);
		}

		return $options;
	}
}
