/**
 * What the player gets from the editor.
 *
 * The preview is the real player, so a tagged product shows its real price
 * and Add to cart really adds — to the store owner's own cart, which is the
 * honest way to check the flow works. Nothing here is tracked: an owner
 * previewing their own widget is not a view.
 */

import { createAddToCart } from '@shared/storeApi';
import { boot, get } from './api/client';

export const editorServices = {
	trackView: () => {},
	trackClick: () => {},
	getProducts: ( ids ) => get( '/products/batch', { ids } ),
	addToCart: boot.hasWoo
		? createAddToCart( {
				restUrl: boot.restUrl,
				nonce: boot.storeApiNonce,
		  } )
		: () => Promise.reject( new Error( '' ) ),
	cartUrl: boot.cartUrl || '',
	hasWoo: !! boot.hasWoo,
};
