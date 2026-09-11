<?php
/**
 * Video URL parsing, mime sniffing and provider metadata.
 *
 * @link       https://bestwebexpert.com/wooreels
 * @since      1.0.0
 *
 * @package    Wooreels
 * @subpackage Wooreels/includes/support
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Works out what a pasted video URL actually is.
 *
 * Everything here is offline except one case: a Vimeo poster and duration
 * cannot be derived from the URL, so those come from Vimeo's public oEmbed
 * endpoint. That lookup only ever happens on an authenticated admin request,
 * only when an administrator pastes a Vimeo link, and can be switched off
 * entirely with the `wooreels_allow_provider_lookup` filter. Nothing about the
 * site is sent — the request carries the URL the administrator just typed.
 *
 * @since      1.0.0
 * @package    Wooreels
 * @subpackage Wooreels/includes/support
 * @author     Razibul Hasan <razibulhasan.ra@gmail.com>
 */
class Wooreels_Media {

	/**
	 * File extension => mime type, for directly hosted video.
	 *
	 * @since 1.0.0
	 * @var   array<string,string>
	 */
	const MIME_TYPES = array(
		'mp4'  => 'video/mp4',
		'm4v'  => 'video/mp4',
		'webm' => 'video/webm',
		'ogv'  => 'video/ogg',
		'ogg'  => 'video/ogg',
		'mov'  => 'video/quicktime',
		'm3u8' => 'application/x-mpegURL',
	);

	/**
	 * Work out the source and provider id of a URL, without touching the network.
	 *
	 * @since  1.0.0
	 * @param  string $url The URL.
	 * @return array{source:string,provider_id:string,mime_type:string} What the URL is.
	 */
	public static function parse( $url ) {
		$url = Wooreels_Validator::url( $url );

		$unknown = array(
			'source'      => '',
			'provider_id' => '',
			'mime_type'   => '',
		);

		if ( '' === $url ) {
			return $unknown;
		}

		if ( preg_match( '~(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/|v/)|youtu\.be/)([A-Za-z0-9_-]{6,20})~i', $url, $match ) ) {
			return array(
				'source'      => 'youtube',
				'provider_id' => $match[1],
				'mime_type'   => 'video/youtube',
			);
		}

		if ( preg_match( '~vimeo\.com/(?:video/|channels/[A-Za-z0-9_-]+/|groups/[A-Za-z0-9_-]+/videos/)?(\d{6,12})~i', $url, $match ) ) {
			return array(
				'source'      => 'vimeo',
				'provider_id' => $match[1],
				'mime_type'   => 'video/vimeo',
			);
		}

		$mime = self::mime_from_url( $url );

		if ( '' !== $mime ) {
			return array(
				'source'      => 'hosted',
				'provider_id' => '',
				'mime_type'   => $mime,
			);
		}

		return $unknown;
	}

	/**
	 * The mime type implied by a URL's file extension.
	 *
	 * @since  1.0.0
	 * @param  string $url The URL.
	 * @return string The mime type, or an empty string when it is not a video URL.
	 */
	public static function mime_from_url( $url ) {
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );

		if ( '' === $path ) {
			return '';
		}

		$extension = strtolower( (string) pathinfo( $path, PATHINFO_EXTENSION ) );

		return isset( self::MIME_TYPES[ $extension ] ) ? self::MIME_TYPES[ $extension ] : '';
	}

	/**
	 * Everything the reel editor needs to know about a pasted URL.
	 *
	 * @since  1.0.0
	 * @param  string $url    The URL an administrator pasted.
	 * @param  string $source The source they said it was; ignored when the URL disagrees.
	 * @return array{valid:bool,source:string,provider_id:string,poster_url:string,duration:int,mime_type:string} The description.
	 */
	public static function describe( $url, $source = '' ) {
		$url    = Wooreels_Validator::url( $url );
		$parsed = self::parse( $url );

		$result = array(
			'valid'       => false,
			'source'      => '' !== $parsed['source'] ? $parsed['source'] : Wooreels_Validator::source( $source ),
			'provider_id' => $parsed['provider_id'],
			'poster_url'  => '',
			'duration'    => 0,
			'mime_type'   => $parsed['mime_type'],
		);

		if ( '' === $url || '' === $parsed['source'] ) {
			return $result;
		}

		$result['valid'] = true;

		if ( 'youtube' === $parsed['source'] ) {
			// YouTube thumbnails are addressable, so this needs no lookup at all.
			$result['poster_url'] = 'https://img.youtube.com/vi/' . $parsed['provider_id'] . '/maxresdefault.jpg';

			return $result;
		}

		if ( 'vimeo' === $parsed['source'] ) {
			$meta = self::vimeo_meta( $parsed['provider_id'] );

			$result['poster_url'] = $meta['poster_url'];
			$result['duration']   = $meta['duration'];

			return $result;
		}

		return $result;
	}

	/**
	 * Poster and duration for a Vimeo video, from its public oEmbed endpoint.
	 *
	 * Cached for a day, so pasting the same link twice costs one request. Any
	 * failure is silent: an unreachable Vimeo means no poster, never a broken
	 * save.
	 *
	 * @since  1.0.0
	 * @access private
	 * @param  string $video_id The Vimeo video id.
	 * @return array{poster_url:string,duration:int} What Vimeo said.
	 */
	private static function vimeo_meta( $video_id ) {
		$empty = array(
			'poster_url' => '',
			'duration'   => 0,
		);

		/**
		 * Whether WooReels may ask a video provider for a poster and duration.
		 *
		 * Return false to keep the plugin completely offline; reels still save,
		 * they simply have no provider-supplied poster.
		 *
		 * @since 1.0.0
		 * @param bool   $allowed  Whether the lookup may happen.
		 * @param string $provider The provider being asked, e.g. 'vimeo'.
		 */
		if ( ! apply_filters( 'wooreels_allow_provider_lookup', true, 'vimeo' ) ) {
			return $empty;
		}

		$cache_key = 'wooreels_vimeo_' . md5( $video_id );
		$cached    = get_transient( $cache_key );

		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = wp_remote_get(
			add_query_arg(
				array( 'url' => rawurlencode( 'https://vimeo.com/' . $video_id ) ),
				'https://vimeo.com/api/oembed.json'
			),
			array( 'timeout' => 8 )
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			set_transient( $cache_key, $empty, HOUR_IN_SECONDS );

			return $empty;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $body ) ) {
			set_transient( $cache_key, $empty, HOUR_IN_SECONDS );

			return $empty;
		}

		$meta = array(
			'poster_url' => Wooreels_Validator::url( isset( $body['thumbnail_url'] ) ? $body['thumbnail_url'] : '' ),
			'duration'   => Wooreels_Validator::int_between( isset( $body['duration'] ) ? $body['duration'] : 0, 0, 86400, 0 ),
		);

		set_transient( $cache_key, $meta, DAY_IN_SECONDS );

		return $meta;
	}
}
