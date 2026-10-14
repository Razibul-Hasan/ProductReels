/**
 * Add to cart through the WooCommerce Store API.
 *
 * One POST to /wc/store/v1/cart/add-item with the Store API nonce, then the
 * two things a theme needs to notice: a DOM event anyone can listen for, and
 * the classic `wc_fragment_refresh` trigger that updates header cart counts.
 *
 * And one read: the product as the Store API describes it — its gallery, its
 * attributes and its variations — for the classic card's product panel. The
 * route is public, so it needs no nonce and adds no route of our own.
 */

import { __ } from '@wordpress/i18n';

/**
 * Build the add-to-cart function for a given site.
 *
 * @param {Object} config         Site details.
 * @param {string} config.restUrl The REST root, e.g. https://site/wp-json/.
 * @param {string} config.nonce   The wc_store_api nonce.
 * @return {Function} (product, link, quantity, variation) => Promise<Object> resolving to the cart.
 *                    `variation` is the chosen attributes of a variable product,
 *                    as [ { attribute, value } ], with `product.id` the variation's.
 */
export const createAddToCart =
	( { restUrl, nonce } ) =>
	async ( product, link, quantity = 1, variation ) => {
		if ( ! restUrl ) {
			throw new Error(
				__( 'WooCommerce is not available.', 'productreels' )
			);
		}

		const response = await fetch( `${ restUrl }wc/store/v1/cart/add-item`, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				Nonce: nonce || '',
			},
			body: JSON.stringify( {
				id: Number( product.id ),
				quantity,
				...( variation && variation.length ? { variation } : {} ),
			} ),
		} );

		let body = null;

		try {
			body = await response.json();
		} catch ( error ) {
			body = null;
		}

		if ( ! response.ok ) {
			const message =
				body && typeof body.message === 'string'
					? stripTags( body.message )
					: '';

			throw new Error( message );
		}

		// Let the theme know. The classic hook keeps mini-cart counters honest.
		document.dispatchEvent(
			new CustomEvent( 'productreels:added-to-cart', {
				bubbles: true,
				detail: { product, link, cart: body },
			} )
		);

		if ( window.jQuery ) {
			window.jQuery( document.body ).trigger( 'wc_fragment_refresh' );
			window
				.jQuery( document.body )
				.trigger( 'added_to_cart', [ {}, '', null ] );
		}

		return body;
	};

/** Product lookups by REST root and id, kept for the life of the page. */
const details = new Map();

/**
 * Build the product-details lookup for a given site.
 *
 * @param {Object} config         Site details.
 * @param {string} config.restUrl The REST root, e.g. https://site/wp-json/.
 * @return {Function} (id) => Promise<Object> resolving to the Store API product.
 */
export const createGetProduct =
	( { restUrl } ) =>
	( id ) => {
		if ( ! restUrl ) {
			return Promise.reject( new Error( '' ) );
		}

		const key = `${ restUrl }|${ Number( id ) }`;

		if ( ! details.has( key ) ) {
			const promise = fetch(
				`${ restUrl }wc/store/v1/products/${ Number( id ) }`,
				{ credentials: 'same-origin' }
			).then( ( response ) => {
				if ( ! response.ok ) {
					throw new Error( `HTTP ${ response.status }` );
				}

				return response.json();
			} );

			// A failed lookup is not kept, so the next open tries again.
			promise.catch( () => details.delete( key ) );
			details.set( key, promise );
		}

		return details.get( key );
	};

const stripTags = ( html ) => {
	const box = document.createElement( 'div' );

	box.innerHTML = html;

	return ( box.textContent || '' ).trim();
};
