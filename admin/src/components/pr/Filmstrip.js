/**
 * Filmstrip: pick the reel's cover from its own video.
 *
 * Ten frames are drawn from the video once the strip scrolls into view (not
 * before: it means loading the video). Dragging along the strip or using the
 * arrow keys moves the playhead; letting go picks that moment, and the cover
 * beside it shows the frame. Upload image swaps in any picture; Use first
 * frame clears the custom cover. The caller stores the picked frame when the
 * reel is saved, so browsing frames never fills the media library.
 *
 * YouTube, Vimeo and links to sites that refuse to share their pixels can't
 * be drawn: the strip gives way to a notice saying so.
 *
 * Keys on the strip: arrows move a second (Shift: a tenth of the video),
 * Home and End jump to the ends, and left and right follow the writing
 * direction.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { formatClock } from '@shared/format';
import { frameGrabber } from '../../media';
import { Button } from './Button';
import { Notice } from './Notice';
import { isRtl } from './portal';

const FRAMES = 10;
const STRIP_WIDTH = 96;
const COVER_WIDTH = 270;
const COMMIT_MS = 350;

export const Filmstrip = ( {
	src,
	provider,
	cover,
	coverSrc,
	onPick,
	onUploadImage,
	onUseFirstFrame,
} ) => {
	const root = useRef( null );
	const strip = useRef( null );
	const grabber = useRef( null );
	const commitTimer = useRef( 0 );
	const [ visible, setVisible ] = useState( false );
	const [ duration, setDuration ] = useState( 0 );
	const [ frames, setFrames ] = useState( [] );
	const [ blocked, setBlocked ] = useState( false );
	const [ moving, setMoving ] = useState( null );

	// Only load the video once the section is on screen.
	useEffect( () => {
		const node = root.current;

		if ( ! node || visible ) {
			return undefined;
		}

		if ( ! ( 'IntersectionObserver' in window ) ) {
			setVisible( true );

			return undefined;
		}

		const observer = new window.IntersectionObserver( ( entries ) => {
			if ( entries.some( ( entry ) => entry.isIntersecting ) ) {
				setVisible( true );
				observer.disconnect();
			}
		} );

		observer.observe( node );

		return () => observer.disconnect();
	}, [ visible ] );

	useEffect( () => {
		setFrames( [] );
		setDuration( 0 );
		setBlocked( false );

		if ( ! visible || ! src ) {
			return undefined;
		}

		const grab = frameGrabber( src );
		let cancelled = false;

		grabber.current = grab;

		grab.ready
			.then( async ( length ) => {
				if ( cancelled ) {
					return;
				}

				setDuration( length );

				for ( let index = 0; index < FRAMES; index++ ) {
					const canvas = await grab.grab(
						( ( index + 0.5 ) / FRAMES ) * length,
						STRIP_WIDTH
					);

					if ( cancelled ) {
						return;
					}

					const url = canvas.toDataURL( 'image/jpeg', 0.7 );

					setFrames( ( current ) => {
						const next = [ ...current ];

						next[ index ] = url;

						return next;
					} );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setBlocked( true );
				}
			} );

		return () => {
			cancelled = true;
			grab.destroy();
			grabber.current = null;
		};
	}, [ visible, src ] );

	useEffect( () => () => clearTimeout( commitTimer.current ), [] );

	const picked = cover.kind === 'frame' ? cover.time : 0;
	const time = moving !== null ? moving : picked;
	const ratio =
		duration > 0 ? Math.min( 1, Math.max( 0, time / duration ) ) : 0;
	const active =
		cover.kind === 'image' && moving === null
			? -1
			: Math.min( FRAMES - 1, Math.floor( ratio * FRAMES ) );

	const commit = ( seconds ) => {
		const grab = grabber.current;

		setMoving( null );

		if ( ! grab ) {
			return;
		}

		grab.grab( seconds, COVER_WIDTH )
			.then( ( canvas ) =>
				onPick( seconds, canvas.toDataURL( 'image/jpeg', 0.8 ) )
			)
			.catch( () => setBlocked( true ) );
	};

	const secondsAt = ( clientX ) => {
		const rect = strip.current.getBoundingClientRect();
		let fraction = ( clientX - rect.left ) / rect.width;

		if ( isRtl( strip.current ) ) {
			fraction = 1 - fraction;
		}

		return Math.min( duration, Math.max( 0, fraction * duration ) );
	};

	const onPointerDown = ( event ) => {
		if ( ! duration ) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture( event.pointerId );
		event.currentTarget.focus();
		setMoving( secondsAt( event.clientX ) );
	};

	const onPointerMove = ( event ) => {
		if ( moving !== null && event.buttons ) {
			setMoving( secondsAt( event.clientX ) );
		}
	};

	const onPointerUp = ( event ) => {
		if ( moving !== null ) {
			commit( secondsAt( event.clientX ) );
		}
	};

	const onKeyDown = ( event ) => {
		if ( ! duration ) {
			return;
		}

		const step = event.shiftKey ? duration / FRAMES : 1;
		const back = isRtl( strip.current ) ? 'ArrowRight' : 'ArrowLeft';
		const forward = back === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
		let next = null;

		if ( event.key === back || event.key === 'ArrowDown' ) {
			next = time - step;
		} else if ( event.key === forward || event.key === 'ArrowUp' ) {
			next = time + step;
		} else if ( event.key === 'PageDown' ) {
			next = time - duration / FRAMES;
		} else if ( event.key === 'PageUp' ) {
			next = time + duration / FRAMES;
		} else if ( event.key === 'Home' ) {
			next = 0;
		} else if ( event.key === 'End' ) {
			next = duration;
		} else {
			return;
		}

		event.preventDefault();
		next = Math.min( duration, Math.max( 0, next ) );
		setMoving( next );
		clearTimeout( commitTimer.current );
		commitTimer.current = setTimeout( () => commit( next ), COMMIT_MS );
	};

	const providerName = provider === 'vimeo' ? 'Vimeo' : 'YouTube';
	let label = __( 'First frame', 'productreels' );

	if ( cover.kind === 'image' && moving === null ) {
		label = __( 'Custom cover image', 'productreels' );
	} else if ( cover.kind === 'frame' || moving !== null ) {
		label = sprintf(
			/* translators: %s: a time in the video, like 0:04. */
			__( 'Cover at %s', 'productreels' ),
			formatClock( time )
		);
	} else if ( provider ) {
		label = sprintf(
			/* translators: %s: YouTube or Vimeo. */
			__( '%s thumbnail', 'productreels' ),
			providerName
		);
	}

	let shown = coverSrc;

	if ( ! shown && cover.kind !== 'image' ) {
		shown = frames[ 0 ] || '';
	}

	let body = null;

	if ( provider ) {
		body = (
			<Notice
				tone="warn"
				title={ __(
					"Frames can't be captured from this video",
					'productreels'
				) }
			>
				{ sprintf(
					/* translators: %1$s: YouTube or Vimeo. */
					__(
						"It plays from %1$s, which doesn't allow it. Upload a cover image instead, or %1$s's own thumbnail is used.",
						'productreels'
					),
					providerName
				) }
			</Notice>
		);
	} else if ( blocked ) {
		body = (
			<Notice
				tone="warn"
				title={ __(
					"Frames can't be captured from this video",
					'productreels'
				) }
			>
				{ __(
					"It's hosted on another site that doesn't allow it. Upload a cover image instead, or the first frame is used.",
					'productreels'
				) }
			</Notice>
		);
	} else if ( src ) {
		body = (
			<div
				ref={ strip }
				className="pr-film__strip"
				role="slider"
				tabIndex={ 0 }
				aria-label={ __( 'Cover frame', 'productreels' ) }
				aria-valuemin={ 0 }
				aria-valuemax={ Math.round( duration ) }
				aria-valuenow={ Math.round( time ) }
				aria-valuetext={ formatClock( time ) }
				aria-busy={ frames.length < FRAMES ? 'true' : undefined }
				onPointerDown={ onPointerDown }
				onPointerMove={ onPointerMove }
				onPointerUp={ onPointerUp }
				onPointerCancel={ () => setMoving( null ) }
				onKeyDown={ onKeyDown }
			>
				{ Array.from( { length: FRAMES }, ( unused, index ) => (
					<span
						className="pr-film__frame"
						key={ index }
						data-active={ index === active ? 'true' : 'false' }
					>
						{ frames[ index ] && (
							<img
								src={ frames[ index ] }
								alt=""
								draggable="false"
							/>
						) }
					</span>
				) ) }
				{ duration > 0 && active >= 0 && (
					<span
						className="pr-film__head"
						style={ {
							insetInlineStart: `calc(4px + (100% - 8px) * ${ ratio })`,
						} }
					>
						<span className="pr-film__time pr-t-caption">
							{ formatClock( time ) }
						</span>
					</span>
				) }
			</div>
		);
	}

	return (
		<div className="pr-film" ref={ root }>
			{ body }
			<div className="pr-film__row">
				<span className="pr-film__cover">
					{ shown && <img src={ shown } alt="" /> }
				</span>
				<div className="pr-film__actions">
					<span className="pr-t-label" aria-live="polite">
						{ label }
					</span>
					<span className="pr-t-small pr-muted">
						{ src && ! blocked && ! provider
							? __(
									'Drag along the strip to pick the frame shoppers see before they press play.',
									'productreels'
								)
							: __(
									'The picture shoppers see before they press play.',
									'productreels'
								) }
					</span>
					<div className="pr-rowh pr-film__buttons">
						<Button
							size="sm"
							icon="image"
							onClick={ onUploadImage }
						>
							{ __( 'Upload image', 'productreels' ) }
						</Button>
						<Button
							size="sm"
							variant="ghost"
							disabled={ cover.kind === 'first' }
							onClick={ onUseFirstFrame }
						>
							{ provider
								? sprintf(
										/* translators: %s: YouTube or Vimeo. */
										__(
											'Use %s thumbnail',
											'productreels'
										),
										providerName
									)
								: __( 'Use first frame', 'productreels' ) }
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
