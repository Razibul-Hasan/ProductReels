/**
 * Add to cart through the WooCommerce Store API.
 *
 * One POST to /wc/store/v1/cart/add-item with the Store API nonce, then the
 * two things a theme needs to notice: a DOM event anyone can listen for, and
 * the classic `wc_fragment_refresh` trigger that updates header cart counts.
 */

/**
 * Build the add-to-cart function for a given site.
 *
 * @param {Object} config         Site details.
 * @param {string} config.restUrl The REST root, e.g. https://site/wp-json/.
 * @param {string} config.nonce   The wc_store_api nonce.
 * @return {Function} (product, link, quantity) => Promise<Object> resolving to the cart.
 */
export const createAddToCart =
	( { restUrl, nonce } ) =>
	async ( product, link, quantity = 1 ) => {
		if ( ! restUrl ) {
			throw new Error( 'WooCommerce is not available.' );
		}

		const response = await fetch( `${ restUrl }wc/store/v1/cart/add-item`, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				Nonce: nonce || '',
			},
			body: JSON.stringify( { id: Number( product.id ), quantity } ),
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
			new CustomEvent( 'wooreels:added-to-cart', {
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

const stripTags = ( html ) => {
	const box = document.createElement( 'div' );

	box.innerHTML = html;

	return ( box.textContent || '' ).trim();
};
