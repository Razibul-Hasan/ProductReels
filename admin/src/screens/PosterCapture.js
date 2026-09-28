/**
 * Grab a poster frame out of a video.
 *
 * Scrub to the moment worth showing, capture it to a canvas, and the frame is
 * uploaded to the media library so it behaves like any other image on the site.
 *
 * A canvas can only read a video the browser considers same-origin. A file in
 * the media library always is; a hosted URL on another domain usually is not,
 * and there is no way to detect that ahead of time — so the failure is caught
 * and explained rather than left as a silent no-op.
 */

import apiFetch from '@wordpress/api-fetch';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { IconCamera } from '../components/icons';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Feedback';
import { Modal } from '../components/ui/Modal';

const toBlob = ( canvas ) =>
	new Promise( ( resolve ) => canvas.toBlob( resolve, 'image/jpeg', 0.86 ) );

export const PosterCapture = ( { src, onCaptured, onClose } ) => {
	const video = useRef( null );
	const [ time, setTime ] = useState( 0 );
	const [ duration, setDuration ] = useState( 0 );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );

	const capture = async () => {
		setBusy( true );
		setError( '' );

		try {
			const element = video.current;
			const canvas = document.createElement( 'canvas' );

			canvas.width = element.videoWidth;
			canvas.height = element.videoHeight;
			canvas
				.getContext( '2d' )
				.drawImage( element, 0, 0, canvas.width, canvas.height );

			const blob = await toBlob( canvas );

			if ( ! blob ) {
				throw new Error( 'empty' );
			}

			const body = new FormData();

			body.append(
				'file',
				blob,
				`productreels-poster-${ Date.now() }.jpg`
			);

			const media = await apiFetch( {
				path: '/wp/v2/media',
				method: 'POST',
				body,
			} );

			onCaptured( media.source_url );
		} catch ( captureError ) {
			setError(
				__(
					'This frame could not be captured. Videos hosted on another domain are blocked from being read this way — pick a poster from the media library instead.',
					'productreels-shoppable-video-reels-for-woocommerce'
				)
			);
		} finally {
			setBusy( false );
		}
	};

	return (
		<Modal
			title={ __(
				'Capture frame',
				'productreels-shoppable-video-reels-for-woocommerce'
			) }
			onClose={ onClose }
			footer={
				<>
					<Button variant="ghost" onClick={ onClose }>
						{ __(
							'Cancel',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					</Button>
					<Button
						variant="primary"
						icon={ IconCamera }
						busy={ busy }
						disabled={ busy }
						onClick={ capture }
					>
						{ __(
							'Use this frame',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
					</Button>
				</>
			}
		>
			<div className="wr-form">
				<div className="wr-capture">
					<video
						ref={ video }
						className="wr-capture__video"
						src={ src }
						crossOrigin="anonymous"
						playsInline
						preload="metadata"
						onLoadedMetadata={ ( event ) =>
							setDuration( event.target.duration || 0 )
						}
						onTimeUpdate={ ( event ) =>
							setTime( event.target.currentTime )
						}
					/>
				</div>

				<div className="wr-slider">
					<div className="wr-slider__head">
						<span className="wr-field__label">
							{ __(
								'Position',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
						</span>
						<span className="wr-field__help">
							{ time.toFixed( 1 ) }s / { duration.toFixed( 1 ) }s
						</span>
					</div>
					<input
						type="range"
						className="wr-slider__range"
						min="0"
						max={ Math.max( 0.1, duration ) }
						step="0.1"
						value={ time }
						aria-label={ __(
							'Position',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
						onChange={ ( event ) => {
							const next = Number( event.target.value );

							setTime( next );

							if ( video.current ) {
								video.current.currentTime = next;
							}
						} }
					/>
				</div>

				{ error !== '' && <Notice tone="warning">{ error }</Notice> }
			</div>
		</Modal>
	);
};
