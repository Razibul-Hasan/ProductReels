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
 * @author     bestwpexpert <https://bestwebexpert.com/>
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
		return __( 'ProductReels', 'productreels' );
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
				'label' => __( 'ProductReels', 'productreels' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'widget_id',
			array(
				'label'       => __( 'Widget', 'productreels' ),
				'type'        => \Elementor\Controls_Manager::SELECT2,
				'options'     => $this->widget_options(),
				'default'     => '',
				'label_block' => true,
				'description' => $this->widgets_hint(),
			)
		);

		$notice = array(
			'label'           => '',
			'raw'             => __( 'The reels render on the live page and inside this preview once a widget is chosen. Open the widget in ProductReels to change its layout, colours or player behaviour.', 'productreels' ),
			'content_classes' => 'elementor-descriptor',
		);

		if ( defined( '\Elementor\Controls_Manager::NOTICE' ) ) {
			$notice = array(
				'type'        => \Elementor\Controls_Manager::NOTICE,
				'notice_type' => 'info',
				'dismissible' => false,
				'heading'     => __( 'Preview', 'productreels' ),
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
			// Only in Elementor's editor: a visitor never sees an empty slot.
			if ( \Elementor\Plugin::$instance->editor->is_edit_mode() ) {
				printf(
					'<div class="prs prs-builder-hint"><strong>%1$s</strong><span>%2$s</span></div>',
					esc_html__( 'ProductReels', 'productreels' ),
					esc_html__( 'Choose a widget in the panel.', 'productreels' )
				);
			}

			return;
		}

		echo do_shortcode( '[productreels id="' . $widget_id . '"]' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- The shortcode returns escaped markup.
	}

	/**
	 * The line under the select: where widgets are made.
	 *
	 * A link into ProductReels for people who can open it; the same sentence
	 * as plain text for an editor who can place widgets but not make them.
	 *
	 * @since  1.1.0
	 * @access private
	 * @return string Description HTML (escaped).
	 */
	private function widgets_hint() {
		if ( ! current_user_can( Productreels_Rest_Controller::CAPABILITY ) ) {
			return esc_html__( 'Create widgets in ProductReels → Widgets.', 'productreels' );
		}

		return sprintf(
			/* translators: %s: "ProductReels → Widgets", linked to the Widgets screen. */
			esc_html__( 'Create widgets in %s.', 'productreels' ),
			sprintf(
				'<a href="%1$s" target="_blank" rel="noopener">%2$s</a>',
				esc_url( admin_url( 'admin.php?page=productreels#/widgets' ) ),
				esc_html__( 'ProductReels → Widgets', 'productreels' )
			)
		);
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
				__( '%1$s (#%2$d)', 'productreels' ),
				$item['name'],
				$item['id']
			);
		}

		return $options;
	}
}
