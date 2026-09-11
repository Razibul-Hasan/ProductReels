/**
 * Load a third-party SDK once, on demand.
 *
 * A page with no Vimeo reel never requests the Vimeo SDK, and one with three
 * Vimeo reels requests it exactly once. The promise is cached per URL so
 * concurrent callers share a single <script>.
 */

const pending = new Map();

/**
 * Append a script and resolve once `ready()` reports the SDK global exists.
 *
 * @param {string}   src   Script URL.
 * @param {Function} ready Returns true once the SDK is usable.
 * @return {Promise<void>} Resolves when the SDK is ready.
 */
export const loadScript = ( src, ready ) => {
	if ( ready() ) {
		return Promise.resolve();
	}

	if ( pending.has( src ) ) {
		return pending.get( src );
	}

	const promise = new Promise( ( resolve, reject ) => {
		const existing = document.querySelector( `script[src="${ src }"]` );
		const script = existing || document.createElement( 'script' );

		const poll = () => {
			if ( ready() ) {
				resolve();

				return;
			}

			setTimeout( poll, 50 );
		};

		if ( ! existing ) {
			script.src = src;
			script.async = true;
			script.onerror = () => {
				pending.delete( src );
				reject( new Error( `Could not load ${ src }` ) );
			};
			document.head.appendChild( script );
		}

		script.addEventListener( 'load', poll );

		// The SDK may have finished loading between the query and the listener.
		poll();
	} );

	pending.set( src, promise );

	return promise;
};
