/**
 * One mounted widget on a public page.
 *
 * Fetches the render payload — the frontend's only read — paints it through
 * the shared WidgetRenderer, and opens the player on demand. The player is
 * a separate chunk: a visitor who scrolls past a carousel without tapping
 * never downloads or parses it.
 */

import {
	lazy,
	Suspense,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { WidgetRenderer } from '@shared/WidgetRenderer';
import { api, boot, createServices } from './services';

const Player = lazy( () =>
	import(
		/* webpackChunkName: "wooreels-player" */ '@shared/player/Player'
	).then( ( module ) => ( { default: module.Player } ) )
);

/**
 * The reel-count skeleton shown while the payload loads.
 *
 * Sized from the mount node's own data so the page does not shift when the
 * real thumbnails arrive.
 */
const Placeholder = () => (
	<div className="wr-embed-loading" aria-hidden="true" />
);

export const Embed = ( { widgetId, reelId, version } ) => {
	const [ widget, setWidget ] = useState( null );
	const [ failed, setFailed ] = useState( false );
	const [ playing, setPlaying ] = useState( null );

	const trackingId = widgetId || 0;
	const services = useMemo(
		() => createServices( trackingId ),
		[ trackingId ]
	);

	useEffect( () => {
		let cancelled = false;
		const path = widgetId
			? `render/${ widgetId }`
			: `render/reel/${ reelId }`;

		api( `${ path }?v=${ encodeURIComponent( version || '' ) }` )
			.then( ( payload ) => {
				if ( ! cancelled ) {
					setWidget( payload );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setFailed( true );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ widgetId, reelId, version ] );

	if ( failed ) {
		return null;
	}

	if ( ! widget ) {
		return <Placeholder />;
	}

	const styles = widget.styles || boot.defaults;

	return (
		<>
			<WidgetRenderer
				widget={ widget }
				styles={ styles }
				onOpen={ ( reel, from ) => {
					const index = widget.reels.findIndex(
						( entry ) => entry.id === reel.id
					);

					setPlaying( { index: index < 0 ? 0 : index, from } );
				} }
			/>

			{ playing && (
				<Suspense fallback={ null }>
					<Player
						widget={ widget }
						styles={ styles }
						startReel={ playing.index }
						services={ services }
						returnFocusTo={ playing.from }
						onClose={ () => setPlaying( null ) }
					/>
				</Suspense>
			) }
		</>
	);
};
