/**
 * Whether this visitor has asked for less movement.
 *
 * The marquee, the stacked deck's spring and every hover transition check this.
 */

import { useEffect, useState } from '@wordpress/element';

export const useReducedMotion = () => {
	const [ reduced, setReduced ] = useState( () =>
		typeof window.matchMedia === 'function'
			? window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
			: false
	);

	useEffect( () => {
		if ( typeof window.matchMedia !== 'function' ) {
			return undefined;
		}

		const query = window.matchMedia( '(prefers-reduced-motion: reduce)' );
		const onChange = ( event ) => setReduced( event.matches );

		query.addEventListener( 'change', onChange );

		return () => query.removeEventListener( 'change', onChange );
	}, [] );

	return reduced;
};
