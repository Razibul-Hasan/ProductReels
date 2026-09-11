/**
 * Marquee — an endlessly scrolling rail.
 *
 * Driven by requestAnimationFrame over a duplicated track rather than a CSS
 * keyframe: a keyframe needs the track width baked in, and this rail's width
 * depends on how many reels there are and how big they have been styled.
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
	const [ paused, setPaused ] = useState( false );
	const [ viewRef, inView ] = useInView( { rootMargin: '0px', once: false } );
	const reduced = useReducedMotion();

	const { speed, direction, pauseOnHover } = styles.marquee;

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
				// The track holds the reels twice, so one full set is half its width.
				const span = node.scrollWidth / 2;

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
	}, [ speed, direction, paused, inView, reduced ] );

	const run = reels.concat( reduced ? [] : reels );

	return (
		<div
			ref={ viewRef }
			className={ `wr-marquee${ reduced ? ' is-static' : '' }` }
			onPointerEnter={ () => pauseOnHover && setPaused( true ) }
			onPointerLeave={ () => pauseOnHover && setPaused( false ) }
		>
			<div className="wr-marquee__track" ref={ track }>
				{ run.map( ( reel, index ) => (
					<Thumbnail
						key={ `${ reel.id }-${ index }` }
						reel={ reel }
						styles={ styles }
						onOpen={ onOpen }
						index={ index }
					/>
				) ) }
			</div>
		</div>
	);
};
