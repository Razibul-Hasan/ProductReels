/**
 * The one-video-at-a-time rule.
 *
 * Every provider and every hover-preview thumbnail claims the floor before it
 * plays; whoever held it before is paused. Module state rather than context,
 * because the claim has to reach across every widget on the page, and across
 * the portal boundary the player renders through.
 */

let current = null;

/**
 * Take the floor. The previous holder is paused first.
 *
 * @param {Function} pause How to pause the new holder later.
 * @return {Function} Release the claim without pausing.
 */
export const claimPlayback = ( pause ) => {
	if ( current && current !== pause ) {
		try {
			current();
		} catch ( error ) {
			// A provider that has already been torn down has nothing to pause.
		}
	}

	current = pause;

	return () => {
		if ( current === pause ) {
			current = null;
		}
	};
};

/**
 * Pause whatever is playing, if anything.
 */
export const pauseAll = () => {
	if ( current ) {
		try {
			current();
		} catch ( error ) {
			// Already gone.
		}

		current = null;
	}
};
