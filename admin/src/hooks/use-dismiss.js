/**
 * Close a popover when focus or a pointer leaves it, or when Escape is pressed.
 *
 * Every popover in the app uses this, so they all dismiss the same way.
 */

import { useEffect } from '@wordpress/element';

export const useDismiss = ( ref, open, onDismiss ) => {
	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}

		const onPointerDown = ( event ) => {
			if ( ref.current && ! ref.current.contains( event.target ) ) {
				onDismiss();
			}
		};

		const onKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				event.stopPropagation();
				onDismiss();
			}
		};

		document.addEventListener( 'pointerdown', onPointerDown, true );
		document.addEventListener( 'keydown', onKeyDown );

		return () => {
			document.removeEventListener( 'pointerdown', onPointerDown, true );
			document.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ ref, open, onDismiss ] );
};
