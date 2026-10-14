/**
 * A tagged WooCommerce product: on a tile, and inside the player.
 *
 * On a tile it is a preview (`TileCard`): picture, name, rating and price,
 * nothing pressable, because the whole tile is the one button that opens the
 * reel. Inside the player it is the real card (`ProductCard`), in one of two
 * looks: "modern", a glass strip with a round buy button at its end, and
 * "classic", a dark card with the picture beside the name, the price and a
 * full-width button under them. The modern button can also be a pill that
 * shows its text (`buttonDisplay: 'text'`); the classic one always does.
 *
 * A classic card in the full player is the way into the product panel: with
 * `onOpen` its button is "Shop now", and the picture and name open the panel
 * too instead of leaving for the product page.
 *
 * The price arrives as HTML that WooCommerce has already formatted, so
 * currency, tax display and the sale strike-through match the rest of the
 * store; the stylesheet only colours it (regular price muted, sale price in
 * spark).
 *
 * One button, in one of two flavours: Add to cart keeps the shopper on the
 * page and offers "View cart" once it lands; Buy now adds the product and
 * goes straight to checkout. The editor keeps the two flags exclusive, and
 * if both somehow arrive on, Buy now wins — the more deliberate choice.
 *
 * Clicking the name or the picture navigates — and must not toggle playback
 * on the way out, so those clicks stop before they reach the tap layer.
 */

import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { ReelIcon } from './ReelIcon';

/**
 * WooCommerce's own price markup, coloured by the stylesheet.
 *
 * @param {Object} props           Props.
 * @param {string} props.html      The product's `price_html`.
 * @param {string} props.className The type class.
 * @return {Object} The price.
 */
export const Price = ( { html, className = 'pr-t-caption' } ) => (
	<span
		className={ `prs-price ${ className }` }
		// WooCommerce formats this string itself; it is the same markup the shop page prints.
		dangerouslySetInnerHTML={ { __html: html || '' } }
	/>
);

export const Stars = ( { rating, reviews } ) => {
	const value = Math.max( 0, Math.min( 5, Number( rating ) || 0 ) );
	const filled = Math.round( value );

	return (
		<span
			className="prs-stars pr-t-caption"
			role="img"
			aria-label={ sprintf(
				/* translators: %s: average rating, e.g. 4.5. */
				__( 'Rated %s out of 5', 'productreels' ),
				value.toFixed( 1 )
			) }
		>
			{ [ 1, 2, 3, 4, 5 ].map( ( index ) => (
				<ReelIcon
					key={ index }
					name="star"
					size={ 12 }
					strokeWidth={ 1.5 }
					fill={ index <= filled ? 'currentColor' : 'none' }
				/>
			) ) }
			{ reviews > 0 && (
				<span className="prs-stars__n" aria-hidden="true">
					({ reviews })
				</span>
			) }
		</span>
	);
};

/* Two grey lines where the name and price will be, while the lookup runs. */
const Lines = () => (
	<>
		<span className="prs-line" />
		<span className="prs-line prs-line--short" />
	</>
);

/**
 * The tagged product on a tile: a preview, never a second button.
 *
 * @param {Object}  props             Props.
 * @param {Object}  props.product     The product, or undefined while loading.
 * @param {boolean} props.showRatings Whether to draw the stars.
 * @return {Object} The card.
 */
export const TileCard = ( { product, showRatings } ) => (
	<span
		className={ `prs-card${ product ? '' : ' is-loading' }` }
		aria-busy={ product ? undefined : 'true' }
	>
		<span className="prs-card__thumb">
			{ product && product.image && (
				<img
					src={ product.image }
					alt=""
					loading="lazy"
					decoding="async"
				/>
			) }
		</span>
		<span className="prs-card__text">
			{ product ? (
				<>
					<span className="prs-card__name pr-t-label">
						{ product.name }
					</span>
					{ showRatings && product.rating_count > 0 && (
						<Stars rating={ product.rating } />
					) }
					<Price html={ product.price_html } />
				</>
			) : (
				<Lines />
			) }
		</span>
	</span>
);

export const ProductCard = ( {
	product,
	link,
	variant = 'modern',
	showRatings = true,
	showAddToCart = true,
	addToCartText,
	directCheckout = false,
	directCheckoutText,
	buttonDisplay = 'icon',
	cartUrl,
	checkoutUrl,
	onAddToCart,
	onNavigate,
	onOpen,
	onToast,
} ) => {
	const [ state, setState ] = useState( 'idle' );
	const classic = variant === 'classic';
	// The buy button becomes the View cart link once the product is in:
	// a new element, so focus is handed to it when the button had it.
	const actionRef = useRef( null );
	const refocus = useRef( false );

	useEffect( () => {
		if ( refocus.current && actionRef.current ) {
			refocus.current = false;
			actionRef.current.focus();
		}
	}, [ state ] );
	const root = `prs-card${ classic ? ' prs-card--classic' : '' } wr-product`;

	// Loading — the batch lookup has not answered yet. Keep the box the size
	// it will be so the links above it do not jump when it does.
	if ( ! product ) {
		return (
			<div
				className={ `${ root } is-loading` }
				aria-busy="true"
				data-wr-no-swipe=""
			>
				<span className="prs-card__thumb" />
				<span className="prs-card__text">
					<Lines />
				</span>
			</div>
		);
	}

	const stop = ( event ) => event.stopPropagation();

	const navigate = ( event ) => {
		stop( event );

		if ( onNavigate ) {
			onNavigate( link );
		}
	};

	const failed = ( error ) => {
		setState( 'idle' );

		if ( onToast ) {
			onToast(
				'error',
				error && error.message
					? sprintf(
							/* translators: %s: the error message from WooCommerce. */
							__( 'Failed to add to cart: %s', 'productreels' ),
							error.message
						)
					: __(
							'Failed to add to cart. Please try again.',
							'productreels'
						)
			);
		}
	};

	const add = async ( event ) => {
		stop( event );

		if ( state === 'adding' ) {
			return;
		}

		refocus.current =
			event.currentTarget.ownerDocument.activeElement ===
			event.currentTarget;

		if ( onNavigate ) {
			onNavigate( link );
		}

		setState( 'adding' );

		try {
			await onAddToCart( product, link );
			setState( 'added' );

			if ( onToast ) {
				onToast(
					'success',
					__( 'Product added to cart!', 'productreels' )
				);
			}
		} catch ( error ) {
			failed( error );
		}
	};

	// Buy now: the same add, then the checkout page. The button stays busy
	// until the page changes underneath it — a store with no checkout page
	// gets the cart instead, and a store with neither the product's own.
	const buy = async ( event ) => {
		stop( event );

		if ( state === 'adding' ) {
			return;
		}

		if ( onNavigate ) {
			onNavigate( link );
		}

		setState( 'adding' );

		try {
			await onAddToCart( product, link );
			window.location.assign(
				checkoutUrl || cartUrl || product.permalink
			);
		} catch ( error ) {
			failed( error );
		}
	};

	// The product panel, where the player has one: a click that opens it is
	// a click on the product, so it is tracked like one.
	const open = onOpen
		? ( event ) => {
				event.preventDefault();
				stop( event );

				if ( onNavigate ) {
					onNavigate( link );
				}

				onOpen( link );
			}
		: null;

	const busy = state === 'adding';
	const buyText = directCheckoutText || __( 'Buy now', 'productreels' );
	const addText = addToCartText || __( 'Add to cart', 'productreels' );

	// What the one button is, before it is drawn in either look.
	let action = null;

	if ( directCheckout || showAddToCart ) {
		if ( ! product.in_stock ) {
			action = {
				kind: 'out',
				text: __( 'Out of stock', 'productreels' ),
			};
		} else if ( state === 'added' ) {
			action = {
				kind: 'link',
				icon: 'check',
				done: true,
				href: cartUrl || product.permalink,
				onClick: stop,
				text: __( 'View cart', 'productreels' ),
			};
		} else if ( ! product.purchasable ) {
			// Variable, grouped and external products need their own page.
			action = {
				kind: 'link',
				icon: 'chevron-right',
				href: product.permalink,
				onClick: navigate,
				text: __( 'Select options', 'productreels' ),
			};
		} else {
			action = {
				kind: 'button',
				icon: directCheckout ? 'zap' : 'cart',
				onClick: directCheckout ? buy : add,
				text: directCheckout ? buyText : addText,
			};
		}
	}

	/* `%1$s: %2$s` names the button after its product, for a round button
	   that shows only an icon. */
	const named = ( text ) =>
		sprintf(
			/* translators: 1: a button's text, e.g. "Add to cart"; 2: product name. */
			_x( '%1$s: %2$s', 'button text: product name', 'productreels' ),
			text,
			product.name
		);

	let button = null;
	let note = null;

	if ( classic && open ) {
		button = (
			<button
				type="button"
				className="prs-btn prs-btn--sm prs-btn--block prs-card__shop pr-t-body-strong"
				onClick={ open }
			>
				{ __( 'Shop now', 'productreels' ) }
			</button>
		);
	} else if ( action && action.kind === 'out' ) {
		// Nothing to press, so it is said rather than offered as a dead
		// button: under the price on a strip, in the button's place on a card.
		if ( classic ) {
			button = (
				<span
					className="prs-btn prs-btn--sm prs-btn--block pr-t-body-strong is-disabled"
					aria-disabled="true"
				>
					{ action.text }
				</span>
			);
		} else {
			note = (
				<span className="prs-card__note pr-t-caption">
					{ action.text }
				</span>
			);
		}
	} else if ( action && classic ) {
		const content = (
			<>
				<ReelIcon
					name={ busy ? 'loader' : action.icon }
					size={ 16 }
					className={ busy ? 'prs-spin' : undefined }
				/>
				{ busy && ! directCheckout
					? __( 'Adding…', 'productreels' )
					: action.text }
			</>
		);
		const className = `prs-btn prs-btn--sm prs-btn--block pr-t-body-strong${
			action.done ? ' is-done' : ''
		}`;

		button =
			action.kind === 'link' ? (
				<a
					ref={ actionRef }
					className={ className }
					href={ action.href }
					onClick={ action.onClick }
				>
					{ content }
				</a>
			) : (
				<button
					type="button"
					className={ className }
					disabled={ busy }
					aria-busy={ busy ? 'true' : undefined }
					onClick={ action.onClick }
				>
					{ content }
				</button>
			);
	} else if ( action ) {
		// A round icon by default; a pill with the text when asked, which
		// takes the same icons as the classic button.
		const text = buttonDisplay === 'text';
		let icon = 'plus';

		if ( busy ) {
			icon = 'loader';
		} else if ( action.kind === 'link' || text ) {
			icon = action.icon;
		} else if ( directCheckout ) {
			icon = 'zap';
		}

		const content = (
			<>
				<ReelIcon
					name={ icon }
					size={ text ? 14 : 16 }
					strokeWidth={ 2.25 }
					className={ busy ? 'prs-spin' : undefined }
				/>
				{ text && (
					<span className="prs-card__add-text pr-t-label">
						{ busy && ! directCheckout
							? __( 'Adding…', 'productreels' )
							: action.text }
					</span>
				) }
			</>
		);
		const className = `prs-card__add${ text ? ' prs-card__add--text' : '' }${
			action.done ? ' is-done' : ''
		}`;

		button =
			action.kind === 'link' ? (
				<a
					ref={ actionRef }
					className={ className }
					href={ action.href }
					aria-label={ named( action.text ) }
					onClick={ action.onClick }
				>
					{ content }
				</a>
			) : (
				<button
					type="button"
					className={ className }
					disabled={ busy }
					aria-busy={ busy ? 'true' : undefined }
					aria-label={ named( action.text ) }
					onClick={ action.onClick }
				>
					{ content }
				</button>
			);
	}

	return (
		<div className={ root } data-wr-no-swipe="" onPointerDown={ stop }>
			<a
				className="prs-card__thumb"
				href={ product.permalink }
				onClick={ open || navigate }
				tabIndex={ -1 }
				aria-hidden="true"
			>
				{ product.image && (
					<img
						src={ product.image }
						alt=""
						loading="lazy"
						decoding="async"
					/>
				) }
			</a>

			<span className="prs-card__text">
				<a
					className={ `prs-card__name ${
						classic ? 'pr-t-body-strong' : 'pr-t-label'
					}` }
					href={ product.permalink }
					onClick={ open || navigate }
				>
					{ product.name }
				</a>
				{ showRatings && product.rating_count > 0 && (
					<Stars
						rating={ product.rating }
						reviews={ classic ? product.rating_count : 0 }
					/>
				) }
				<Price
					html={ product.price_html }
					className={ classic ? 'pr-t-title' : undefined }
				/>
				{ note }
				{ classic && button }
			</span>

			{ ! classic && button }
		</div>
	);
};
