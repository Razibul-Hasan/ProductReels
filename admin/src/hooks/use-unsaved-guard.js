/**
 * The unsaved-changes guard.
 *
 * A screen with unsaved work calls useUnsavedChanges( true ). Two things then
 * happen: closing the tab raises the browser's own warning, and navigating
 * inside the app is intercepted so it can ask properly, in the app's own
 * dialog, rather than through a browser confirm() box.
 */

import { createContext, useContext, useEffect } from '@wordpress/element';

export const UnsavedContext = createContext( {
	setDirty: () => {},
} );

export const useUnsavedChanges = ( dirty ) => {
	const { setDirty } = useContext( UnsavedContext );

	useEffect( () => {
		setDirty( dirty );

		return () => setDirty( false );
	}, [ dirty, setDirty ] );

	useEffect( () => {
		if ( ! dirty ) {
			return undefined;
		}

		const onBeforeUnload = ( event ) => {
			event.preventDefault();
			event.returnValue = '';

			return '';
		};

		window.addEventListener( 'beforeunload', onBeforeUnload );

		return () =>
			window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ dirty ] );
};
