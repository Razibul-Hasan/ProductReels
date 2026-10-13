/**
 * The last step open in each widget's editor, for this browser tab, and a
 * way for other screens to open a saved widget on a given step (the first-save
 * toast's and Statistics' "Place it").
 */

const STEPS_KEY = 'productreels_editor_steps';

export const OPEN_STEP = 'productreels:open-step';

/**
 * @return {Object} { [widget id or 'draft']: step id }.
 */
export const readSteps = () => {
	try {
		return JSON.parse( window.sessionStorage.getItem( STEPS_KEY ) ) || {};
	} catch ( error ) {
		return {};
	}
};

/**
 * @param {string} key  The widget id, or 'draft'.
 * @param {string} step The step id.
 */
export const rememberStep = ( key, step ) => {
	try {
		window.sessionStorage.setItem(
			STEPS_KEY,
			JSON.stringify( { ...readSteps(), [ key ]: step } )
		);
	} catch ( error ) {
		// Storage blocked: the step just isn't remembered.
	}
};

/**
 * Open a step of a saved widget's editor. An editor already showing that
 * widget switches step; otherwise the editor opens on it.
 *
 * @param {number} id   The widget.
 * @param {string} step The step to open.
 */
export const openStep = ( id, step ) => {
	rememberStep( String( id ), step );
	document.dispatchEvent(
		new window.CustomEvent( OPEN_STEP, { detail: { id, step } } )
	);

	if ( window.location.hash !== `#/widgets/${ id }` ) {
		window.location.hash = `#/widgets/${ id }`;
	}
};
