/**
 * The public bundle's services: what the player and the embed do with the
 * network on a real page.
 *
 * Plain fetch throughout — the bundle depends on nothing from WordPress but
 * element and i18n, so a shop page pays for nothing it does not use.
 */

import { createAddToCart } from '@shared/storeApi';

const boot = window.wooreelsPublic || {};

const headers = () => {
	const out = { 'Content-Type': 'application/json' };

	if ( boot.nonce ) {
		out[ 'X-WP-Nonce' ] = boot.nonce;
	}

	return out;
};

/**
 * Fetch JSON from the plugin's API.
 *
 * @param {string} path Route, relative to the wooreels/v1 base.
 * @param {Object} init Fetch options.
 * @return {Promise<any>} The decoded body.
 */
export const api = async ( path, init = {} ) => {
	const response = await fetch( `${ boot.apiBase }${ path }`, {
		credentials: 'same-origin',
		...init,
		headers: { ...headers(), ...( init.headers || {} ) },
	} );

	let body = null;

	try {
		body = await response.json();
	} catch ( error ) {
		body = null;
	}

	if ( ! response.ok ) {
		const error = new Error(
			body && body.message ? body.message : `HTTP ${ response.status }`
		);

		error.status = response.status;
		throw error;
	}

	return body;
};

/**
 * Fire-and-forget POST that survives navigation.
 *
 * sendBeacon when the browser has it — a click that navigates away would
 * otherwise cancel the request — and fetch with keepalive as the fallback.
 *
 * @param {string} path Route, relative to the wooreels/v1 base.
 * @param {Object} data JSON body.
 */
const beacon = ( path, data ) => {
	const url = `${ boot.apiBase }${ path }`;
	const json = JSON.stringify( data );

	if ( navigator.sendBeacon ) {
		try {
			if (
				navigator.sendBeacon(
					url,
					new Blob( [ json ], { type: 'application/json' } )
				)
			) {
				return;
			}
		} catch ( error ) {
			// Fall through to fetch.
		}
	}

	fetch( url, {
		method: 'POST',
		credentials: 'same-origin',
		keepalive: true,
		headers: headers(),
		body: json,
	} ).catch( () => {} );
};

/* A view is counted once per reel per session: once in memory for this page,
   and once in sessionStorage across the pages of one visit. */
const viewed = new Set();

const viewKey = ( widgetId, reelId ) =>
	`wooreels_viewed_${ widgetId }_${ reelId }`;

const alreadyViewed = ( widgetId, reelId ) => {
	const key = viewKey( widgetId, reelId );

	if ( viewed.has( key ) ) {
		return true;
	}

	try {
		return window.sessionStorage.getItem( key ) === '1';
	} catch ( error ) {
		return false;
	}
};

const rememberView = ( widgetId, reelId ) => {
	const key = viewKey( widgetId, reelId );

	viewed.add( key );

	try {
		window.sessionStorage.setItem( key, '1' );
	} catch ( error ) {
		// Storage blocked: the in-memory guard still holds for this page.
	}
};

/**
 * Services bound to one widget.
 *
 * @param {number} widgetId The widget the reels are being watched in (0 for a standalone reel).
 * @return {Object} The services object the player expects.
 */
export const createServices = ( widgetId ) => ( {
	trackView: ( _widgetId, reel ) => {
		if ( alreadyViewed( widgetId, reel.id ) ) {
			return;
		}

		rememberView( widgetId, reel.id );

		fetch(
			`${ boot.apiBase }widgets/${ widgetId }/reels/${ reel.id }/view`,
			{
				method: 'POST',
				credentials: 'same-origin',
				keepalive: true,
				headers: headers(),
			}
		)
			.then( ( response ) => {
				// 429 means "already counted this minute" — nothing to do.
				if ( ! response.ok && response.status !== 429 ) {
					viewed.delete( viewKey( widgetId, reel.id ) );
				}
			} )
			.catch( () => {} );
	},

	trackClick: ( reel, link, product ) => {
		beacon( 'track/click', {
			widget_id: widgetId,
			reel_id: reel.id,
			reel_title: reel.title || '',
			btn_uuid: link.btn_uuid,
			button_text: link.buttonText || ( product && product.name ) || '',
			button_url:
				link.buttonUrl || ( product && product.permalink ) || '',
			campaign_name: link.campaignName || '',
		} );
	},

	getProducts: ( ids ) => {
		if ( ! boot.hasWoo || ! ids.length ) {
			return Promise.resolve( [] );
		}

		const query = ids
			.map( ( id ) => `ids[]=${ encodeURIComponent( id ) }` )
			.join( '&' );

		return api( `products/batch?${ query }` );
	},

	addToCart: boot.hasWoo
		? createAddToCart( {
				restUrl: boot.restUrl,
				nonce: boot.storeApiNonce,
		  } )
		: () => Promise.reject( new Error( '' ) ),

	cartUrl: boot.cartUrl || '',
	hasWoo: !! boot.hasWoo,
} );

export { boot };
