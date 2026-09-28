/**
 * The router.
 *
 * A hash router in about a hundred lines, which is all this app needs and a
 * good deal less than a routing library would cost the bundle. The hash is the
 * single source of truth: back and forward work, and every screen is a real,
 * linkable address.
 *
 * The router also owns the unsaved-changes gate. When a screen is dirty the
 * hash change is caught before the route commits, the address is put back, and
 * the pending route is handed to the app so it can ask about it in a proper
 * dialog rather than a browser confirm() box.
 */

import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

export const DEFAULT_ROUTE = '#/widgets';

/**
 * Turn a hash into a named route with its parameters.
 *
 * @param {string} hash The location hash.
 * @return {{name: string, id: number|null, hash: string}} The route.
 */
export const parseRoute = ( hash ) => {
	const path = ( hash || '' ).replace( /^#\/?/, '' ).replace( /\/+$/, '' );
	const parts = path === '' ? [] : path.split( '/' );

	if ( parts.length === 0 || parts[ 0 ] === 'widgets' ) {
		if ( parts[ 1 ] === 'new' ) {
			return { name: 'widget-new', id: null, hash: '#/widgets/new' };
		}

		if ( parts[ 1 ] && /^\d+$/.test( parts[ 1 ] ) ) {
			const id = Number( parts[ 1 ] );

			return parts[ 2 ] === 'stats'
				? { name: 'widget-stats', id, hash: `#/widgets/${ id }/stats` }
				: { name: 'widget-edit', id, hash: `#/widgets/${ id }` };
		}

		return { name: 'widgets', id: null, hash: '#/widgets' };
	}

	if ( parts[ 0 ] === 'reels' ) {
		return { name: 'reels', id: null, hash: '#/reels' };
	}

	if ( parts[ 0 ] === 'settings' ) {
		return { name: 'settings', id: null, hash: '#/settings' };
	}

	return { name: 'widgets', id: null, hash: '#/widgets' };
};

export const useHashRoute = ( dirtyRef ) => {
	const [ route, setRoute ] = useState( () =>
		parseRoute( window.location.hash )
	);
	const [ pending, setPending ] = useState( null );
	const committed = useRef( route.hash );

	useEffect( () => {
		// An empty hash is the widgets list; write it so the address is real.
		if ( ! window.location.hash ) {
			window.history.replaceState( null, '', DEFAULT_ROUTE );
		}

		committed.current = parseRoute( window.location.hash ).hash;

		const onHashChange = () => {
			const next = parseRoute( window.location.hash );

			if ( next.hash === committed.current ) {
				return;
			}

			if ( dirtyRef && dirtyRef.current ) {
				setPending( next );
				window.history.replaceState( null, '', committed.current );

				return;
			}

			committed.current = next.hash;
			setRoute( next );
		};

		window.addEventListener( 'hashchange', onHashChange );

		return () => window.removeEventListener( 'hashchange', onHashChange );
	}, [ dirtyRef ] );

	const navigate = useCallback( ( hash ) => {
		if ( window.location.hash === hash ) {
			return;
		}

		window.location.hash = hash;
	}, [] );

	/** Leave anyway: drop the unsaved work and go where they asked. */
	const leaveAnyway = useCallback( () => {
		if ( ! pending ) {
			return;
		}

		if ( dirtyRef ) {
			dirtyRef.current = false;
		}

		committed.current = pending.hash;
		window.history.replaceState( null, '', pending.hash );
		setRoute( pending );
		setPending( null );
	}, [ pending, dirtyRef ] );

	const stayHere = useCallback( () => setPending( null ), [] );

	return { route, navigate, pending, leaveAnyway, stayHere };
};

/**
 * Keep the WordPress submenu highlight in step with the hash.
 *
 * The four menu items all resolve to one WordPress screen, so WordPress marks
 * the first of them current and leaves it there. This moves the highlight the
 * way it would move if these really were four separate pages.
 *
 * @param {Object} route The current route.
 */
export const useSubmenuHighlight = ( route ) => {
	useEffect( () => {
		const menu = document.querySelector( '#toplevel_page_productreels' );

		if ( ! menu ) {
			return;
		}

		const wanted = {
			reels: 'productreels-reels',
			'widget-new': 'productreels-new-widget',
			settings: 'productreels-settings',
		}[ route.name ];

		menu.querySelectorAll( '.wp-submenu li' ).forEach( ( item ) => {
			const link = item.querySelector( 'a' );

			if ( ! link ) {
				return;
			}

			const href = link.getAttribute( 'href' ) || '';
			const isCurrent = wanted
				? href.indexOf( `page=${ wanted }` ) !== -1
				: /page=productreels(&|#|$)/.test( href );

			item.classList.toggle( 'current', isCurrent );
			link.classList.toggle( 'current', isCurrent );
		} );
	}, [ route.name ] );
};

/**
 * Keep the browser tab in step with the hash.
 *
 * WordPress names the tab once, after the one submenu item it knows about,
 * and the name never moves again. Every route here is a page in its own
 * right — it deserves its own name in the tab, the history menu and any
 * bookmark. The site name and " — WordPress" tail are whatever WordPress
 * printed, so the format follows the site's language.
 *
 * @param {string} label The screen name, e.g. "All Widgets".
 */
export const useDocumentTitle = ( label ) => {
	useEffect( () => {
		if ( ! label ) {
			return;
		}

		const current = document.title;
		const tail = current.indexOf( ' ‹ ' );

		document.title = `ProductReels - ${ label }${
			tail === -1 ? '' : current.slice( tail )
		}`;
	}, [ label ] );
};
