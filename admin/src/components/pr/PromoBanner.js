/**
 * PromoBanner: the seasonal campaign on the Widgets screen.
 *
 * PHP decides whether it shows (Productreels_Promo: who can manage the plugin,
 * before the campaign ends in the site's timezone, not dismissed) and hands
 * the campaign over in the bootstrap. The art is inline SVG, so nothing loads
 * from anywhere. Dismissing it hides it at once and stores the dismissal in
 * the person's user meta, so it never comes back for them.
 */

import {
	createInterpolateElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
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

/** Gold light streaks, confetti and a gift box behind the content. */
const Scenery = () => (
	<div className="pr-promo__scenery" aria-hidden="true">
		<svg
			className="pr-promo__streaks"
			viewBox="0 0 1200 140"
			preserveAspectRatio="none"
			focusable="false"
		>
			<defs>
				<linearGradient id="pr-promo-streak" x1="0" x2="1">
					<stop offset="0" stopColor="#ffc62b" stopOpacity="0" />
					<stop offset="0.7" stopColor="#ffc62b" stopOpacity="0.9" />
					<stop offset="1" stopColor="#fff3c4" stopOpacity="0.6" />
				</linearGradient>
			</defs>
			<path
				d="M760 52C900 40 1040 22 1200 -6"
				stroke="url(#pr-promo-streak)"
				strokeWidth="2.5"
			/>
			<path
				d="M820 70C960 52 1080 30 1200 10"
				stroke="url(#pr-promo-streak)"
				strokeWidth="1"
				opacity="0.6"
			/>
			<path
				d="M940 146C1040 120 1120 104 1200 98"
				stroke="url(#pr-promo-streak)"
				strokeWidth="2.5"
			/>
		</svg>
		<svg
			className="pr-promo__confetti"
			viewBox="0 0 1200 140"
			preserveAspectRatio="xMidYMid slice"
			focusable="false"
		>
			<path
				className="pr-promo__bit"
				d="M590 26c5-7 10-8 14-3s9 4 13-3"
				fill="none"
				stroke="#f2b01e"
				strokeWidth="3.5"
				strokeLinecap="round"
			/>
			<rect
				className="pr-promo__bit"
				x="52"
				y="22"
				width="9"
				height="4"
				rx="1"
				transform="rotate(-24 56 24)"
			/>
			<rect
				className="pr-promo__bit"
				x="560"
				y="104"
				width="5"
				height="12"
				rx="1"
				transform="rotate(40 562 110)"
			/>
			<rect
				className="pr-promo__bit"
				x="780"
				y="92"
				width="16"
				height="6"
				rx="1"
				transform="rotate(-36 788 95)"
			/>
			<rect
				className="pr-promo__bit"
				x="1080"
				y="20"
				width="5"
				height="12"
				rx="1"
				transform="rotate(32 1082 26)"
			/>
		</svg>
		<svg className="pr-promo__gift" viewBox="0 0 80 72" focusable="false">
			<path d="M8 34h64v38H8z" fill="#262626" />
			<path d="M4 24h72v14H4z" fill="#3a3a3a" />
			<path
				d="M8 38h64"
				stroke="#000"
				strokeOpacity="0.4"
				strokeWidth="2"
			/>
			<path d="M34 24h12v48H34z" fill="#f2b01e" />
			<path
				d="M40 24c-6-12-20-18-24-10s10 10 24 10zM40 24c6-12 20-18 24-10s-10 10-24 10z"
				fill="none"
				stroke="#f2b01e"
				strokeWidth="5"
				strokeLinejoin="round"
			/>
		</svg>
	</div>
);

/** Black and gold shopping bags with a swinging price tag. */
const Bags = () => (
	<svg
		className="pr-promo__art"
		viewBox="0 0 150 116"
		aria-hidden="true"
		focusable="false"
	>
		<defs>
			<linearGradient id="pr-promo-gold" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#ffe07a" />
				<stop offset="0.5" stopColor="#f6b51e" />
				<stop offset="1" stopColor="#c98a00" />
			</linearGradient>
			<linearGradient id="pr-promo-bag" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#2b2b2b" />
				<stop offset="1" stopColor="#0a0a0a" />
			</linearGradient>
		</defs>
		<path
			d="M12 50c0-10 4-18 12-18s12 8 12 18"
			fill="none"
			stroke="#e3a514"
			strokeWidth="3"
		/>
		<path d="M4 46h40l-4 66H8z" fill="url(#pr-promo-gold)" />
		<path
			d="M46 38c0-20 8-32 21-32s21 12 21 32"
			fill="none"
			stroke="url(#pr-promo-gold)"
			strokeWidth="4"
			strokeLinecap="round"
		/>
		<path d="M30 34h74l-4 80H34z" fill="url(#pr-promo-bag)" />
		<path d="M30 34h74l-1 10H31z" fill="#000" opacity="0.35" />
		<g className="pr-promo__words" fill="#fff" transform="rotate(-8 66 70)">
			<text x="38" y="62" fontSize="14">
				BLACK
			</text>
			<text x="38" y="77" fontSize="14">
				FRIDAY
			</text>
			<path d="M38 82l52-4 2 17-52 4z" fill="#ffcc1f" />
			<text x="44" y="96" fontSize="15" fill="#0a0a0a">
				SALE
			</text>
		</g>
		<path
			d="M88 36c8 4 16 10 22 18"
			fill="none"
			stroke="#d9d9d9"
			strokeWidth="1.2"
		/>
		<g className="pr-promo__tag">
			<path
				d="M104 46l14 4 14 26-12 34-24-7 6-34z"
				fill="url(#pr-promo-gold)"
			/>
			<circle cx="110" cy="54" r="2.6" fill="#0a0a0a" />
			<g
				className="pr-promo__words"
				fill="#0a0a0a"
				transform="rotate(16 114 80)"
			>
				<text x="104" y="74" fontSize="7">
					UP TO
				</text>
				<text x="101" y="88" fontSize="14">
					70%
				</text>
				<text x="106" y="97" fontSize="8">
					OFF
				</text>
			</g>
		</g>
	</svg>
);

/** The tag in the label. */
const TagMark = () => (
	<svg
		className="pr-promo__tagmark"
		viewBox="0 0 24 24"
		width="14"
		height="14"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M3 12.2V4a1 1 0 0 1 1-1h8.2a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-8.2 8.2a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7zM8 9.5A1.5 1.5 0 1 0 8 6.5a1.5 1.5 0 0 0 0 3z" />
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
				<Bags />
				<div className="pr-promo__lead">
					<p className="pr-promo__label">
						<TagMark />
						{ __( 'Black Friday special', 'productreels' ) }
					</p>
					<h2 id="pr-promo-title" className="pr-promo__title">
						{ createInterpolateElement(
							/* translators: <hl> marks the highlighted words. */
							__(
								'Is Your Website Ready for <hl>Black Friday?</hl>',
								'productreels'
							),
							{ hl: <span className="pr-promo__hl" /> }
						) }
					</h2>
				</div>
				<p className="pr-promo__text">
					{ __(
						'Give your business a stunning website makeover this Black Friday!',
						'productreels'
					) }
				</p>
				<a
					className="pr-promo__cta"
					href={ campaign.url }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Explore Black Friday Deals', 'productreels' ) }
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
						'Dismiss the Black Friday banner',
						'productreels'
					) }
				>
					<Icon name="x" size={ 18 } />
				</button>
			</section>
		</div>
	);
};
