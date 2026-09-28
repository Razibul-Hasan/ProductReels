/**
 * The tagged products of a widget's reels, looked up once and shared.
 *
 * Thumbnails and the player both draw product cards, so the lookup lives
 * above both of them: WidgetRenderer asks once per widget and hands the
 * answer down through context, and the player reuses the same hook for its
 * own copy. `null` means the answer has not arrived — a card shows its
 * skeleton; `{}` means there is nothing to show — WooCommerce is off, the
 * lookup failed, or no reel tags a product.
 *
 * Answers are kept for the life of the page, keyed by the set of ids. The
 * player mounts after the widget has long since had its answer, and a
 * second request for the same products — a whole WordPress bootstrap on
 * the server — was the seconds a visitor waited for a card they had already
 * been shown on the thumbnail. Now it reads the widget's copy and paints at
 * once. A failed lookup is not kept, so the next mount tries again.
 */

import {
	createContext,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';
import { productIdsIn } from './format';

export const ProductsContext = createContext( {} );

/** In-flight and settled lookups by id-set key: { promise, result }. */
const lookups = new Map();

const toMap = ( list ) => {
	const map = {};

	( list || [] ).forEach( ( product ) => {
		map[ Number( product.id ) ] = product;
	} );

	return map;
};

const lookup = ( key, services ) => {
	let entry = lookups.get( key );

	if ( ! entry ) {
		entry = { result: null, promise: null };
		entry.promise = services
			.getProducts( key.split( ',' ).map( Number ) )
			.then( ( list ) => {
				entry.result = toMap( list );

				return entry.result;
			} )
			.catch( () => {
				lookups.delete( key );

				return {};
			} );
		lookups.set( key, entry );
	}

	return entry;
};

/**
 * @param {Array}  reels    The widget's reels.
 * @param {Object} services The services object; only getProducts and hasWoo are used.
 * @return {Object|null} Products by id, or null until the lookup has answered.
 */
export const useProducts = ( reels, services ) => {
	// The ids as one string, so the effect re-runs on a real change of set
	// and not on every new array the caller happens to build.
	const key = productIdsIn( reels ).join( ',' );
	const hasWoo = !! ( services && services.hasWoo );
	const wanted = !! key && hasWoo;

	// An answer already in hand is the first render's state: no skeleton,
	// no flash, for a player opening over a widget that has it.
	const [ products, setProducts ] = useState( () => {
		if ( ! wanted ) {
			return {};
		}

		const entry = lookups.get( key );

		return entry && entry.result ? entry.result : null;
	} );

	useEffect( () => {
		if ( ! wanted ) {
			setProducts( {} );

			return undefined;
		}

		const entry = lookup( key, services );

		if ( entry.result ) {
			setProducts( entry.result );

			return undefined;
		}

		let cancelled = false;

		setProducts( null );

		entry.promise.then( ( map ) => {
			if ( ! cancelled ) {
				setProducts( map );
			}
		} );

		return () => {
			cancelled = true;
		};
	}, [ key, wanted, services ] );

	return products;
};

/** The products map the nearest WidgetRenderer looked up. */
export const useWidgetProducts = () => useContext( ProductsContext );
