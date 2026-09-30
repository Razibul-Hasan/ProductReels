/**
 * Popup — a floating bubble that shows one reel in a corner of the page.
 *
 * How long a dismissal sticks is the store owner's call (`dismissFor`), per
 * widget: until the next page, for the rest of the browsing session, or for
 * a day, a week or a month. The session flavour lives in sessionStorage, so
 * it comes back on a future visit; the timed ones keep an expiry in
 * localStorage, so they survive a closed tab until it passes.
 *
 * In the editor preview the trigger and the dismissal are bypassed — a store
 * owner styling a popup needs to see it, not wait five seconds for it and then
 * be unable to get it back.
 *
 * It arrives and leaves from the edge it is pinned to: the stylesheet slides
 * it in on mount, and closing plays the reverse before the bubble unmounts.
 * The unmount waits for `animationend`, with a timer behind it in case the
 * event never comes (an element hidden by a theme's CSS fires nothing).
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Thumbnail } from '../Thumbnail';

const DAY = 24 * 60 * 60 * 1000;

const DISMISS_MS = {
	day: DAY,
	week: 7 * DAY,
	month: 30 * DAY,
};

const dismissedKey = ( id ) => `productreels_popup_dismissed_${ id }`;

const wasDismissed = ( id, dismissFor ) => {
	try {
		if ( 'session' === dismissFor ) {
			return window.sessionStorage.getItem( dismissedKey( id ) ) === '1';
		}

		if ( DISMISS_MS[ dismissFor ] ) {
			// The stored value is when the dismissal expires.
			return (
				Number( window.localStorage.getItem( dismissedKey( id ) ) ) >
				Date.now()
			);
		}
	} catch ( error ) {
		// Storage blocked: treated as never dismissed.
	}

	// 'page': closing it only closes it; the next page shows it again.
	return false;
};

const rememberDismissal = ( id, dismissFor ) => {
	try {
		if ( 'session' === dismissFor ) {
			window.sessionStorage.setItem( dismissedKey( id ), '1' );
		} else if ( DISMISS_MS[ dismissFor ] ) {
			window.localStorage.setItem(
				dismissedKey( id ),
				String( Date.now() + DISMISS_MS[ dismissFor ] )
			);
		}
	} catch ( error ) {
		// A browser with storage blocked simply gets the popup again later.
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
		showOnMobile,
		dismissFor = 'session',
	} = styles.popup;

	const [ shown, setShown ] = useState( alwaysOpen || trigger === 'load' );
	const [ closing, setClosing ] = useState( false );
	const [ dismissed, setDismissed ] = useState( () =>
		alwaysOpen ? false : wasDismissed( widgetId, dismissFor )
	);
	const fallback = useRef( null );

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

	const finishClosing = () => {
		clearTimeout( fallback.current );
		setDismissed( true );
		rememberDismissal( widgetId, dismissFor );
	};

	const dismiss = () => {
		if ( closing ) {
			return;
		}

		setClosing( true );
		fallback.current = setTimeout( finishClosing, 400 );
	};

	useEffect( () => () => clearTimeout( fallback.current ), [] );

	if ( dismissed || ! shown || reels.length === 0 ) {
		return null;
	}

	return (
		<div
			className={ [
				'wr-popup',
				`wr-popup--${ position }`,
				styles.shape === 'circle' ? 'wr-popup--circle' : '',
				showOnMobile ? '' : 'wr-popup--desktop-only',
				alwaysOpen ? 'wr-popup--inline' : '',
				closing ? 'wr-popup--closing' : '',
			]
				.filter( Boolean )
				.join( ' ' ) }
			onAnimationEnd={ ( event ) => {
				// Only the bubble's own exit, not the pulse or the close
				// button's fade bubbling up from inside.
				if ( closing && event.target === event.currentTarget ) {
					finishClosing();
				}
			} }
		>
			<div className="wr-popup__card">
				<button
					type="button"
					className="wr-popup__close"
					aria-label={ __(
						'Close',
						'productreels'
					) }
					onClick={ dismiss }
				>
					<svg
						viewBox="0 0 24 24"
						width="14"
						height="14"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
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
		</div>
	);
};
