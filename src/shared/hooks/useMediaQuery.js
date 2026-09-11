/**
 * Track a media query as React state.
 *
 * The player uses it to decide between desktop chrome (chevrons beside the
 * stage) and the edge-to-edge mobile layout, without a resize listener of its
 * own.
 */

import { useEffect, useState } from '@wordpress/element';

export const useMediaQuery = ( query ) => {
	const [ matches, setMatches ] = useState( () =>
		typeof window.matchMedia === 'function'
			? window.matchMedia( query ).matches
			: false
	);

	useEffect( () => {
		if ( typeof window.matchMedia !== 'function' ) {
			return undefined;
		}

		const list = window.matchMedia( query );
		const onChange = ( event ) => setMatches( event.matches );

		setMatches( list.matches );
		list.addEventListener( 'change', onChange );

		return () => list.removeEventListener( 'change', onChange );
	}, [ query ] );

	return matches;
};
