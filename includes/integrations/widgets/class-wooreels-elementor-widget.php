<?php
/**
 * The WooReels Elementor widget.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/integrations/widgets
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * A select-a-widget control that renders the shortcode.
 *
 * Styling lives in the WooReels editor, not in Elementor's panel: the whole
 * point of a widget is that it looks the same wherever it is placed. The
 * widget list is read through rest_do_request() — the same API the admin
 * app uses — with a direct repository read as the fallback for an editor
 * who can place widgets but is not allowed to manage them.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/integrations/widgets
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Elementor_Widget extends \Elementor\Widget_Base {

	/**
	 * The widget's internal name.
	 *
	 * @since  1.0.0
	 * @return string The name.
	 */
	public function get_name() {
		return 'wooreels';
	}

	/**
	 * The title shown in the panel.
	 *
	 * @since  1.0.0
	 * @return string The title.
	 */
	public function get_title() {
		return __( 'WooReels', 'wooreels' );
	}

	/**
	 * The icon class; drawn by admin/css/wooreels-elementor.css.
	 *
	 * @since  1.0.0
	 * @return string The icon class.
	 */
	public function get_icon() {
		return 'wooreels-elementor-icon';
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
		return array( 'reels', 'video', 'shoppable', 'woocommerce', 'stories', 'wooreels' );
	}

	/**
	 * The public bundle, so Elementor loads it for the editor preview too.
	 *
	 * @since  1.0.0
	 * @return string[] Script handles.
	 */
	public function get_script_depends() {
		return array( Wooreels_Public::HANDLE );
	}

	/**
	 * The public stylesheet.
	 *
	 * @since  1.0.0
	 * @return string[] Style handles.
	 */
	public function get_style_depends() {
		return array( Wooreels_Public::HANDLE );
	}

	/**
	 * Register the controls: one select, one note.
	 *
	 * @since  1.0.0
	 * @return void
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'wooreels_section',
			array(
				'label' => __( 'WooReels', 'wooreels' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$options = $this->widget_options();

		$this->add_control(
			'widget_id',
			array(
				'label'       => __( 'Widget', 'wooreels' ),
				'type'        => \Elementor\Controls_Manager::SELECT2,
				'options'     => $options,
				'default'     => '',
				'label_block' => true,
				'description' => empty( $options )
					? __( "You haven't created any widget yet! Create one under WooReels in the WordPress admin.", 'wooreels' )
					: __( 'Choose a widget. Styling is done in the WooReels editor.', 'wooreels' ),
			)
		);

		$notice = array(
			'label'           => '',
			'raw'             => __( 'The reels render on the live page and inside this preview once a widget is chosen. Open the widget in WooReels to change its layout, colours or player behaviour.', 'wooreels' ),
			'content_classes' => 'elementor-descriptor',
		);

		if ( defined( '\Elementor\Controls_Manager::NOTICE' ) ) {
			$notice = array(
				'type'        => \Elementor\Controls_Manager::NOTICE,
				'notice_type' => 'info',
				'dismissible' => false,
				'heading'     => __( 'Preview', 'wooreels' ),
				'content'     => $notice['raw'],
			);
		} else {
			$notice['type'] = \Elementor\Controls_Manager::RAW_HTML;
		}

		$this->add_control( 'wooreels_notice', $notice );

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
					esc_html__( 'Choose a WooReels widget in the panel to show it here.', 'wooreels' )
				);
			}

			return;
		}

		echo do_shortcode( '[wooreels id="' . $widget_id . '"]' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- The shortcode returns escaped markup.
	}

	/**
	 * Widget id => label for every widget, for the select control.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return array<string,string> The options.
	 */
	private function widget_options() {
		$options = array();
		$items   = null;

		$request = new WP_REST_Request( 'GET', '/wooreels/v1/widgets' );

		$request->set_param( 'per_page', 100 );
		$request->set_param( 'orderby', 'name' );
		$request->set_param( 'order', 'ASC' );

		$response = rest_do_request( $request );

		if ( ! $response->is_error() ) {
			$items = $response->get_data();
		}

		if ( ! is_array( $items ) ) {
			// An editor without manage_options still needs the list to place a widget.
			$widgets = new Wooreels_Widgets();
			$items   = $widgets->paginate(
				array(
					'per_page' => 100,
					'orderby'  => 'name',
					'order'    => 'ASC',
				)
			)['items'];
		}

		foreach ( $items as $item ) {
			$options[ (string) $item['id'] ] = sprintf(
				/* translators: 1: widget name, 2: widget id. */
				__( '%1$s (#%2$d)', 'wooreels' ),
				$item['name'],
				$item['id']
			);
		}

		return $options;
	}
}
