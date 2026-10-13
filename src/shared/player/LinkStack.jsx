/**
 * The links at the bottom of a slide.
 *
 * A custom link becomes a white pill, a product link a ProductCard. Every
 * click is reported to the tracker first — the tracker uses sendBeacon, so
 * the navigation that follows cannot cancel it.
 */

import { ProductCard } from '../ProductCard';

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
		<div className="prs-player__ctas wr-links" data-wr-no-swipe="">
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
						className={ [
							'prs-btn prs-btn--light prs-btn--block pr-t-body-strong wr-cta',
							link.customClass || '',
						]
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
						<span className="prs-btn__text">
							{ link.buttonText }
						</span>
					</a>
				);
			} ) }
		</div>
	);
};
