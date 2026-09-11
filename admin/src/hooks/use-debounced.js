/**
 * Hold a value still until it stops changing.
 *
 * Used by every search box in the app so typing a product name does not fire a
 * request per keystroke.
 */

import { useEffect, useState } from '@wordpress/element';

export const useDebounced = ( value, delay = 300 ) => {
	const [ debounced, setDebounced ] = useState( value );

	useEffect( () => {
		const timer = setTimeout( () => setDebounced( value ), delay );

		return () => clearTimeout( timer );
	}, [ value, delay ] );

	return debounced;
};
