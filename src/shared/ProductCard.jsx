/**
 * A tagged WooCommerce product inside the player.
 *
 * Two looks, both shipped: "modern" is a glassy strip across the bottom of
 * the frame; "classic" is a compact opaque card in the lower corner. The
 * price arrives as HTML that WooCommerce has already formatted, so currency,
 * tax display and sale strike-throughs match the rest of the store exactly.
 *
 * One button, in one of two flavours: Add to cart keeps the shopper on the
 * page and offers "View cart" once it lands; Buy now adds the product and
 * goes straight to checkout. The editor keeps the two flags exclusive, and
 * if both somehow arrive on, Buy now wins — the more deliberate choice.
 *
 * Clicking the title or the image navigates — and must not toggle playback
 * on the way out, so those clicks stop before they reach the tap layer.
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const Star = ( { fill } ) => (
	<svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
		<defs>
			<linearGradient
				id={ `wr-star-${ fill }` }
				x1="0"
				x2="1"
				y1="0"
				y2="0"
			>
				<stop offset={ `${ fill * 100 }%` } stopColor="currentColor" />
				<stop
					offset={ `${ fill * 100 }%` }
					stopColor="currentColor"
					stopOpacity="0.25"
				/>
			</linearGradient>
		</defs>
		<path
			d="m10 1.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8L10 1.6Z"
			fill={ `url(#wr-star-${ fill })` }
		/>
	</svg>
);

export const Stars = ( { rating, count } ) => {
	const value = Math.max( 0, Math.min( 5, Number( rating ) || 0 ) );

	return (
		<span
			className="wr-stars"
			role="img"
			aria-label={ `${ value.toFixed( 1 ) } / 5` }
			title={ count ? `${ value.toFixed( 1 ) } (${ count })` : undefined }
		>
			{ [ 0, 1, 2, 3, 4 ].map( ( index ) => (
				<Star
					key={ index }
					fill={
						Math.round(
							Math.min( 1, Math.max( 0, value - index ) ) * 4
						) / 4
					}
				/>
			) ) }
		</span>
	);
};

/* The tick's stroke draws itself in; the stylesheet animates the dash. */
const Check = () => (
	<svg
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		strokeWidth="2.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="m5 12.5 4.5 4.5L19 7.5" />
	</svg>
);

const Spinner = () => (
	<svg
		className="wr-spin"
		viewBox="0 0 24 24"
		width="14"
		height="14"
		fill="none"
		stroke="currentColor"
		strokeWidth="2.5"
		strokeLinecap="round"
		aria-hidden="true"
	>
		<path d="M12 3a9 9 0 1 0 9 9" />
	</svg>
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
	cartUrl,
	checkoutUrl,
	onAddToCart,
	onNavigate,
	onToast,
} ) => {
	const [ state, setState ] = useState( 'idle' );

	// Loading — the batch lookup has not answered yet. Keep the box the size
	// it will be so the link stack does not jump when it does.
	if ( ! product ) {
		return (
			<div
				className={ `wr-product wr-product--${ variant } is-loading` }
				aria-busy="true"
				data-wr-no-swipe=""
			>
				<span className="wr-product__img wr-product__img--blank" />
				<span className="wr-product__text">
					<span className="wr-product__line" />
					<span className="wr-product__line wr-product__line--short" />
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
							__(
								'Failed to add to cart: %s',
								'productreels-shoppable-video-reels-for-woocommerce'
							),
							error.message
						)
					: __(
							'Failed to add to cart. Please try again.',
							'productreels-shoppable-video-reels-for-woocommerce'
						)
			);
		}
	};

	const add = async ( event ) => {
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
			setState( 'added' );

			if ( onToast ) {
				onToast(
					'success',
					__(
						'Product added to cart!',
						'productreels-shoppable-video-reels-for-woocommerce'
					)
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

	let action = null;

	if ( directCheckout || showAddToCart ) {
		if ( ! product.in_stock ) {
			action = (
				<span
					className="wr-product__btn is-disabled"
					aria-disabled="true"
				>
					{ __(
						'Out of stock',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				</span>
			);
		} else if ( state === 'added' ) {
			action = (
				<a
					className="wr-product__btn wr-product__btn--done"
					href={ cartUrl || product.permalink }
					onClick={ stop }
				>
					<Check />
					{ __(
						'View cart',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				</a>
			);
		} else if ( ! product.purchasable ) {
			// Variable, grouped and external products need their own page.
			action = (
				<a
					className="wr-product__btn"
					href={ product.permalink }
					onClick={ navigate }
				>
					{ __(
						'Select options',
						'productreels-shoppable-video-reels-for-woocommerce'
					) }
				</a>
			);
		} else if ( directCheckout ) {
			action = (
				<button
					type="button"
					className="wr-product__btn wr-product__btn--buy"
					disabled={ state === 'adding' }
					aria-busy={ state === 'adding' ? 'true' : undefined }
					onClick={ buy }
				>
					{ state === 'adding' && <Spinner /> }
					{ directCheckoutText ||
						__(
							'Buy now',
							'productreels-shoppable-video-reels-for-woocommerce'
						) }
				</button>
			);
		} else {
			action = (
				<button
					type="button"
					className="wr-product__btn"
					disabled={ state === 'adding' }
					aria-busy={ state === 'adding' ? 'true' : undefined }
					onClick={ add }
				>
					{ state === 'adding' && <Spinner /> }
					{ state === 'adding'
						? __(
								'Adding…',
								'productreels-shoppable-video-reels-for-woocommerce'
							)
						: addToCartText ||
							__(
								'Add to cart',
								'productreels-shoppable-video-reels-for-woocommerce'
							) }
				</button>
			);
		}
	}

	return (
		<div
			className={ `wr-product wr-product--${ variant }` }
			data-wr-no-swipe=""
			onPointerDown={ stop }
		>
			<a
				className="wr-product__img"
				href={ product.permalink }
				onClick={ navigate }
				tabIndex={ -1 }
				aria-hidden="true"
			>
				{ product.image ? (
					<img
						src={ product.image }
						alt=""
						loading="lazy"
						decoding="async"
					/>
				) : (
					<span className="wr-product__img--blank" />
				) }
			</a>

			<span className="wr-product__text">
				<a
					className="wr-product__name"
					href={ product.permalink }
					onClick={ navigate }
				>
					{ product.name }
				</a>
				{ /* WooCommerce formats this string itself; it is the same markup the shop page prints. */ }
				<span
					className="wr-product__price"
					dangerouslySetInnerHTML={ {
						__html: product.price_html || '',
					} }
				/>
				{ showRatings && product.rating_count > 0 && (
					<span className="wr-product__rating">
						<Stars
							rating={ product.rating }
							count={ product.rating_count }
						/>
						<span className="wr-product__rating-count">
							({ product.rating_count })
						</span>
					</span>
				) }
			</span>

			{ action && <span className="wr-product__action">{ action }</span> }
		</div>
	);
};
