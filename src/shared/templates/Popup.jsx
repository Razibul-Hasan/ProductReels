/**
 * Popup — a floating bubble that shows one reel in a corner of the page.
 *
 * Dismissal sticks for the rest of the browsing session, per widget: a visitor
 * who closed it should not meet it again on the next page. sessionStorage
 * rather than localStorage, so it does come back on a future visit.
 *
 * In the editor preview the trigger and the dismissal are bypassed — a store
 * owner styling a popup needs to see it, not wait five seconds for it and then
 * be unable to get it back.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Thumbnail } from '../Thumbnail';

const dismissedKey = ( id ) => `wooreels_popup_dismissed_${ id }`;

const wasDismissed = ( id ) => {
	try {
		return window.sessionStorage.getItem( dismissedKey( id ) ) === '1';
	} catch ( error ) {
		return false;
	}
};

export const Popup = ( {
	reels,
	styles,
	onOpen,
	widgetId = 0,
	alwaysOpen = false,
} ) => {
	const {
		trigger,
		delaySeconds,
		scrollPercent,
		position,
		size,
		showOnMobile,
	} = styles.popup;

	const [ shown, setShown ] = useState( alwaysOpen || trigger === 'load' );
	const [ dismissed, setDismissed ] = useState( () =>
		alwaysOpen ? false : wasDismissed( widgetId )
	);

	useEffect( () => {
		if ( alwaysOpen || trigger === 'load' ) {
			return undefined;
		}

		if ( trigger === 'delay' ) {
			const timer = setTimeout(
				() => setShown( true ),
				delaySeconds * 1000
			);

			return () => clearTimeout( timer );
		}

		const onScroll = () => {
			const scrollable =
				document.documentElement.scrollHeight - window.innerHeight;
			const progress =
				scrollable > 0 ? ( window.scrollY / scrollable ) * 100 : 100;

			if ( progress >= scrollPercent ) {
				setShown( true );
			}
		};

		onScroll();
		window.addEventListener( 'scroll', onScroll, { passive: true } );

		return () => window.removeEventListener( 'scroll', onScroll );
	}, [ trigger, delaySeconds, scrollPercent, alwaysOpen ] );

	const dismiss = () => {
		setDismissed( true );

		try {
			window.sessionStorage.setItem( dismissedKey( widgetId ), '1' );
		} catch ( error ) {
			// A browser with storage blocked simply gets the popup again later.
		}
	};

	if ( dismissed || ! shown || reels.length === 0 ) {
		return null;
	}

	return (
		<div
			className={ [
				'wr-popup',
				`wr-popup--${ position }`,
				showOnMobile ? '' : 'wr-popup--desktop-only',
				alwaysOpen ? 'wr-popup--inline' : '',
			]
				.filter( Boolean )
				.join( ' ' ) }
			style={ { '--wr-popup-size': `${ size }px` } }
		>
			<button
				type="button"
				className="wr-popup__close"
				aria-label={ __( 'Cancel', 'wooreels' ) }
				onClick={ dismiss }
			>
				<svg
					viewBox="0 0 24 24"
					width="14"
					height="14"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>

			<Thumbnail
				reel={ reels[ 0 ] }
				styles={ styles }
				onOpen={ onOpen }
				index={ 0 }
			/>
		</div>
	);
};
