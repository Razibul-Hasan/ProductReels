/**
 * Marquee — an endlessly scrolling rail.
 *
 * Driven by requestAnimationFrame over a repeated track rather than a CSS
 * keyframe: a keyframe needs the track width baked in, and this rail's width
 * depends on how many reels there are and how big they have been styled.
 *
 * The reels repeat as many times as the container needs: enough copies that
 * the track is always at least one period longer than the container, so the
 * far edge never runs out of cards before the wrap. Two copies was the old
 * fixed answer, and on a wide page with a handful of reels the window ran
 * off the end of the track — one side emptied, then the loop snapped back.
 * The period itself is measured as the distance from the first card to its
 * twin in the next copy, gap included; half the track's scrollWidth was off
 * by half a gap, and every lap jolted by that much.
 *
 * Pauses on hover, pauses when scrolled out of view, and does not run at all
 * for a visitor who asked for reduced motion — for them it is a plain,
 * readable, scrollable row.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { Thumbnail } from '../Thumbnail';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const Marquee = ( { reels, styles, onOpen } ) => {
	const track = useRef( null );
	const offset = useRef( 0 );
	const period = useRef( 0 );
	const [ paused, setPaused ] = useState( false );
	const [ copies, setCopies ] = useState( 2 );
	const [ viewRef, inView ] = useInView( { rootMargin: '0px', once: false } );
	const reduced = useReducedMotion();

	const { speed, direction, pauseOnHover } = styles.marquee;
	const count = reels.length;

	// How long one lap is, and how many copies the container needs. Measured
	// from the laid-out cards, and again whenever the container or the track
	// changes size — the editor's size slider, a theme's collapsing sidebar.
	useEffect( () => {
		const node = track.current;
		const box = viewRef.current;

		if ( reduced || ! node || ! box || count === 0 ) {
			return undefined;
		}

		const measure = () => {
			const items = node.children;

			if ( items.length <= count ) {
				return;
			}

			// The first card and the same card one copy along. Absolute, so
			// RTL (where the second copy sits to the left) measures the same.
			const lap = Math.abs(
				items[ count ].offsetLeft - items[ 0 ].offsetLeft
			);

			if ( lap <= 0 ) {
				return;
			}

			period.current = lap;
			// One copy more than covers the container, so the window is never
			// past the last card while the offset is still short of a lap.
			setCopies( Math.max( 2, Math.ceil( box.clientWidth / lap ) + 1 ) );
		};

		measure();

		if ( typeof window.ResizeObserver !== 'function' ) {
			return undefined;
		}

		const observer = new window.ResizeObserver( measure );

		observer.observe( box );
		observer.observe( node );

		return () => observer.disconnect();
	}, [ count, reduced, viewRef ] );

	useEffect( () => {
		if ( reduced || paused || ! inView ) {
			return undefined;
		}

		let frame = 0;
		let last = performance.now();

		const step = ( now ) => {
			const delta = ( now - last ) / 1000;

			last = now;

			const node = track.current;

			if ( node ) {
				// One lap, measured; the fallback only serves the first frame
				// before the measurement effect has run.
				const span = period.current || node.scrollWidth / copies;

				offset.current +=
					speed * delta * ( direction === 'right' ? -1 : 1 );

				if ( span > 0 ) {
					// Wrap in both directions so neither way ever shows a gap.
					offset.current =
						( ( offset.current % span ) + span ) % span;
				}

				node.style.transform = `translate3d(${ -offset.current }px, 0, 0)`;
			}

			frame = window.requestAnimationFrame( step );
		};

		frame = window.requestAnimationFrame( step );

		return () => window.cancelAnimationFrame( frame );
	}, [ speed, direction, paused, inView, reduced, copies ] );

	const run = [];

	for ( let copy = 0; copy < ( reduced ? 1 : copies ); copy++ ) {
		reels.forEach( ( reel ) => run.push( reel ) );
	}

	return (
		<div
			ref={ viewRef }
			className={ `wr-marquee${ reduced ? ' is-static' : '' }` }
			onPointerEnter={ () => pauseOnHover && setPaused( true ) }
			onPointerLeave={ () => pauseOnHover && setPaused( false ) }
		>
			<div className="wr-marquee__track" ref={ track }>
				{ /* Only the first copy is announced or tabbed to; the
				     rest are the same reels again, there to fill the loop. */ }
				{ run.map( ( reel, index ) => (
					<Thumbnail
						key={ `${ reel.id }-${ index }` }
						reel={ reel }
						styles={ styles }
						onOpen={ onOpen }
						index={ index }
						decorative={ index >= count }
					/>
				) ) }
			</div>
		</div>
	);
};
