<?php
/**
 * The seasonal banner on the Widgets screen.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.1.2
 *
 * @package    Productreels
 * @subpackage Productreels/includes/support
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * One campaign at a time: who sees it, until when, and who has hidden it.
 *
 * The banner shows only inside the ProductReels app (the admin bundle loads on
 * no other screen), only to people who can manage the plugin, only until the
 * campaign's last day ends in the site's timezone, and never again for a
 * person once they dismiss it. Dismissals are kept per user, by campaign, so a
 * later campaign starts unseen without touching this one.
 *
 * @since      1.1.2
 * @package    Productreels
 * @subpackage Productreels/includes/support
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Promo {

	/**
	 * The running campaign's ID, stored in a dismissal.
	 *
	 * @since 1.1.2
	 * @var   string
	 */
	const CAMPAIGN = 'halloween-2026';

	/**
	 * The campaign's last moment, in the site's timezone.
	 *
	 * @since 1.1.2
	 * @var   string
	 */
	const ENDS = '2026-10-31 23:59:59';

	/**
	 * Where the call to action goes.
	 *
	 * @since 1.1.2
	 * @var   string
	 */
	const URL = 'https://bestwebexpert.com/';

	/**
	 * User meta holding the campaign IDs a person has dismissed.
	 *
	 * @since 1.1.2
	 * @var   string
	 */
	const META_KEY = 'productreels_dismissed_promos';

	/**
	 * The campaign for the admin bootstrap, or null when it shouldn't show.
	 *
	 * @since  1.1.2
	 * @return array{id:string,url:string,endsAt:int}|null The campaign.
	 */
	public static function bootstrap() {
		if ( ! self::is_visible() ) {
			return null;
		}

		return array(
			'id'     => self::CAMPAIGN,
			'url'    => esc_url_raw( self::URL ),
			// Milliseconds, so a tab left open past the end hides it too.
			'endsAt' => self::ends_at() * 1000,
		);
	}

	/**
	 * Whether the current user should see the running campaign.
	 *
	 * @since  1.1.2
	 * @return bool Whether they should.
	 */
	public static function is_visible() {
		if ( ! current_user_can( Productreels_Rest_Controller::CAPABILITY ) ) {
			return false;
		}

		if ( time() > self::ends_at() || self::is_dismissed( get_current_user_id() ) ) {
			return false;
		}

		/**
		 * Filters whether the ProductReels seasonal banner shows.
		 *
		 * @since 1.1.2
		 * @param bool   $show     Whether it shows.
		 * @param string $campaign The campaign ID.
		 */
		return (bool) apply_filters( 'productreels_show_promo', true, self::CAMPAIGN );
	}

	/**
	 * Hide a campaign from a user for good.
	 *
	 * @since  1.1.2
	 * @param  int    $user_id  The user.
	 * @param  string $campaign The campaign ID.
	 * @return void
	 */
	public static function dismiss( $user_id, $campaign ) {
		$dismissed = self::dismissed( $user_id );

		if ( in_array( $campaign, $dismissed, true ) ) {
			return;
		}

		$dismissed[] = $campaign;

		update_user_meta( $user_id, self::META_KEY, $dismissed );
	}

	/**
	 * Whether a user has dismissed the running campaign.
	 *
	 * @since  1.1.2
	 * @param  int $user_id The user.
	 * @return bool Whether they have.
	 */
	public static function is_dismissed( $user_id ) {
		return in_array( self::CAMPAIGN, self::dismissed( $user_id ), true );
	}

	/**
	 * The campaign IDs a user has dismissed.
	 *
	 * @since  1.1.2
	 * @access private
	 * @param  int $user_id The user.
	 * @return string[] The IDs.
	 */
	private static function dismissed( $user_id ) {
		$stored = get_user_meta( $user_id, self::META_KEY, true );

		return is_array( $stored ) ? array_values( array_filter( $stored, 'is_string' ) ) : array();
	}

	/**
	 * The end of the campaign as a Unix timestamp.
	 *
	 * @since  1.1.2
	 * @access private
	 * @return int The timestamp.
	 */
	private static function ends_at() {
		$ends = date_create_immutable( self::ENDS, wp_timezone() );

		return $ends ? $ends->getTimestamp() : 0;
	}
}
