/**
 * What the player needs from the outside world.
 *
 * The render core is shared by the editor preview and the public bundle, and
 * the two live in very different places: one has a REST nonce and no
 * visitors, the other has visitors and a Store API nonce. So the player never
 * talks to the network itself — it is handed a `services` object and calls
 * these methods. The public bundle supplies real ones; the editor supplies
 * these, which do nothing.
 *
 * @typedef {Object} WooreelsServices
 * @property {Function} trackView   (widgetId, reel) => void — a reel has been watched.
 * @property {Function} trackClick  (reel, link, product?) => void — a link was pressed.
 * @property {Function} getProducts (ids) => Promise<Array> — display data for tagged products.
 * @property {Function} addToCart   (product, link) => Promise<void> — add one to the cart.
 * @property {string}   cartUrl     Where "View cart" goes.
 * @property {boolean}  hasWoo      Whether WooCommerce is available.
 */

export const noopServices = {
	trackView: () => {},
	trackClick: () => {},
	getProducts: () => Promise.resolve( [] ),
	addToCart: () => Promise.resolve(),
	cartUrl: '',
	hasWoo: false,
};

/**
 * Fill in anything a caller left out, so the player can call every method.
 *
 * @param {Object} partial Whatever the caller supplied.
 * @return {WooreelsServices} A complete services object.
 */
export const withDefaults = ( partial ) => ( {
	...noopServices,
	...( partial || {} ),
} );
