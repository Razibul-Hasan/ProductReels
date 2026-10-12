/**
 * The unsaved-changes guard.
 *
 * A screen with unsaved work calls useUnsavedChanges( true, name ). The shell
 * then guards both ways out with one piece of state: closing or reloading the
 * tab raises the browser's own warning (useLeaveWarning), and navigating
 * inside the app is intercepted by the router so the shell can ask properly,
 * naming what would be lost, rather than through a browser confirm() box.
 */

import { createContext, useContext, useEffect } from '@wordpress/element';

export const UnsavedContext = createContext( {
	setDirty: () => {},
} );

/**
 * Report this screen's unsaved state to the shell.
 *
 * @param {boolean} dirty Whether there are unsaved changes.
 * @param {string}  label What would be lost, e.g. the widget's name.
 */
export const useUnsavedChanges = ( dirty, label = '' ) => {
	const { setDirty } = useContext( UnsavedContext );

	useEffect( () => {
		setDirty( dirty, label );
	}, [ dirty, label, setDirty ] );

	// Leaving the screen takes its draft with it.
	useEffect( () => () => setDirty( false, '' ), [ setDirty ] );
};

/**
 * Ask before the tab closes or reloads while anything is unsaved.
 *
 * Used once, by the shell.
 *
 * @param {boolean} dirty Whether any screen has unsaved changes.
 */
export const useLeaveWarning = ( dirty ) => {
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
