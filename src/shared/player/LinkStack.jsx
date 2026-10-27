/**
 * The links at the bottom of a slide.
 *
 * A custom link becomes a white pill, a product link a ProductCard. Every
 * click is reported to the tracker first — the tracker uses sendBeacon, so
 * the navigation that follows cannot cancel it.
 *
 * Classic cards fill the width of the reel, so they can be folded away: the
 * chevron above them hides the cards (not the custom links) until it is
 * pressed again.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ProductCard } from '../ProductCard';
import { ReelIcon } from '../ReelIcon';

export const LinkStack = ( {
	reel,
	links,
	styles,
	products,
	services,
	onToast,
	onOpenProduct,
} ) => {
	const [ folded, setFolded ] = useState( false );

	if ( ! links || links.length === 0 ) {
		return null;
	}

	const track = ( link ) => services.trackClick( reel, link );
	const classic = styles.productCardStyle === 'classic';
	const cards = links.some(
		( link ) =>
			link.btn_type === 'product' &&
			( ! products || products[ Number( link.product_id ) ] )
	);
	const shown = links.filter(
		( link ) => link.btn_type !== 'product' || ( cards && ! folded )
	);

	if ( shown.length === 0 && ! ( classic && cards ) ) {
		return null;
	}

	return (
		<div className="prs-player__ctas wr-links" data-wr-no-swipe="">
			{ classic && cards && (
				<button
					type="button"
					className="prs-iconbtn prs-player__fold"
					aria-expanded={ ! folded }
					aria-label={
						folded
							? __( 'Show products', 'productreels' )
							: __( 'Hide products', 'productreels' )
					}
					onPointerDown={ ( event ) => event.stopPropagation() }
					onClick={ ( event ) => {
						event.stopPropagation();
						setFolded( ( value ) => ! value );
					} }
				>
					<ReelIcon
						name={ folded ? 'chevron-up' : 'chevron-down' }
						size={ 18 }
					/>
				</button>
			) }
			{ shown.map( ( link ) => {
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
							buttonDisplay={ styles.buyButtonDisplay }
							cartUrl={ services.cartUrl }
							checkoutUrl={ services.checkoutUrl }
							onAddToCart={ ( item, from ) =>
								services.addToCart(
									item,
									from,
									1,
									undefined,
									reel
								)
							}
							onNavigate={ track }
							onOpen={ onOpenProduct }
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
