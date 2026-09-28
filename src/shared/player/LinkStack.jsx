/**
 * The links at the bottom of a slide.
 *
 * A custom link becomes a CTA button, a product link a ProductCard. Every
 * click is reported to the tracker first — the tracker uses sendBeacon, so
 * the navigation that follows cannot cancel it.
 */

import { ProductCard } from '../ProductCard';

const ArrowIcon = () => (
	<svg
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		strokeWidth="2.2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M7 17 17 7M8 7h9v9" />
	</svg>
);

export const LinkStack = ( {
	reel,
	links,
	styles,
	products,
	services,
	onToast,
} ) => {
	if ( ! links || links.length === 0 ) {
		return null;
	}

	const track = ( link ) => services.trackClick( reel, link );

	return (
		<div className="wr-links" data-wr-no-swipe="">
			{ links.map( ( link ) => {
				if ( link.btn_type === 'product' ) {
					// Answered, and this product is not for sale any more.
					if ( products && ! products[ Number( link.product_id ) ] ) {
						return null;
					}

					return (
						<ProductCard
							key={ link.btn_uuid }
							link={ link }
							product={
								products
									? products[ Number( link.product_id ) ]
									: undefined
							}
							variant={ styles.productCardStyle }
							showRatings={ styles.showRatings }
							showAddToCart={ styles.showAddToCart }
							addToCartText={ styles.addToCartText }
							directCheckout={ styles.directCheckout }
							directCheckoutText={ styles.directCheckoutText }
							cartUrl={ services.cartUrl }
							checkoutUrl={ services.checkoutUrl }
							onAddToCart={ services.addToCart }
							onNavigate={ track }
							onToast={ onToast }
						/>
					);
				}

				return (
					<a
						key={ link.btn_uuid }
						className={ [ 'wr-cta', link.customClass || '' ]
							.filter( Boolean )
							.join( ' ' ) }
						href={ link.buttonUrl }
						target={ link.openInNewTab ? '_blank' : undefined }
						rel={
							link.openInNewTab
								? 'noopener noreferrer'
								: undefined
						}
						onPointerDown={ ( event ) => event.stopPropagation() }
						onClick={ ( event ) => {
							event.stopPropagation();
							track( link );
						} }
					>
						<span className="wr-cta__text">
							{ link.buttonText }
						</span>
						<ArrowIcon />
					</a>
				);
			} ) }
		</div>
	);
};
