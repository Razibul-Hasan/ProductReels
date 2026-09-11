/**
 * Pointer-driven swipe with a velocity threshold and a rubber band.
 *
 * Reports the live drag offset so the stage can follow the finger, and
 * commits a step only when the release travelled far enough or fast enough.
 * Anything that starts on a control marked `data-wr-no-swipe` — the seekbar,
 * the volume slider, a button — is ignored, so dragging the seekbar can never
 * turn into a navigation.
 *
 * Horizontal swipes are mirrored in RTL: a swipe towards the start of the
 * reading direction always means "next".
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

const DISTANCE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.45; // px per ms
const RUBBER = 0.35;

const isRtl = () => document.documentElement.dir === 'rtl';

export const useSwipe = ( { axis = 'x', onStep, enabled = true } ) => {
	const [ offset, setOffset ] = useState( 0 );
	const [ dragging, setDragging ] = useState( false );
	const gesture = useRef( null );

	const onPointerDown = useCallback(
		( event ) => {
			if ( ! enabled || event.button > 0 ) {
				return;
			}

			if ( event.target.closest( '[data-wr-no-swipe]' ) ) {
				return;
			}

			gesture.current = {
				id: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				at: performance.now(),
				locked: null,
			};
		},
		[ enabled ]
	);

	const onPointerMove = useCallback(
		( event ) => {
			const g = gesture.current;

			if ( ! g || g.id !== event.pointerId ) {
				return;
			}

			const dx = event.clientX - g.x;
			const dy = event.clientY - g.y;

			// Decide once which axis this gesture belongs to, so a stray
			// diagonal never flips between following and ignoring.
			if ( g.locked === null ) {
				if ( Math.abs( dx ) < 6 && Math.abs( dy ) < 6 ) {
					return;
				}

				g.locked = Math.abs( dx ) >= Math.abs( dy ) ? 'x' : 'y';

				if ( g.locked !== axis ) {
					gesture.current = null;

					return;
				}

				setDragging( true );

				if ( event.currentTarget.setPointerCapture ) {
					event.currentTarget.setPointerCapture( event.pointerId );
				}
			}

			setOffset( axis === 'x' ? dx : dy );
		},
		[ axis ]
	);

	const finish = useCallback(
		( event ) => {
			const g = gesture.current;

			if ( ! g || g.id !== event.pointerId ) {
				return;
			}

			gesture.current = null;

			if ( g.locked !== axis ) {
				return;
			}

			const raw =
				axis === 'x' ? event.clientX - g.x : event.clientY - g.y;
			const elapsed = Math.max( 1, performance.now() - g.at );
			const velocity = Math.abs( raw ) / elapsed;

			setDragging( false );
			setOffset( 0 );

			if ( Math.abs( raw ) < 8 ) {
				return;
			}

			if (
				Math.abs( raw ) >= DISTANCE_THRESHOLD ||
				velocity >= VELOCITY_THRESHOLD
			) {
				// Dragging towards the start means "next" — mirrored for RTL on x.
				let step = raw < 0 ? 1 : -1;

				if ( axis === 'x' && isRtl() ) {
					step = -step;
				}

				onStep( step );
			}
		},
		[ axis, onStep ]
	);

	useEffect( () => {
		if ( ! enabled ) {
			gesture.current = null;
			setOffset( 0 );
			setDragging( false );
		}
	}, [ enabled ] );

	/** Compress the drag at the ends so it feels anchored rather than loose. */
	const rubber = useCallback(
		( value, atEdge ) => ( atEdge ? value * RUBBER : value ),
		[]
	);

	return {
		offset,
		dragging,
		rubber,
		handlers: {
			onPointerDown,
			onPointerMove,
			onPointerUp: finish,
			onPointerCancel: finish,
		},
	};
};
