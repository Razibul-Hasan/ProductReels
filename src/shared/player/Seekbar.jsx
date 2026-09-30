/**
 * The seekbar: track, fill and a draggable thumb.
 *
 * A real slider to assistive technology — role, min/max/now and a spoken
 * value — and a pointer-capture drag for everyone else, which keeps working
 * when the finger leaves the track and never turns into a swipe between
 * reels. The scrubbed position is shown locally while dragging and committed
 * on release, so a slow provider does not fight the thumb.
 */

import { useCallback, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { formatClock } from '../format';

const STEP = 5;

export const Seekbar = ( { current, duration, onSeek } ) => {
	const track = useRef( null );
	const [ scrub, setScrub ] = useState( null );
	const shown = scrub === null ? current : scrub;
	const ratio =
		duration > 0 ? Math.min( 1, Math.max( 0, shown / duration ) ) : 0;

	const positionToSeconds = useCallback(
		( clientX ) => {
			const node = track.current;

			if ( ! node || duration <= 0 ) {
				return 0;
			}

			const rect = node.getBoundingClientRect();
			const rtl = window.getComputedStyle( node ).direction === 'rtl';
			let fraction = ( clientX - rect.left ) / rect.width;

			if ( rtl ) {
				fraction = 1 - fraction;
			}

			return Math.min( duration, Math.max( 0, fraction * duration ) );
		},
		[ duration ]
	);

	const onPointerDown = ( event ) => {
		if ( event.button > 0 || duration <= 0 ) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture( event.pointerId );
		setScrub( positionToSeconds( event.clientX ) );
	};

	const onPointerMove = ( event ) => {
		if ( scrub === null ) {
			return;
		}

		setScrub( positionToSeconds( event.clientX ) );
	};

	const onPointerUp = ( event ) => {
		if ( scrub === null ) {
			return;
		}

		const seconds = positionToSeconds( event.clientX );

		setScrub( null );
		onSeek( seconds );
	};

	const onKeyDown = ( event ) => {
		let next = null;

		switch ( event.key ) {
			case 'ArrowRight':
			case 'ArrowUp':
				next = Math.min( duration, current + STEP );
				break;

			case 'ArrowLeft':
			case 'ArrowDown':
				next = Math.max( 0, current - STEP );
				break;

			case 'Home':
				next = 0;
				break;

			case 'End':
				next = duration;
				break;

			default:
				return;
		}

		event.preventDefault();
		event.stopPropagation();
		onSeek( next );
	};

	return (
		<div
			ref={ track }
			className={ `wr-seek${ scrub !== null ? ' is-scrubbing' : '' }` }
			role="slider"
			tabIndex={ 0 }
			aria-label={ __(
				'Seek',
				'productreels'
			) }
			aria-valuemin={ 0 }
			aria-valuemax={ Math.round( duration ) }
			aria-valuenow={ Math.round( shown ) }
			aria-valuetext={ sprintf(
				/* translators: 1: elapsed time, 2: total duration. */
				__(
					'%1$s of %2$s',
					'productreels'
				),
				formatClock( shown ),
				formatClock( duration )
			) }
			data-wr-no-swipe=""
			onPointerDown={ onPointerDown }
			onPointerMove={ onPointerMove }
			onPointerUp={ onPointerUp }
			onPointerCancel={ onPointerUp }
			onKeyDown={ onKeyDown }
		>
			<span className="wr-seek__track">
				<span
					className="wr-seek__fill"
					style={ { width: `${ ratio * 100 }%` } }
				/>
				<span
					className="wr-seek__thumb"
					style={ { insetInlineStart: `${ ratio * 100 }%` } }
				/>
			</span>
		</div>
	);
};
