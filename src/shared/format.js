/**
 * Formatting helpers shared by the editor preview and the public renderer.
 */

/**
 * Compact a view count the way a social app does: 950, 1.2k, 3m, 1.1b.
 *
 * Deliberately not Intl.NumberFormat's "compact" notation — that localises the
 * suffix, and these badges sit in a few pixels of overlay where a longer
 * suffix would wrap.
 *
 * @param {number} value The count.
 * @return {string} The compact form.
 */
export const compactCount = ( value ) => {
	const n = Number( value ) || 0;

	if ( n < 1000 ) {
		return String( n );
	}

	const units = [
		{ at: 1e9, suffix: 'b' },
		{ at: 1e6, suffix: 'm' },
		{ at: 1e3, suffix: 'k' },
	];

	const unit = units.find( ( entry ) => n >= entry.at );
	const scaled = n / unit.at;

	// One decimal, but never a trailing ".0".
	return `${
		scaled >= 10 ? Math.round( scaled ) : Math.round( scaled * 10 ) / 10
	}${ unit.suffix }`;
};

/**
 * The product a reel is tagged with — the first product link's product.
 *
 * @param {Object} reel The reel.
 * @return {number} The product id, or 0 when the reel tags no product.
 */
export const taggedProductId = ( reel ) => {
	const link = ( reel.links || [] ).find(
		( entry ) => entry.btn_type === 'product' && entry.product_id
	);

	return link ? Number( link.product_id ) : 0;
};

/**
 * The video file a thumbnail should try to show.
 *
 * @param {Object} reel The reel.
 * @return {Object|null} The file, or null when the reel has none.
 */
export const firstFile = ( reel ) =>
	reel.files && reel.files.length ? reel.files[ 0 ] : reel.file || null;

/**
 * The still image for a reel, if one can be worked out without playing it.
 *
 * @param {Object} reel The reel.
 * @return {string} A poster URL, or an empty string.
 */
export const posterOf = ( reel ) => {
	const file = firstFile( reel );

	return reel.thumbnail || ( file && file.poster_url ) || '';
};

/**
 * Whether a file can be played by a plain <video> element.
 *
 * @param {Object|null} file The file.
 * @return {boolean} Whether it is directly playable.
 */
export const isNativePlayable = ( file ) =>
	!! file && ( file.source === 'native' || file.source === 'hosted' );

/**
 * Seconds as m:ss (or h:mm:ss past an hour), for the seekbar's spoken value.
 *
 * @param {number} seconds The time.
 * @return {string} The clock string.
 */
export const formatClock = ( seconds ) => {
	const total = Math.max( 0, Math.floor( Number( seconds ) || 0 ) );
	const h = Math.floor( total / 3600 );
	const m = Math.floor( ( total % 3600 ) / 60 );
	const s = total % 60;
	const pad = ( n ) => String( n ).padStart( 2, '0' );

	return h > 0
		? `${ h }:${ pad( m ) }:${ pad( s ) }`
		: `${ m }:${ pad( s ) }`;
};

/**
 * Every product id tagged anywhere in a list of reels, once each.
 *
 * @param {Array} reels The reels.
 * @return {number[]} The product ids.
 */
export const productIdsIn = ( reels ) => {
	const ids = new Set();

	( reels || [] ).forEach( ( reel ) => {
		( reel.links || [] ).forEach( ( link ) => {
			if ( link.btn_type === 'product' && link.product_id ) {
				ids.add( Number( link.product_id ) );
			}
		} );
	} );

	return Array.from( ids );
};

/**
 * Flatten reels into playable slots — one per file, in order.
 *
 * A reel with several files becomes several consecutive slots, so "next"
 * inside a reel steps through its files before moving on to the next reel.
 * A reel with no file still gets one slot, so it can show its poster and its
 * links rather than vanishing from the sequence.
 *
 * @param {Array} reels The reels.
 * @return {Array<{reel: Object, file: Object|null, reelIndex: number, fileIndex: number, fileCount: number}>} The slots.
 */
export const slotsFor = ( reels ) => {
	const slots = [];

	( reels || [] ).forEach( ( reel, reelIndex ) => {
		let files = [];

		if ( reel.files && reel.files.length ) {
			files = reel.files;
		} else if ( reel.file ) {
			files = [ reel.file ];
		}

		if ( files.length === 0 ) {
			slots.push( {
				reel,
				file: null,
				reelIndex,
				fileIndex: 0,
				fileCount: 0,
			} );

			return;
		}

		files.forEach( ( file, fileIndex ) => {
			slots.push( {
				reel,
				file,
				reelIndex,
				fileIndex,
				fileCount: files.length,
			} );
		} );
	} );

	return slots;
};
