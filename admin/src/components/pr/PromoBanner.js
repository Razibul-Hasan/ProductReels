/**
 * PromoBanner: the seasonal campaign on the Widgets screen.
 *
 * PHP decides whether it shows (Productreels_Promo: who can manage the plugin,
 * before the campaign ends in the site's timezone, not dismissed) and hands
 * the campaign over in the bootstrap. The art is inline SVG, so nothing loads
 * from anywhere. Dismissing it hides it at once and stores the dismissal in
 * the person's user meta, so it never comes back for them.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@shared/Icon';
import { boot, promo as promoApi } from '../../api';
import { useToasts } from './Toast';

/** The longest delay setTimeout keeps. */
const MAX_TIMEOUT = 2147483647;

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isRunning = ( campaign ) =>
	!! campaign && ( ! campaign.endsAt || Date.now() <= campaign.endsAt );

/**
 * Hand focus to the next control on the page (or the one before) when the
 * banner that holds it is about to go, so keyboard users aren't dropped at
 * the top of the document.
 *
 * @param {HTMLElement} node The banner.
 */
const focusPast = ( node ) => {
	if ( ! node || ! node.contains( node.ownerDocument.activeElement ) ) {
		return;
	}

	const scope = node.closest( '.pr-page' ) || node.ownerDocument.body;
	const others = Array.from( scope.querySelectorAll( FOCUSABLE ) ).filter(
		( element ) => ! node.contains( element )
	);
	const after = others.find(
		( element ) =>
			// eslint-disable-next-line no-bitwise
			node.compareDocumentPosition( element ) &
			window.Node.DOCUMENT_POSITION_FOLLOWING
	);

	( after || others[ others.length - 1 ] )?.focus();
};

const Bat = ( { className } ) => (
	<svg className={ className } viewBox="0 0 48 22" focusable="false">
		<path d="M24 7.2c.9-1.6 1.9-2.6 2.9-2.9-.3 1.1 0 2 .8 2.6 3.3-3 8.7-4.5 14.3-3.4-2.4 1.2-3.8 3.1-4 5.6-2-1-4.3-.8-5.8.7-1-1.7-2.9-2.4-4.6-1.9L24 16.4l-3.6-8.5c-1.7-.5-3.6.2-4.6 1.9-1.5-1.5-3.8-1.7-5.8-.7-.2-2.5-1.6-4.4-4-5.6 5.6-1.1 11 .4 14.3 3.4.8-.6 1.1-1.5.8-2.6 1 .3 2 1.3 2.9 2.9z" />
	</svg>
);

/** Moon, bare tree, bats and stars behind the content. */
const Scenery = () => (
	<div className="pr-promo__scenery" aria-hidden="true">
		<svg
			className="pr-promo__stars"
			viewBox="0 0 1200 140"
			preserveAspectRatio="xMidYMid slice"
			focusable="false"
		>
			<circle cx="180" cy="22" r="1.4" />
			<circle cx="330" cy="112" r="1.1" />
			<circle cx="460" cy="18" r="1.6" />
			<circle cx="610" cy="96" r="1.2" />
			<circle cx="700" cy="30" r="1.5" />
			<circle cx="860" cy="120" r="1.1" />
			<circle cx="940" cy="16" r="1.3" />
			<circle cx="1080" cy="104" r="1.6" />
			<circle cx="1150" cy="34" r="1.1" />
		</svg>
		<span className="pr-promo__moon" />
		<svg className="pr-promo__tree" viewBox="0 0 160 140" focusable="false">
			<path d="M70 140c3-22 4-44 1-62-9-6-20-9-33-8 9-4 20-4 30-1-6-9-15-15-27-19 13 2 24 8 31 18 1-12-3-24-11-34 11 8 16 20 16 33 6-9 15-15 27-17-10 6-17 14-20 24 11-5 23-6 35-2-13 0-24 4-33 11-2 18-1 38 4 57z" />
			<path d="M0 140c18-10 40-14 64-12 30 2 58 4 96-6v18z" />
		</svg>
		<Bat className="pr-promo__bat pr-promo__bat--1" />
		<Bat className="pr-promo__bat pr-promo__bat--2" />
		<Bat className="pr-promo__bat pr-promo__bat--3" />
	</div>
);

/** Jack-o'-lantern with a ghost peeking over it. */
const Lantern = () => (
	<svg
		className="pr-promo__art"
		viewBox="0 0 128 104"
		aria-hidden="true"
		focusable="false"
	>
		<defs>
			<radialGradient id="pr-promo-pumpkin" cx="40%" cy="35%" r="75%">
				<stop offset="0" stopColor="#ffb054" />
				<stop offset="0.55" stopColor="#ff7a12" />
				<stop offset="1" stopColor="#d9530a" />
			</radialGradient>
		</defs>
		<g className="pr-promo__ghost">
			<path
				d="M98 6c-11 0-18 8-18 19v26l5-4 5 4 5-4 5 4 5-4 5 4 6-4V25c0-11-7-19-18-19z"
				fill="#f6f1ff"
			/>
			<ellipse cx="92" cy="24" rx="2.6" ry="3.4" fill="#2a0a5e" />
			<ellipse cx="104" cy="24" rx="2.6" ry="3.4" fill="#2a0a5e" />
			<ellipse cx="98" cy="33" rx="2.6" ry="3.2" fill="#2a0a5e" />
		</g>
		<path
			d="M54 34c-.4-6 1.6-11 6.4-14.6l3.6 3.2c-3.6 2.8-5 6.4-4.8 11.4z"
			fill="#5f8f2c"
		/>
		<path
			d="M60.4 22.8c4-4.6 9.6-5.6 14.4-3.4-4 .6-7.6 2.6-10.4 6z"
			fill="#7fb03a"
		/>
		<ellipse cx="34" cy="68" rx="24" ry="30" fill="#e8620b" />
		<ellipse cx="80" cy="68" rx="24" ry="30" fill="#e8620b" />
		<ellipse
			cx="57"
			cy="68"
			rx="28"
			ry="33"
			fill="url(#pr-promo-pumpkin)"
		/>
		<path
			d="M45 38c-6 8-8 18-8 30s2 22 8 30M69 38c6 8 8 18 8 30s-2 22-8 30"
			fill="none"
			stroke="#c4480a"
			strokeWidth="1.6"
			strokeLinecap="round"
			opacity="0.6"
		/>
		<g className="pr-promo__face" fill="#ffe066">
			<path d="M38 62l8-11 7 11z" />
			<path d="M61 62l7-11 8 11z" />
			<path d="M54 69l3-4 3 4z" />
			<path d="M34 74c8 11 38 11 46 0l-5 1.2-2.6 4.2-4.4-2.6-4 4.4-4-4.4-4.4 2.6L49 75.2z" />
		</g>
	</svg>
);

export const PromoBanner = () => {
	const toasts = useToasts();
	const ref = useRef( null );
	const [ campaign, setCampaign ] = useState( () =>
		isRunning( boot.promo ) ? boot.promo : null
	);

	// A tab left open past the campaign's end hides it without a reload.
	useEffect( () => {
		if ( ! campaign?.endsAt ) {
			return undefined;
		}

		const left = campaign.endsAt - Date.now();

		if ( left > MAX_TIMEOUT ) {
			return undefined;
		}

		const timer = setTimeout(
			() => setCampaign( null ),
			Math.max( 0, left )
		);

		return () => clearTimeout( timer );
	}, [ campaign ] );

	if ( ! campaign ) {
		return null;
	}

	const dismiss = async () => {
		focusPast( ref.current );
		setCampaign( null );
		// Leaving Widgets and coming back must not bring it back either.
		boot.promo = null;

		try {
			await promoApi.dismiss( campaign.id );
		} catch ( requestError ) {
			boot.promo = campaign;
			setCampaign( campaign );
			toasts.error(
				__( 'Couldn’t hide the banner. Try again.', 'productreels' )
			);
		}
	};

	return (
		<div className="pr-promo-wrap">
			<section
				ref={ ref }
				className="pr-promo"
				aria-labelledby="pr-promo-title"
			>
				<Scenery />
				<Lantern />
				<div className="pr-promo__lead">
					<p className="pr-promo__label">
						<span aria-hidden="true">🎃</span>
						{ __( 'Halloween special', 'productreels' ) }
					</p>
					<h2 id="pr-promo-title" className="pr-promo__title">
						{ __(
							'Is Your Website Scaring Away Customers?',
							'productreels'
						) }
					</h2>
				</div>
				<p className="pr-promo__text">
					{ __(
						'Give your business a stunning website makeover this Halloween!',
						'productreels'
					) }
				</p>
				<a
					className="pr-promo__cta"
					href={ campaign.url }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Explore Website Makeovers', 'productreels' ) }
					<span className="pr-promo__arrow" aria-hidden="true">
						<svg
							className="pr-icon--flip"
							viewBox="0 0 24 24"
							width="18"
							height="18"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.25"
							strokeLinecap="round"
							strokeLinejoin="round"
							focusable="false"
						>
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</span>
					<span className="pr-sr">
						{ __( '(opens in a new tab)', 'productreels' ) }
					</span>
				</a>
				<button
					type="button"
					className="pr-promo__close"
					onClick={ dismiss }
					aria-label={ __(
						'Dismiss the Halloween banner',
						'productreels'
					) }
				>
					<Icon name="x" size={ 18 } />
				</button>
			</section>
		</div>
	);
};
