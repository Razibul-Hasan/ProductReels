<?php
/**
 * Transient-backed rate limiting for the public tracking routes.
 *
 * @link       https://bestwebexpert.com/productreels
 * @since      1.0.0
 *
 * @package    Productreels
 * @subpackage Productreels/includes/support
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Keeps one visitor from inflating a view counter.
 *
 * The window is fixed, not sliding: the first request inside a window sets the
 * expiry, and later requests count against it without pushing it further out,
 * so a visitor who keeps hammering the endpoint cannot hold their own limit
 * open forever.
 *
 * Visitors are identified by a salted hash of their IP through wp_hash(). The
 * raw address is never written anywhere — not to a transient, not to a table,
 * not to a log.
 *
 * @since      1.0.0
 * @package    Productreels
 * @subpackage Productreels/includes/support
 * @author     bestwpexpert <https://bestwebexpert.com/>
 */
class Productreels_Rate_Limiter {

	/**
	 * Prefix for every transient this class writes.
	 *
	 * @since 1.0.0
	 * @var   string
	 */
	const PREFIX = 'productreels_rl_';

	/**
	 * Count one hit against a key and say whether it is allowed.
	 *
	 * @since  1.0.0
	 * @param  string $key     What is being limited, e.g. "view:12:<hash>".
	 * @param  int    $limit   How many hits are allowed inside the window.
	 * @param  int    $seconds How long the window lasts.
	 * @return bool Whether this hit is allowed.
	 */
	public static function check( $key, $limit, $seconds ) {
		$limit   = max( 1, (int) $limit );
		$seconds = max( 1, (int) $seconds );
		$name    = self::PREFIX . md5( (string) $key );
		$now     = time();
		$bucket  = get_transient( $name );

		if ( ! is_array( $bucket ) || ! isset( $bucket['count'], $bucket['expires'] ) || $bucket['expires'] <= $now ) {
			set_transient(
				$name,
				array(
					'count'   => 1,
					'expires' => $now + $seconds,
				),
				$seconds
			);

			return true;
		}

		if ( (int) $bucket['count'] >= $limit ) {
			return false;
		}

		$remaining = max( 1, (int) $bucket['expires'] - $now );

		set_transient(
			$name,
			array(
				'count'   => (int) $bucket['count'] + 1,
				'expires' => (int) $bucket['expires'],
			),
			$remaining
		);

		return true;
	}

	/**
	 * A stable, salted, non-reversible identifier for the current visitor.
	 *
	 * @since  1.0.0
	 * @return string The hash.
	 */
	public static function visitor_hash() {
		return wp_hash( self::client_ip() );
	}

	/**
	 * The requesting IP address.
	 *
	 * Only REMOTE_ADDR is trusted. Forwarded-for headers are attacker
	 * controlled on most stacks, and trusting them would let one visitor spend
	 * an unlimited number of rate-limit buckets.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return string The address, or an empty string when there is none.
	 */
	private static function client_ip() {
		if ( empty( $_SERVER['REMOTE_ADDR'] ) ) {
			return '';
		}

		$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );

		return (string) filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '';
	}

	/**
	 * Whether this request looks like a crawler rather than a person.
	 *
	 * Deliberately a cheap, conservative check: the cost of missing a bot is one
	 * inflated view, and the cost of a false positive is a lost one.
	 *
	 * @since  1.0.0
	 * @return bool Whether tracking should be skipped.
	 */
	public static function is_bot() {
		// A CORS preflight is the browser asking permission, not a person watching.
		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'OPTIONS' === strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) ) {
			return true;
		}

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return true;
		}

		$agent = strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) );

		$patterns = array( 'bot', 'crawl', 'spider', 'slurp', 'archiver', 'preview', 'headless', 'monitor', 'lighthouse', 'pingdom', 'curl/', 'wget' );

		foreach ( $patterns as $pattern ) {
			if ( false !== strpos( $agent, $pattern ) ) {
				return true;
			}
		}

		return false;
	}
}
