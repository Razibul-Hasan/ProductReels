/**
 * Public bundle entry point.
 *
 * Finds every mount node the shortcode, block or Elementor widget printed
 * and gives each its own React root. Then keeps watching: a widget inside an
 * AJAX tab, a lazy-loaded section or an Elementor popup arrives after load,
 * and the MutationObserver mounts it the moment it appears.
 */

import { createRoot } from '@wordpress/element';
import { Embed } from './Embed';
import { boot } from './services';
import './style.scss';

// The player is a separate chunk; tell webpack where the chunks live.
if ( boot.pluginUrl ) {
	__webpack_public_path__ = boot.pluginUrl; // eslint-disable-line no-undef, camelcase
}

const SELECTOR =
	'.wooreels-embed[data-widget-id], .wooreels-embed[data-reel-id]';

const mount = ( node ) => {
	if ( node.dataset.wrMounted === '1' ) {
		return;
	}

	node.dataset.wrMounted = '1';

	const widgetId = Number( node.dataset.widgetId || 0 );
	const reelId = Number( node.dataset.reelId || 0 );

	if ( ! widgetId && ! reelId ) {
		return;
	}

	createRoot( node ).render(
		<Embed
			widgetId={ widgetId }
			reelId={ reelId }
			version={ node.dataset.version || '' }
		/>
	);
};

const mountAll = ( root = document ) => {
	if ( root.matches && root.matches( SELECTOR ) ) {
		mount( root );
	}

	if ( root.querySelectorAll ) {
		root.querySelectorAll( SELECTOR ).forEach( mount );
	}
};

const start = () => {
	mountAll();

	if ( typeof window.MutationObserver !== 'function' ) {
		return;
	}

	const observer = new window.MutationObserver( ( records ) => {
		records.forEach( ( record ) => {
			record.addedNodes.forEach( ( added ) => {
				if ( added.nodeType === 1 ) {
					mountAll( added );
				}
			} );
		} );
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', start );
} else {
	start();
}
