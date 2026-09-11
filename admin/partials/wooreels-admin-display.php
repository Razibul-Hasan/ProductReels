<?php
/**
 * The mount node for the WooReels admin app.
 *
 * Everything on this screen is rendered by React. The one piece of server
 * markup is a heading for screen readers and assistive technology, so the page
 * has a title before the bundle has parsed.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/admin/partials
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

?>
<div class="wrap wooreels-wrap">
	<h1 class="screen-reader-text"><?php esc_html_e( 'WooReels', 'wooreels' ); ?></h1>
	<div id="wooreels-admin-app"></div>
</div>
