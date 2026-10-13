/**
 * Media helpers for the reel editor: the WordPress media frames, uploads that
 * report progress, and grabbing still frames out of a video.
 *
 * Every helper produces the 1.0.0 file shape ({ file_uuid, wp_media_id, url,
 * mime_type, source, provider_id, poster_url, duration }), so what the editor
 * saves is exactly what 1.0.0 saved.
 */

import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { boot } from './api';
import { nonceMiddleware } from './api/client';
import { uuid } from './uuid';

/** The formats that play in every browser the storefront supports. */
export const VIDEO_TYPES = [ 'video/mp4', 'video/webm' ];

const VIDEO_EXTENSIONS = {
	mp4: 'video/mp4',
	m4v: 'video/mp4',
	webm: 'video/webm',
};

/**
 * The mime type of a dropped or picked file, from its type or its name.
 *
 * @param {Object} file A File, or an attachment with `mime` and `filename`.
 * @return {string} The mime type, or an empty string.
 */
const mimeOf = ( file ) => {
	const type = file.type || file.mime || '';

	if ( type ) {
		return type;
	}

	const name = file.name || file.filename || '';
	const extension = name.split( '.' ).pop().toLowerCase();

	return VIDEO_EXTENSIONS[ extension ] || '';
};

/**
 * Whether a file is an MP4 or WebM video.
 *
 * @param {Object} file A File, or an attachment.
 * @return {boolean} Whether it may be added.
 */
export const isAllowedVideo = ( file ) =>
	VIDEO_TYPES.includes( mimeOf( file ) );

/**
 * Something readable to call a file: its name for a real file, the provider
 * and id for an embed.
 *
 * @param {Object} file The file.
 * @return {string} The label.
 */
export const fileLabel = ( file ) => {
	if ( file.source === 'youtube' ) {
		return `YouTube · ${ file.provider_id }`;
	}

	if ( file.source === 'vimeo' ) {
		return `Vimeo · ${ file.provider_id }`;
	}

	try {
		const path = new URL( file.url ).pathname;

		return decodeURIComponent( path.split( '/' ).pop() || file.url );
	} catch ( error ) {
		return file.url;
	}
};

/**
 * The poster WordPress knows for a video attachment, if it has a real one.
 *
 * A video with a featured image reports it as `image`; one without reports
 * the generic file-type icon there instead, which is no poster at all.
 *
 * @param {Object} item The attachment, as the media frame serialises it.
 * @return {string} The poster URL, or an empty string.
 */
const attachmentPoster = ( item ) => {
	const src = item.image?.src || '';

	if (
		! src ||
		src === item.icon ||
		src.includes( '/wp-includes/images/' )
	) {
		return '';
	}

	return src;
};

/**
 * A file entry for a media library attachment.
 *
 * @param {Object} item The attachment (media frame JSON or REST media).
 * @return {Object} The file.
 */
export const libraryFile = ( item ) => ( {
	file_uuid: uuid(),
	wp_media_id: item.id,
	url: item.url || item.source_url,
	mime_type: item.mime || item.mime_type || 'video/mp4',
	source: 'native',
	provider_id: '',
	poster_url: attachmentPoster( item ),
	duration: 0,
} );

/**
 * Open the media frame for videos.
 *
 * @param {Function} onPicked Receives `{ items, rejected }`: the chosen MP4
 *                            and WebM attachments (each `{ file, size }`) and
 *                            the names of anything else that was chosen.
 */
export const openVideoFrame = ( onPicked ) => {
	const frame = window.wp.media( {
		title: __( 'Choose videos', 'productreels' ),
		library: { type: VIDEO_TYPES },
		button: { text: __( 'Add videos', 'productreels' ) },
		multiple: true,
	} );

	frame.on( 'select', () => {
		const chosen = frame
			.state()
			.get( 'selection' )
			.map( ( item ) => item.toJSON() );

		onPicked( {
			items: chosen.filter( isAllowedVideo ).map( ( item ) => ( {
				file: libraryFile( item ),
				size: item.filesizeInBytes || 0,
			} ) ),
			rejected: chosen
				.filter( ( item ) => ! isAllowedVideo( item ) )
				.map( ( item ) => item.filename || item.title ),
		} );
	} );

	frame.open();
};

/**
 * Open the media frame for one image, used as the cover.
 *
 * @param {Function} onPicked Receives the image URL.
 */
export const openImageFrame = ( onPicked ) => {
	const frame = window.wp.media( {
		title: __( 'Choose a cover image', 'productreels' ),
		library: { type: 'image' },
		button: { text: __( 'Use as cover', 'productreels' ) },
		multiple: false,
	} );

	frame.on( 'select', () => {
		onPicked( frame.state().get( 'selection' ).first().toJSON().url );
	} );

	frame.open();
};

/**
 * Upload a file to the media library (core's POST /wp/v2/media, as 1.0.0
 * did), reporting progress. apiFetch has no upload progress, so this is a
 * plain XMLHttpRequest with the same nonce.
 *
 * @param {File}     file       The file.
 * @param {Function} onProgress Receives a whole percentage, 0–100.
 * @return {{promise: Promise<Object>, abort: Function}} The REST media
 *         object once uploaded, and a way to cancel.
 */
export const uploadMedia = ( file, onProgress ) => {
	const request = new window.XMLHttpRequest();
	const body = new window.FormData();
	const root = boot.restUrl || '/wp-json/';

	body.append( 'file', file, file.name );

	const promise = new Promise( ( resolve, reject ) => {
		request.open( 'POST', `${ root }wp/v2/media` );
		request.setRequestHeader(
			'X-WP-Nonce',
			nonceMiddleware?.nonce || boot.nonce || ''
		);
		request.setRequestHeader( 'Accept', 'application/json' );

		request.upload.onprogress = ( event ) => {
			if ( event.lengthComputable ) {
				onProgress(
					Math.min(
						99,
						Math.round( ( event.loaded / event.total ) * 100 )
					)
				);
			}
		};

		request.onload = () => {
			let data = null;

			try {
				data = JSON.parse( request.responseText );
			} catch ( error ) {
				data = null;
			}

			if ( request.status >= 200 && request.status < 300 && data ) {
				onProgress( 100 );
				resolve( data );

				return;
			}

			reject(
				new Error(
					data?.message ||
						__(
							'The upload failed. Please try again.',
							'productreels'
						)
				)
			);
		};

		request.onerror = () =>
			reject(
				new Error(
					__(
						'The upload failed. Check your connection and try again.',
						'productreels'
					)
				)
			);
		request.onabort = () => reject( new Error( 'aborted' ) );

		request.send( body );
	} );

	return { promise, abort: () => request.abort() };
};

/**
 * Bytes as a short size: 8.4 MB.
 *
 * @param {number} bytes The size.
 * @return {string} The size, or an empty string when unknown.
 */
export const formatSize = ( bytes ) => {
	if ( ! bytes ) {
		return '';
	}

	const mb = bytes / ( 1024 * 1024 );

	if ( mb >= 1 ) {
		return `${ new Intl.NumberFormat(
			document.documentElement.lang || undefined,
			{
				maximumFractionDigits: 1,
			}
		).format( mb ) } MB`;
	}

	return `${ Math.max( 1, Math.round( bytes / 1024 ) ) } KB`;
};

/**
 * Still frames out of one video, one seek at a time.
 *
 * The video is muted, never played and loaded with crossOrigin="anonymous":
 * a canvas can only be read back when the browser treats the video as
 * same-origin, which a media library file always is and a link to another
 * site usually is not. A video that refuses rejects `ready` (or the grab)
 * with `code: 'cross-origin'`, so the editor can explain instead of showing
 * a broken strip.
 *
 * @param {string} src The video URL.
 * @return {{ready: Promise<number>, grab: Function, destroy: Function}}
 *         `ready` resolves with the duration; `grab( time, width )` resolves
 *         with a canvas of that frame.
 */
export const frameGrabber = ( src ) => {
	const video = document.createElement( 'video' );
	let queue = Promise.resolve();
	let destroyed = false;

	const failure = ( code ) => {
		const error = new Error( code );

		error.code = code;

		return error;
	};

	video.crossOrigin = 'anonymous';
	video.muted = true;
	video.playsInline = true;
	video.preload = 'auto';

	const ready = new Promise( ( resolve, reject ) => {
		video.addEventListener(
			'loadeddata',
			() =>
				resolve(
					Number.isFinite( video.duration ) ? video.duration : 0
				),
			{ once: true }
		);
		// With crossOrigin set, a host that sends no CORS headers fails the
		// load outright: the same "not allowed" as a tainted canvas.
		video.addEventListener(
			'error',
			() => reject( failure( 'cross-origin' ) ),
			{ once: true }
		);
	} );

	video.src = src;

	const seek = ( time ) =>
		new Promise( ( resolve, reject ) => {
			if (
				Math.abs( video.currentTime - time ) < 0.01 &&
				video.readyState >= 2
			) {
				resolve();

				return;
			}

			const done = () => {
				video.removeEventListener( 'error', fail );
				resolve();
			};
			const fail = () => {
				video.removeEventListener( 'seeked', done );
				reject( failure( 'cross-origin' ) );
			};

			video.addEventListener( 'seeked', done, { once: true } );
			video.addEventListener( 'error', fail, { once: true } );
			video.currentTime = time;
		} );

	const grab = ( time, width = 0 ) => {
		const job = queue.then( async () => {
			if ( destroyed ) {
				throw failure( 'destroyed' );
			}

			const duration = await ready;

			await seek(
				Math.min( Math.max( 0, time ), Math.max( 0, duration - 0.05 ) )
			);

			const scale =
				width && video.videoWidth ? width / video.videoWidth : 1;
			const canvas = document.createElement( 'canvas' );

			canvas.width = Math.max(
				1,
				Math.round( video.videoWidth * scale )
			);
			canvas.height = Math.max(
				1,
				Math.round( video.videoHeight * scale )
			);
			canvas
				.getContext( '2d' )
				.drawImage( video, 0, 0, canvas.width, canvas.height );

			try {
				// Reading back is what a tainted canvas refuses.
				canvas.getContext( '2d' ).getImageData( 0, 0, 1, 1 );
			} catch ( error ) {
				throw failure( 'cross-origin' );
			}

			return canvas;
		} );

		// One failed grab must not jam the ones queued behind it.
		queue = job.catch( () => {} );

		return job;
	};

	const destroy = () => {
		destroyed = true;
		video.removeAttribute( 'src' );
		video.load();
	};

	return { ready, grab, destroy };
};

/**
 * Save a captured frame as a JPEG in the media library (1.0.0's
 * capture-and-save), so the cover behaves like any other image on the site.
 *
 * @param {HTMLCanvasElement} canvas The frame.
 * @return {Promise<string>} The image URL.
 */
export const saveFrame = async ( canvas ) => {
	const blob = await new Promise( ( resolve ) =>
		canvas.toBlob( resolve, 'image/jpeg', 0.86 )
	);

	if ( ! blob ) {
		throw new Error( 'empty' );
	}

	const body = new window.FormData();

	body.append( 'file', blob, `productreels-poster-${ Date.now() }.jpg` );

	const media = await apiFetch( {
		path: '/wp/v2/media',
		method: 'POST',
		body,
	} );

	return media.source_url;
};
