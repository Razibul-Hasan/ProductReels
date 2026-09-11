/**
 * Mouse wheel between reels, throttled.
 *
 * A trackpad fires dozens of wheel events for one flick, so the first event
 * over the threshold moves and the rest are ignored until the gesture has
 * clearly settled. The listener is never passive: the page must not scroll
 * behind the player.
 */

import { useEffect } from '@wordpress/element';

const THRESHOLD = 24;
const COOLDOWN = 650;

export const useWheelNav = ( ref, onStep, enabled = true ) => {
	useEffect( () => {
		const node = ref.current;

		if ( ! node || ! enabled ) {
			return undefined;
		}

		let last = 0;

		const onWheel = ( event ) => {
			event.preventDefault();

			const delta =
				Math.abs( event.deltaY ) >= Math.abs( event.deltaX )
					? event.deltaY
					: event.deltaX;
			const now = performance.now();

			if ( Math.abs( delta ) < THRESHOLD || now - last < COOLDOWN ) {
				return;
			}

			last = now;
			onStep( delta > 0 ? 1 : -1 );
		};

		node.addEventListener( 'wheel', onWheel, { passive: false } );

		return () => node.removeEventListener( 'wheel', onWheel );
	}, [ ref, onStep, enabled ] );
};
