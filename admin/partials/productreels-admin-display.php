<?php
/**
 * The mount node for the ProductReels admin app.
 *
 * Everything on this screen is rendered by React. The one piece of server
 * markup is a heading for screen readers and assistive technology, so the page
 * has a title before the bundle has parsed.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/admin/partials
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

?>
<div class="wrap productreels-wrap">
	<h1 class="screen-reader-text"><?php esc_html_e( 'ProductReels', 'productreels' ); ?></h1>
	<div id="productreels-admin-app"></div>
</div>
