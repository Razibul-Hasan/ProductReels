/**
 * Report when an element enters the viewport.
 *
 * Used to defer video sources under lazyLoad, and to pause the marquee when it
 * scrolls off screen. Sticky by default: once something has been seen there is
 * no reason to unload it again.
 */

import { useEffect, useRef, useState } from '@wordpress/element';

export const useInView = ( { rootMargin = '200px', once = true } = {} ) => {
	const ref = useRef( null );
	const [ inView, setInView ] = useState( false );

	useEffect( () => {
		const node = ref.current;

		if ( ! node ) {
			return undefined;
		}

		if ( typeof window.IntersectionObserver !== 'function' ) {
			setInView( true );

			return undefined;
		}

		const observer = new window.IntersectionObserver(
			( entries ) => {
				const visible = entries.some(
					( entry ) => entry.isIntersecting
				);

				if ( visible ) {
					setInView( true );

					if ( once ) {
						observer.disconnect();
					}
				} else if ( ! once ) {
					setInView( false );
				}
			},
			{ rootMargin }
		);

		observer.observe( node );

		return () => observer.disconnect();
	}, [ rootMargin, once ] );

	return [ ref, inView ];
};
